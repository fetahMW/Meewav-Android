#include <jni.h>
#include <oboe/Oboe.h>
#include <oboe/FullDuplexStream.h>
#include <array>
#include <atomic>
#include <algorithm>
#include <sstream>
#include <time.h>
#include "SuperpoweredRuntime.h"
#include "WaveNoiseSuppressor.h"
#include "SuperpoweredAutomaticVocalPitchCorrection.h"
#include "SuperpoweredReverb.h"

// The hardware output clock pulls the input and renders the headphones in the
// same native callback, like iOS RemoteIO. Java/RTC only consume a separate copy.
class WaveNativeDuplex final : public oboe::FullDuplexStream, public oboe::AudioStreamErrorCallback {
public:
    static constexpr int frames = 96;
    static constexpr int packetSamples = 960;
    static constexpr unsigned capacity = 8;
    std::shared_ptr<oboe::AudioStream> input, output;
    std::atomic<int> failure{0}, flags{0}, scale{0};
    std::atomic<float> gain{0}, mix{.15f};
    std::atomic<unsigned> writeIndex{0}, readIndex{0}, shortReads{0}, callbacks{0}, dropped{0};
    std::array<std::array<float, packetSamples>, capacity> packets{};
    std::array<float, packetSamples> packet{};
    int packetOffset = 0;
    std::array<float, frames * 2> voice{}, tuned{};
    Superpowered::AutomaticVocalPitchCorrection tune;
    Superpowered::Reverb reverb{48000, 48000};
    WaveNoiseSuppressor expander;
    std::atomic<float> capturedPeak{0}, monitorPeak{0};
    std::atomic<int> calibration{0};

