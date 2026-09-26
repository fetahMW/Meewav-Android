#include <jni.h>
#include <cstdint>
#include <cstring>
#include "MeeWavTrackAnalysis.h"

extern "C" JNIEXPORT jlong JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_create(JNIEnv*, jobject, jint rate, jint) {
    return reinterpret_cast<jlong>(new MeeWavTrackAnalysis(rate));
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_process(JNIEnv* env, jobject, jlong handle, jobject pcm, jint offset, jint bytes, jint channels, jboolean floating) {
    auto* track=reinterpret_cast<MeeWavTrackAnalysis*>(handle);
    auto* base=static_cast<uint8_t*>(env->GetDirectBufferAddress(pcm));
    if(!track || !base || channels<1 || offset<0 || bytes<0 || static_cast<jlong>(offset)+bytes>env->GetDirectBufferCapacity(pcm))return;
    const int width=floating?4:2, frames=bytes/width/channels;
    for(int frame=0;frame<frames;++frame) {
        float mono=0;
        for(int channel=0;channel<channels;++channel) {
            const auto* address=base+offset+(frame*channels+channel)*width;
            if(floating){float value;std::memcpy(&value,address,4);mono+=value;}
            else{int16_t value;std::memcpy(&value,address,2);mono+=value/32768.f;}
        }
        track->add(mono/channels);
    }
}
extern "C" JNIEXPORT jfloatArray JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_results(JNIEnv* env, jobject, jlong handle) {
    auto* track=reinterpret_cast<MeeWavTrackAnalysis*>(handle);
    const auto values=track?track->result():std::array<float,2>{0,-1};
    auto output=env->NewFloatArray(2);
    if(output)env->SetFloatArrayRegion(output,0,2,values.data());
    return output;
}
extern "C" JNIEXPORT void JNICALL
Java_com_meewav_android_features_rooms_wave_MusicalTrackAnalyzer_release(JNIEnv*, jobject, jlong handle) {
    delete reinterpret_cast<MeeWavTrackAnalysis*>(handle);
}
