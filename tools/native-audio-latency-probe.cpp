// ADB diagnostic only: raw wired monitoring, no recording or network publication.
// Arguments: inputDevice outputDevice sharing(0 exclusive,1 shared).
#include <aaudio/AAudio.h>
#include <algorithm>
#include <atomic>
#include <cstdio>
#include <cstdlib>
#include <ctime>
#include <unistd.h>
struct Probe {
    AAudioStream* input=nullptr;
    std::atomic<int> shortReads{0};
    int warmup=20;
    float mono[4096]{};
};
aaudio_data_callback_result_t render(AAudioStream*,void* user,void* data,int32_t frames) {
    auto& p=*static_cast<Probe*>(user);auto* out=static_cast<float*>(data);
    std::fill_n(out,frames*2,0.f);
    if(frames>4096)return AAUDIO_CALLBACK_RESULT_STOP;
    int read=AAudioStream_read(p.input,p.mono,frames,0);
    if(p.warmup>0) { while(read>0)read=AAudioStream_read(p.input,p.mono,frames,0);--p.warmup;return AAUDIO_CALLBACK_RESULT_CONTINUE; }
    if(read<frames)++p.shortReads;
    for(int i=0;i<std::max(0,read);++i)out[i*2]=out[i*2+1]=std::clamp(p.mono[i]*.72f,-.98f,.98f);
    return AAUDIO_CALLBACK_RESULT_CONTINUE;
}
double nowNs(){timespec t{};clock_gettime(CLOCK_MONOTONIC,&t);return t.tv_sec*1e9+t.tv_nsec;}
int main(int argc,char**argv){
    if(argc!=4)return 2;Probe p;AAudioStream *output=nullptr;AAudioStreamBuilder* b=nullptr;
    const auto sharing=std::atoi(argv[3]);
    AAudio_createStreamBuilder(&b);AAudioStreamBuilder_setDirection(b,AAUDIO_DIRECTION_OUTPUT);
    AAudioStreamBuilder_setDeviceId(b,std::atoi(argv[2]));AAudioStreamBuilder_setChannelCount(b,2);
    AAudioStreamBuilder_setSampleRate(b,48000);AAudioStreamBuilder_setFormat(b,AAUDIO_FORMAT_PCM_FLOAT);
    AAudioStreamBuilder_setPerformanceMode(b,AAUDIO_PERFORMANCE_MODE_LOW_LATENCY);AAudioStreamBuilder_setSharingMode(b,sharing);
    AAudioStreamBuilder_setUsage(b,AAUDIO_USAGE_MEDIA);AAudioStreamBuilder_setContentType(b,AAUDIO_CONTENT_TYPE_SPEECH);
    AAudioStreamBuilder_setFramesPerDataCallback(b,96);AAudioStreamBuilder_setDataCallback(b,render,&p);
    int result=AAudioStreamBuilder_openStream(b,&output);AAudioStreamBuilder_delete(b);
    if(result!=0){printf("output open failed %d\n",result);return 3;}
    AAudio_createStreamBuilder(&b);AAudioStreamBuilder_setDirection(b,AAUDIO_DIRECTION_INPUT);
    AAudioStreamBuilder_setDeviceId(b,std::atoi(argv[1]));AAudioStreamBuilder_setChannelCount(b,1);
    AAudioStreamBuilder_setSampleRate(b,48000);AAudioStreamBuilder_setFormat(b,AAUDIO_FORMAT_PCM_FLOAT);
    AAudioStreamBuilder_setPerformanceMode(b,AAUDIO_PERFORMANCE_MODE_LOW_LATENCY);AAudioStreamBuilder_setSharingMode(b,sharing);
    AAudioStreamBuilder_setInputPreset(b,AAUDIO_INPUT_PRESET_VOICE_RECOGNITION);
    result=AAudioStreamBuilder_openStream(b,&p.input);AAudioStreamBuilder_delete(b);
    if(result!=0){printf("input open failed %d\n",result);AAudioStream_close(output);return 4;}
    AAudioStream_setBufferSizeInFrames(output,AAudioStream_getFramesPerBurst(output)*2);
    printf("sharing requested=%d actual input=%d output=%d devices=%d/%d burst=%d/%d\n",sharing,
        AAudioStream_getSharingMode(p.input),AAudioStream_getSharingMode(output),AAudioStream_getDeviceId(p.input),AAudioStream_getDeviceId(output),
        AAudioStream_getFramesPerBurst(p.input),AAudioStream_getFramesPerBurst(output));
    AAudioStream_requestStart(p.input);AAudioStream_requestStart(output);
    for(int n=0;n<6;++n){sleep(1);int64_t ip=0,it=0,op=0,ot=0;
        int ir=AAudioStream_getTimestamp(p.input,CLOCK_MONOTONIC,&ip,&it),orr=AAudioStream_getTimestamp(output,CLOCK_MONOTONIC,&op,&ot);
        auto read=AAudioStream_getFramesRead(p.input),written=AAudioStream_getFramesWritten(output);double now=nowNs();
        double capture=(now-(it+(read-ip)*1e9/48000))/1e6,playback=(ot+(written-op)*1e9/48000-now)/1e6;
        printf("inputAgeMs=%.3f outputMs=%.3f totalEstimateMs=%.3f timestampResult=%d/%d shortReads=%d xruns=%d\n",capture,playback,capture+playback,ir,orr,p.shortReads.load(),AAudioStream_getXRunCount(output));fflush(stdout);
    }
    AAudioStream_requestStop(output);AAudioStream_close(output);AAudioStream_requestStop(p.input);AAudioStream_close(p.input);
}
