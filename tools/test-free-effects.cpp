#include "WaveFreeEffects.h"
#include <array>
#include <cassert>
#include <cmath>
#include <cstdio>
#include <memory>

int main() {
    auto fx = std::make_unique<WaveFreeEffects>();
    std::array<float, 192> data;
    for (int i=0;i<192;i++) data[i]=std::sin(float(i))*.2f;
    const auto original = data;
    fx->process(data.data(),96,0);
    assert(data==original);
    for (int mode : {64,128,256,448}) {
        auto effect = std::make_unique<WaveFreeEffects>();
        for (int b=0;b<20;b++) { data.fill(0); effect->process(data.data(),96,mode); }
        data.fill(0); data[0]=data[1]=.25f;
        effect->process(data.data(),96,mode);
        assert(data[0]!=0); // no lookahead / delayed dry onset
        for (float v:data) assert(std::isfinite(v));
    }
    auto echo = std::make_unique<WaveFreeEffects>();
    for(int i=0;i<20;i++){ data.fill(0);echo->process(data.data(),96,64); }
    data.fill(0);data[0]=data[1]=.5f;echo->process(data.data(),96,64);
    for(int i=1;i<120;i++){data.fill(0);echo->process(data.data(),96,64);}
    data.fill(0);echo->process(data.data(),96,64);
    assert(data[0]>.08f && data[0]<.10f); // first echo exactly 240ms
    std::puts("PASS: exact bypass, immediate dry onset, finite output, 240ms echo");
}
