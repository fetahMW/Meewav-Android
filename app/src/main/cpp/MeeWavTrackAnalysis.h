#pragma once
#include <array>
#include <vector>
#include <complex>
#include <algorithm>
#include <cmath>

// Original offline MeeWav PCM analysis: spectral flux tempo estimation and
// pitch-class profile correlation. No licence or third-party DSP runtime.
class MeeWavTrackAnalysis {
    static constexpr int size=2048, hopSize=256;
    static constexpr double rate=12000., pi=3.14159265358979323846;
    std::array<float,size> ring{};
    std::array<std::complex<double>,size> spectrum{};
    std::array<double,size/2> previous{};
    std::array<double,12> chroma{};
    std::vector<float> onsets;
    int write=0,filled=0,hop=0,frames=0,count=0;
    double inputRate,accumulator=0,sum=0;
    void analyze() {
        for(int i=0;i<size;++i)spectrum[i]=ring[(write+i)%size]*(.5-.5*std::cos(2*pi*i/(size-1)));
        for(int i=1,j=0;i<size;++i){int bit=size>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j)std::swap(spectrum[i],spectrum[j]);}
        for(int length=2;length<=size;length<<=1){
            const auto step=std::polar(1.,-2*pi/length);
            for(int i=0;i<size;i+=length){std::complex<double> rotation=1;
                for(int j=0;j<length/2;++j){auto a=spectrum[i+j],b=spectrum[i+j+length/2]*rotation;
                    spectrum[i+j]=a+b;spectrum[i+j+length/2]=a-b;rotation*=step;}
            }
        }
        double flux=0;
        for(int bin=3;bin<size/2;++bin){
            const double frequency=bin*rate/size,magnitude=std::abs(spectrum[bin]);
            flux+=std::max(0.,std::log1p(magnitude)-std::log1p(previous[bin]));previous[bin]=magnitude;
            if(frequency>=65&&frequency<=2200&&magnitude>std::abs(spectrum[bin-1])&&magnitude>=std::abs(spectrum[bin+1])){
                double left=std::abs(spectrum[bin-1]),right=std::abs(spectrum[bin+1]),denominator=left-2*magnitude+right;
                double offset=std::abs(denominator)>1e-12?std::clamp(.5*(left-right)/denominator,-.5,.5):0;
                int midi=static_cast<int>(std::lround(69+12*std::log2((bin+offset)*rate/size/440)));
                chroma[(midi%12+12)%12]+=magnitude/(1+frequency/1000);
            }
        }
        if(onsets.size()<60000)onsets.push_back(static_cast<float>(flux));
        ++frames;
    }
public:
    explicit MeeWavTrackAnalysis(int sourceRate):inputRate(std::max(12000,sourceRate)){onsets.reserve(6000);}
    void add(float sample){
        sum+=std::isfinite(sample)?sample:0;++count;accumulator+=rate;
        if(accumulator<inputRate)return;
        accumulator-=inputRate;ring[write]=static_cast<float>(sum/count);sum=0;count=0;
        write=(write+1)%size;filled=std::min(size,filled+1);
        if(++hop>=hopSize&&filled==size){hop=0;analyze();}
    }
    std::array<float,2> result() const {
        std::array<float,2> result{0,-1};if(frames<100)return result;
        double total=0;for(double v:chroma)total+=v;if(total<1e-5)return result;
        constexpr double profiles[2][12]={{6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88},
          {6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17}};
        double best=-2,second=-2;int key=-1;
        for(int mode=0;mode<2;++mode)for(int root=0;root<12;++root){
            double mean=0;for(double p:profiles[mode])mean+=p;mean/=12;
            double dot=0,normA=0,normB=0;
            for(int note=0;note<12;++note){double a=chroma[(root+note)%12]/total-1./12,b=profiles[mode][note]-mean;dot+=a*b;normA+=a*a;normB+=b*b;}
            double score=dot/std::sqrt(std::max(1e-20,normA*normB));
            if(score>best){second=best;best=score;key=(root+3)%12+mode*12;}else second=std::max(second,score);
        }
        if(best>.5&&best-second>.015)result[1]=static_cast<float>(key);
        if(onsets.size()<200)return result;
        std::vector<double> novelty(onsets.size());
        for(size_t i=0;i<onsets.size();++i){double average=0;size_t begin=i>16?i-16:0,end=std::min(onsets.size(),i+17);
            for(size_t j=begin;j<end;++j)average+=onsets[j];novelty[i]=std::max(0.,onsets[i]-average/(end-begin));}
        constexpr double onsetRate=rate/hopSize;
        auto correlation=[&](double lag){double score=0,a=0,b=0;
            for(size_t i=static_cast<size_t>(std::ceil(lag));i<novelty.size();++i){double at=i-lag;size_t j=static_cast<size_t>(at);double f=at-j;
                double past=novelty[j]*(1-f)+novelty[std::min(j+1,novelty.size()-1)]*f;
                score+=novelty[i]*past;a+=novelty[i]*novelty[i];b+=past*past;}
            return score/std::sqrt(std::max(1e-20,a*b));};
        double bestTempo=0,bestScore=0;
        for(double bpm=60;bpm<=200;bpm+=.25){double lag=60*onsetRate/bpm;
            double score=(correlation(lag)+.35*correlation(lag*2)+.15*correlation(lag*3))*(1-.06*std::abs(std::log2(bpm/120)));
            if(score>bestScore){bestScore=score;bestTempo=bpm;}}
        if(bestScore>.25)result[0]=static_cast<float>(bestTempo);
        return result;
    }
};
