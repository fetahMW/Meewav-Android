// Deterministic DSP verification. No microphone, network, or third-party runtime.
#include <cmath>
#include <cstdio>
#include <vector>
#include <chrono>
#include "MeeWavVoiceDsp.h"
#include "MeeWavTrackAnalysis.h"
static constexpr double pi=3.14159265358979323846;
static double power(const std::vector<float>& samples,double frequency) {
    double real=0,imaginary=0;
    for(size_t i=0;i<samples.size();++i){real+=samples[i]*std::cos(2*pi*frequency*i/48000);imaginary+=samples[i]*std::sin(2*pi*frequency*i/48000);}
    return real*real+imaginary*imaginary;
}
int main(){
    MeeWavPitchCorrection tune;
    float block[192];std::vector<float> corrected;
    const auto started=std::chrono::steady_clock::now();
    for(int n=0;n<2000;++n){
        for(int i=0;i<96;++i)block[2*i]=block[2*i+1]=.2f*std::sin(2*pi*228*(n*96+i)/48000);
        tune.processStereo(block,96,true,1);
        for(int i=0;i<96;++i){if(!std::isfinite(block[2*i])||std::abs(block[2*i])>.25f)return 2;if(n>1000)corrected.push_back(block[2*i]);}
    }
    if(power(corrected,220)<power(corrected,228)*4){std::puts("FAIL pitch did not converge to A in C major");return 3;}
    for(int n=0;n<100;++n){for(float&v:block)v=.1f;tune.processStereo(block,96,false,1);}
    for(float v:block)if(std::abs(v-.1f)>1e-6)return 4;
    MeeWavReverb reverb;double tail=0;
    for(int n=0;n<500;++n){for(float&v:block)v=0;if(n==0)block[0]=block[1]=1;reverb.processStereo(block,96,true,.5f);
        for(float v:block){if(!std::isfinite(v)||std::abs(v)>1.01)return 5;if(n>1)tail+=v*v;}}
    if(tail<1e-4)return 6;
    MeeWavTrackAnalysis silence(48000),analysis(48000);
    for(int i=0;i<48000*12;++i){silence.add(0);int beat=i%24000;float envelope=beat<2400?std::exp(-beat/350.f):0;
        float sample=.3f*envelope*std::sin(2*pi*90*i/48000);
        sample+=.06f*(std::sin(2*pi*261.6256*i/48000)+std::sin(2*pi*329.6276*i/48000)+std::sin(2*pi*391.9954*i/48000));analysis.add(sample);}
    auto quiet=silence.result(),music=analysis.result();
    if(quiet[0]!=0||quiet[1]!=-1)return 7;
    std::printf("Analysis bpm=%.2f key=%.0f\n",music[0],music[1]);
    if(std::abs(music[0]-120)>2 || music[1]!=3)return 8;
    std::printf("PASS: pitch convergence, dry bypass, stable reverb, silence, 120 BPM C major; %.1f ms\n",std::chrono::duration<double,std::milli>(std::chrono::steady_clock::now()-started).count());
}