    WaveNativeDuplex() {
        tune.samplerate = 48000;
        tune.range = Superpowered::AutomaticVocalPitchCorrection::WIDE;
        tune.speed = Superpowered::AutomaticVocalPitchCorrection::EXTREME;
        tune.clamp = Superpowered::AutomaticVocalPitchCorrection::OFF;
        tune.frequencyOfA = 440;
    }
    ~WaveNativeDuplex() {
        // close() joins/stops the native callbacks before any DSP or queue is freed.
        if (output) { output->requestStop(); output->close(); }
        if (input) { input->requestStop(); input->close(); }
    }
    bool open(int inputId, int outputId, bool rawInput) {
        oboe::AudioStreamBuilder out;
        out.setDirection(oboe::Direction::Output)
            ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
            ->setSharingMode(oboe::SharingMode::Exclusive)
            ->setFormat(oboe::AudioFormat::Float)->setChannelCount(2)
            ->setSampleRate(48000)->setSampleRateConversionQuality(oboe::SampleRateConversionQuality::Fastest)
            ->setFormatConversionAllowed(true)->setFramesPerDataCallback(frames)
            ->setUsage(oboe::Usage::Media)->setContentType(oboe::ContentType::Speech)
            ->setDeviceId(outputId)->setDataCallback(this)->setErrorCallback(this);
        if (out.openStream(output) != oboe::Result::OK) return false;
        oboe::AudioStreamBuilder in;
        in.setDirection(oboe::Direction::Input)
            ->setPerformanceMode(oboe::PerformanceMode::LowLatency)
            ->setSharingMode(oboe::SharingMode::Exclusive)
            ->setFormat(oboe::AudioFormat::Float)->setChannelCount(1)
            ->setSampleRate(48000)->setSampleRateConversionQuality(oboe::SampleRateConversionQuality::Fastest)
            ->setFormatConversionAllowed(true)->setInputPreset(rawInput ? oboe::InputPreset::Unprocessed : oboe::InputPreset::VoiceRecognition)
            ->setBufferCapacityInFrames(output->getBufferCapacityInFrames() * 2)
            ->setDeviceId(inputId)->setErrorCallback(this);
        if (in.openStream(input) != oboe::Result::OK) return false;
        if (input->getSampleRate() != 48000 || output->getSampleRate() != 48000) return false;
        setInputStream(input.get());
        setOutputStream(output.get());
        output->setBufferSizeInFrames(output->getFramesPerBurst() * 2);
        return start() == oboe::Result::OK;
    }
    bool onError(oboe::AudioStream*, oboe::Result error) override {
        failure.store(static_cast<int>(error));
        // The Kotlin owner closes/reopens on its control thread, never this callback.
        return true;
    }
    oboe::DataCallbackResult onBothStreamsReady(const void* data, int available,
                                               void* destination, int count) override {
        auto* out = static_cast<float*>(destination);
        std::fill_n(out, count * 2, 0.f);
        if (count != frames) { failure.store(-1); return oboe::DataCallbackResult::Stop; }
        callbacks.fetch_add(1, std::memory_order_relaxed);
        if (available < count) shortReads.fetch_add(1, std::memory_order_relaxed);
        const auto* mono = static_cast<const float*>(data);
        for (int i = 0; i < count; ++i) voice[i * 2] = voice[i * 2 + 1] = i < available ? mono[i] : 0.f;
        float inputPeak = 0;
        for (int i=0;i<count*2;++i) inputPeak = std::max(inputPeak, std::abs(voice[i]));
        capturedPeak.store(std::max(capturedPeak.load(), inputPeak));
        const int state = flags.load(std::memory_order_relaxed);
        expander.process(voice.data(), count, (state & 32) != 0, calibration.load());
        if (state & 4) {
            tune.scale = static_cast<Superpowered::AutomaticVocalPitchCorrection::TunerScale>(scale.load());
            tune.process(voice.data(), tuned.data(), true, count);
            for (int i = 0; i < count * 2; ++i) voice[i] = tuned[i] * .98f + voice[i] * .02f;
        }
        if (state & 8) {
            reverb.enabled = true;
            reverb.mix = mix.load();
            reverb.process(voice.data(), voice.data(), count);
        } else reverb.enabled = false;
        const float volume = gain.load(std::memory_order_relaxed);
        float renderedPeak = 0;
        for (int i = 0; i < count * 2; ++i) {
            if ((state & 3) == 1) out[i] = std::clamp(voice[i] * volume, -.98f, .98f);
            renderedPeak = std::max(renderedPeak, std::abs(out[i]));
            packet[packetOffset++] = voice[i];
            if (packetOffset == packetSamples) {
                const unsigned w = writeIndex.load(std::memory_order_relaxed);
                if (w - readIndex.load(std::memory_order_acquire) < capacity) {
                    packets[w % capacity] = packet;
                    writeIndex.store(w + 1, std::memory_order_release);
                } else dropped.fetch_add(1, std::memory_order_relaxed);
                packetOffset = 0;
            }
        }
        monitorPeak.store(std::max(monitorPeak.load(), renderedPeak));
        return oboe::DataCallbackResult::Continue;
    }
};

