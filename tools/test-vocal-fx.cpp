#include "WaveNoiseSuppressor.h"
#include <cstdio>
#include <cstdlib>
#include <chrono>
#include <vector>
#include <random>
#include <cassert>
#include <new>
#include <time.h>
static double cpuMicros() { timespec t{};clock_gettime(CLOCK_THREAD_CPUTIME_ID,&t);return t.tv_sec*1e6+t.tv_nsec/1e3; }
static bool countAllocations=false;
static unsigned allocations=0;
void* operator new(std::size_t n) { if(countAllocations)++allocations; if(auto p=std::malloc(n))return p;throw std::bad_alloc(); }
void operator delete(void* p) noexcept { std::free(p); }
void operator delete(void* p,std::size_t) noexcept { std::free(p); }
#undef assert
#define assert(x) do { if(!(x)){fprintf(stderr,"FAIL %s:%d: %s\n",__FILE__,__LINE__,#x);return 1;} } while(0)
static float noise(std::mt19937& r,float level=.01f) { return (float(r())/4294967295.f*2-1)*level*1.7320508f; }
int main() {
 float block[960]{}; std::mt19937 rng(123);
 WaveNoiseSuppressor clean;
 for(int i=0;i<960;i+=2)block[i]=block[i+1]=noise(rng);
 auto original=std::vector<float>(block,block+960);
 clean.process(block,480,false);for(int i=0;i<960;i++)assert(block[i]==original[i]);
 for(int b=0;b<100;b++){for(int i=0;i<480;i++)block[2*i]=block[2*i+1]=noise(rng);clean.process(block,480,true,1);}
 double input=0,output=0,worst=0,cpuWorst=0;
 for(int b=0;b<2000;b++) {
  for(int i=0;i<96;i++){float x=noise(rng);block[2*i]=block[2*i+1]=x;if(b>500)input+=x*x;}
  auto t=std::chrono::steady_clock::now();auto cpu=cpuMicros();clean.process(block,96,true,1);cpuWorst=std::max(cpuWorst,cpuMicros()-cpu);
  worst=std::max(worst,std::chrono::duration<double,std::micro>(std::chrono::steady_clock::now()-t).count());
  for(int i=0;i<96;i++){assert(std::isfinite(block[2*i]));assert(block[2*i]==block[2*i+1]);if(b>500)output+=block[2*i]*block[2*i];}
 }
 double reduction=10*std::log10(output/input);printf("Calibrated hiss attenuation %.2f dB, worst 96 frames wall=%.1f cpu=%.1f us, buffering=0\n",reduction,worst,cpuWorst);assert(reduction < -12);
 input=output=0;
 for(int b=0;b<500;b++) {
  for(int i=0;i<96;i++){float x=.2f*std::sin((b*96+i)*6.28318530718*220/48000)+noise(rng);block[2*i]=block[2*i+1]=x;if(b>10)input+=x*x;}
  clean.process(block,96,true,1);
  for(int i=0;i<96;i++)if(b>10)output+=block[2*i]*block[2*i];
 }
 double voice=10*std::log10(output/input);printf("Voice/noise level change %.2f dB\n",voice);assert(voice > -1.5);
 std::fill_n(block,960,.125f);clean.process(block,480,false,1);assert(block[958]==.125f);
 // Packet size cannot change noise DSP results.
 WaveNoiseSuppressor a,b;std::vector<float> x(9600),y;for(int i=0;i<9600;i+=2)x[i]=x[i+1]=noise(rng);y=x;
 for(int j=0;j<9600;j+=192)a.process(x.data()+j,96,true);
 for(int j=0;j<9600;j+=960)b.process(y.data()+j,480,true);
 assert(x==y);
 WaveNoiseSuppressor instant;std::fill_n(block,960,0.f);block[0]=block[1]=.5f;instant.process(block,480,true);assert(block[0]>.1f);
 puts("PASS noise bypass, calibration, finite output, voice level, mono parity, frame invariance, no buffering");
}
