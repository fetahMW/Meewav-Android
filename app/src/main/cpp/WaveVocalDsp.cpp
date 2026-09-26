#include <jni.h>
#include <array>
#include <algorithm>
#include "MeeWavVoiceDsp.h"
#include "WaveNoiseSuppressor.h"
#include "WaveFreeEffects.h"

// Owned and processed exclusively by the microphone thread. Production never enters here.
struct VocalDsp {
    MeeWavPitchCorrection tune;
    MeeWavReverb reverb;
    WaveNoiseSuppressor expander;
    WaveFreeEffects freeEffects;
    std::array<float, 960> input{};
};
extern "C" JNIEXPORT jlong JNICALL
Java_com_meewav_android_features_rooms_wave_WaveVocalDsp_create(JNIEnv*, jobject) {
    return reinterpret_cast<jlong>(new VocalDsp());
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_WaveVocalDsp_process(JNIEnv* env, jobject, jlong handle,
    jfloatArray samples, jboolean enabled, jint scale, jboolean reverb, jfloat amount, jboolean cleanVoice, jint calibration, jint effects) {
    auto* dsp = reinterpret_cast<VocalDsp*>(handle);
    if (!dsp || env->GetArrayLength(samples) != 960) return;
    env->GetFloatArrayRegion(samples, 0, 960, dsp->input.data());
    dsp->expander.process(dsp->input.data(), 480, cleanVoice, calibration);
    dsp->tune.processStereo(dsp->input.data(), 480, enabled, std::clamp<int>(scale, 0, 12));
    const float reverbPosition = std::clamp<float>(amount, 0, 1);
    dsp->reverb.processStereo(dsp->input.data(), 480, reverb, reverbPosition * reverbPosition);
    dsp->freeEffects.process(dsp->input.data(), 480, effects);
    env->SetFloatArrayRegion(samples, 0, 960, dsp->input.data());
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_WaveVocalDsp_release(JNIEnv*, jobject, jlong handle) {
    delete reinterpret_cast<VocalDsp*>(handle);
}