extern "C" JNIEXPORT jlong JNICALL
Java_com_meewav_android_features_rooms_wave_WaveNativeDuplex_open(JNIEnv* env, jobject, jstring key, jint in, jint out, jboolean rawInput) {
    const char* license = env->GetStringUTFChars(key, nullptr);
    if (!license) return 0;
    initializeSuperpowered(license);
    env->ReleaseStringUTFChars(key, license);
    auto engine = std::make_unique<WaveNativeDuplex>();
    if (!engine->open(in, out, rawInput)) return 0;
    return reinterpret_cast<jlong>(engine.release());
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_WaveNativeDuplex_configure(JNIEnv*, jobject, jlong h, jint flags, jfloat gain, jint scale, jfloat mix, jint calibration) {
    auto* engine = reinterpret_cast<WaveNativeDuplex*>(h);
    engine->gain.store(std::clamp(gain, 0.f, 1.f));
    engine->scale.store(std::clamp<int>(scale, 0, 12));
    engine->mix.store(std::clamp(mix, 0.f, 1.f));
    engine->calibration.store(calibration);
    engine->flags.store(flags);
}
extern "C" JNIEXPORT jint JNICALL
Java_com_meewav_android_features_rooms_wave_WaveNativeDuplex_read(JNIEnv* env, jobject, jlong h, jfloatArray samples) {
    auto* engine = reinterpret_cast<WaveNativeDuplex*>(h);
    if (engine->failure.load() != 0) return -1;
    unsigned r = engine->readIndex.load(std::memory_order_relaxed);
    const unsigned w = engine->writeIndex.load(std::memory_order_acquire);
    if (w == r) return 0;
    // Only RTC can fall behind. Never delay the private headphone callback for it.
    if (w - r > 3) r = w - 3;
    env->SetFloatArrayRegion(samples, 0, WaveNativeDuplex::packetSamples, engine->packets[r % WaveNativeDuplex::capacity].data());
    engine->readIndex.store(r + 1, std::memory_order_release);
    return 1;
}
extern "C" JNIEXPORT jstring JNICALL
Java_com_meewav_android_features_rooms_wave_WaveNativeDuplex_diagnostics(JNIEnv* env, jobject, jlong h) {
    auto* e = reinterpret_cast<WaveNativeDuplex*>(h);
    auto latency = e->output->calculateLatencyMillis();
    auto xruns = e->output->getXRunCount();
    auto available = e->input->getAvailableFrames();
    // These are driver timestamp estimates, not an acoustic loopback measurement.
    // Read counters around the timestamp query: discard a sample spanning callbacks.
    const auto consumedBefore = e->input->getFramesRead();
    const auto inputTime = e->input->getTimestamp(CLOCK_MONOTONIC);
    const auto consumedAfter = e->input->getFramesRead();
    timespec now{}; clock_gettime(CLOCK_MONOTONIC, &now);
    double captureAge = -1;
    if (inputTime && consumedBefore == consumedAfter) {
        const double capturedAt = inputTime.value().timestamp +
            (consumedAfter - inputTime.value().position) * (1e9 / 48000.0);
        captureAge = (now.tv_sec * 1e9 + now.tv_nsec - capturedAt) / 1e6;
    }
    std::ostringstream s;
    s << "native duplex inputBurst=" << e->input->getFramesPerBurst()
      << " outputBurst=" << e->output->getFramesPerBurst()
      << " outputBuffer=" << e->output->getBufferSizeInFrames()
      << " outputLatencyMs=" << (latency ? latency.value() : -1)
      << " captureAgeEstimateMs=" << captureAge
      << " roundTripEstimateMs=" << (latency && captureAge >= 0 ? captureAge + latency.value() : -1)
      << " xruns=" << (xruns ? xruns.value() : -1)
      << " shortReads=" << e->shortReads.load() << " callbacks=" << e->callbacks.load()
      << " rtcDropped=" << e->dropped.load()
      << " inputQueuedFrames=" << (available ? available.value() : -1)
      << " inputPreset=" << static_cast<int>(e->input->getInputPreset())
      << " noiseBufferedFrames=0"
      << " effectFlags=" << e->flags.load()
      << " gain=" << e->gain.load()
      << " capturedPeak=" << e->capturedPeak.exchange(0)
      << " monitorPeak=" << e->monitorPeak.exchange(0)
      << " inputMode=" << static_cast<int>(e->input->getPerformanceMode())
      << " outputMode=" << static_cast<int>(e->output->getPerformanceMode())
      << " inputSharing=" << static_cast<int>(e->input->getSharingMode())
      << " outputSharing=" << static_cast<int>(e->output->getSharingMode())
      << " inputDevice=" << e->input->getDeviceId() << " outputDevice=" << e->output->getDeviceId();
    return env->NewStringUTF(s.str().c_str());
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_WaveNativeDuplex_close(JNIEnv*, jobject, jlong h) {
    delete reinterpret_cast<WaveNativeDuplex*>(h);
}
