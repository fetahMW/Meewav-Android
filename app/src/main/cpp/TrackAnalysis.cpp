#include <jni.h>
#include <mutex>
#include <vector>
#include <cstdint>
#include "Superpowered.h"
#include "SuperpoweredAnalyzer.h"
#include "SuperpoweredRuntime.h"

// Android adapter of iOS PlaceSuperpoweredTrackAnalyzer.mm. Same offline engine/settings.
struct TrackAnalysis {
    Superpowered::Analyzer analyzer;
    std::vector<float> stereo;
    TrackAnalysis(int rate, int seconds): analyzer(rate, seconds) {}
};
extern "C" JNIEXPORT jlong JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_create(JNIEnv* env, jobject, jint rate, jint seconds, jstring key) {
    const char* license = env->GetStringUTFChars(key, nullptr);
    if (!license) return 0;
    initializeSuperpowered(license);
    env->ReleaseStringUTFChars(key, license);
    return reinterpret_cast<jlong>(new TrackAnalysis(rate, seconds));
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_process(JNIEnv* env, jobject, jlong handle, jobject pcm, jint offset, jint bytes, jint channels, jboolean floating) {
    auto* track = reinterpret_cast<TrackAnalysis*>(handle);
    auto* base = static_cast<uint8_t*>(env->GetDirectBufferAddress(pcm));
    if (!track || !base || channels < 1 || offset < 0 || bytes < 0 || static_cast<jlong>(offset) + bytes > env->GetDirectBufferCapacity(pcm)) return;
    const int frames = bytes / (floating ? 4 : 2) / channels;
    track->stereo.resize(frames * 2);
    const auto* floats = reinterpret_cast<const float*>(base + offset);
    const auto* shorts = reinterpret_cast<const int16_t*>(base + offset);
    for (int frame = 0; frame < frames; ++frame) {
        const int left = frame * channels, right = left + (channels > 1 ? 1 : 0);
        track->stereo[frame * 2] = floating ? floats[left] : shorts[left] / 32768.0f;
        track->stereo[frame * 2 + 1] = floating ? floats[right] : shorts[right] / 32768.0f;
    }
    track->analyzer.process(track->stereo.data(), frames);
}
extern "C" JNIEXPORT jfloatArray JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_results(JNIEnv* env, jobject, jlong handle) {
    auto* track = reinterpret_cast<TrackAnalysis*>(handle);
    track->analyzer.makeResults(60, 200, 0, 0, false, 0, false, false, true);
    float values[] = {track->analyzer.bpm, static_cast<float>(track->analyzer.keyIndex)};
    auto output = env->NewFloatArray(2);
    if (output) env->SetFloatArrayRegion(output, 0, 2, values);
    return output;
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_release(JNIEnv*, jobject, jlong handle) {
    delete reinterpret_cast<TrackAnalysis*>(handle);
}
