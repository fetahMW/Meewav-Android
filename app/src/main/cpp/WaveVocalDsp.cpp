#include <jni.h>
#include <array>
#include <algorithm>
#include "SuperpoweredRuntime.h"
#include "SuperpoweredAutomaticVocalPitchCorrection.h"
#include "SuperpoweredReverb.h"

// Owned and processed exclusively by the microphone thread. Production never enters here.
struct VocalDsp {
    Superpowered::AutomaticVocalPitchCorrection tune;
    Superpowered::Reverb reverb{48000, 48000};
    std::array<float, 960> input{}, tuned{};
    VocalDsp() {
        tune.samplerate = 48000;
        tune.range = Superpowered::AutomaticVocalPitchCorrection::WIDE;
        tune.speed = Superpowered::AutomaticVocalPitchCorrection::EXTREME;
        tune.clamp = Superpowered::AutomaticVocalPitchCorrection::OFF;
        tune.frequencyOfA = 440;
    }
};
extern "C" JNIEXPORT jlong JNICALL
Java_com_meewav_android_features_rooms_wave_WaveVocalDsp_create(JNIEnv* env, jobject, jstring key) {
    const char* license = env->GetStringUTFChars(key, nullptr);
    if (!license) return 0;
    initializeSuperpowered(license);
    env->ReleaseStringUTFChars(key, license);
    return reinterpret_cast<jlong>(new VocalDsp());
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_WaveVocalDsp_process(JNIEnv* env, jobject, jlong handle,
    jfloatArray samples, jboolean enabled, jint scale, jboolean reverb, jfloat amount) {
    auto* dsp = reinterpret_cast<VocalDsp*>(handle);
    if (!dsp || env->GetArrayLength(samples) != 960) return;
    env->GetFloatArrayRegion(samples, 0, 960, dsp->input.data());
    dsp->tune.scale = static_cast<Superpowered::AutomaticVocalPitchCorrection::TunerScale>(std::clamp<int>(scale, 0, 12));
    if (enabled) {
        dsp->tune.process(dsp->input.data(), dsp->tuned.data(), true, 480);
        for (int i=0; i<960; ++i) dsp->input[i] = dsp->tuned[i] * .98f + dsp->input[i] * .02f;
    }
    dsp->reverb.enabled = reverb;
    dsp->reverb.mix = std::clamp<float>(amount, 0, 1);
    dsp->reverb.process(dsp->input.data(), dsp->input.data(), 480);
    env->SetFloatArrayRegion(samples, 0, 960, dsp->input.data());
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_WaveVocalDsp_release(JNIEnv*, jobject, jlong handle) {
    delete reinterpret_cast<VocalDsp*>(handle);
}
