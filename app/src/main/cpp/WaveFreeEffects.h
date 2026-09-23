#pragma once
#include <algorithm>
#include "third_party/daisysp/delayline.h"
#include "third_party/daisysp/overdrive.h"
#include "third_party/daisysp/limiter.h"

// Fixed 48 kHz vocal insert. Dry signal is never delayed; no callback allocations.
// Controls: 64 delay (240 ms), 128 gentle saturation, 256 peak limiter.
class WaveFreeEffects {
    daisysp::DelayLine<float, 24000> delays[2];
    daisysp::Overdrive drive[2];
    daisysp::Limiter limiter;
    float delayMix = 0, driveMix = 0, limitMix = 0;
public:
    WaveFreeEffects() {
        for (auto& d : delays) { d.Init(); d.SetDelay(size_t(11520)); }
        for (auto& d : drive) { d.Init(); d.SetDrive(.2f); }
        limiter.Init();
    }
    void process(float* stereo, int frames, int flags) {
        for (int i=0; i<frames; ++i) {
            delayMix += (((flags & 64) ? .18f : 0.f) - delayMix) * .007f;
            driveMix += (((flags & 128) ? .35f : 0.f) - driveMix) * .007f;
            limitMix += (((flags & 256) ? 1.f : 0.f) - limitMix) * .007f;
            if (!(flags & 64) && delayMix < .00001f) delayMix = 0;
            if (!(flags & 128) && driveMix < .00001f) driveMix = 0;
            if (!(flags & 256) && limitMix < .00001f) limitMix = 0;
            for (int c=0; c<2; ++c) {
                float& sample = stereo[2*i+c];
                if (driveMix > 0) sample += (drive[c].Process(sample) - sample) * driveMix;
                const float echo = delays[c].Read();
                delays[c].Write((flags & 64) ? sample + echo * .22f : 0.f);
                sample += echo * delayMix;
            }
            if (limitMix > 0) {
                float limited[2] = {stereo[2*i], stereo[2*i+1]};
                limiter.ProcessBlock(limited, 2, 1.f);
                for(int c=0;c<2;++c) stereo[2*i+c] += (limited[c]-stereo[2*i+c])*limitMix;
            }
        }
    }
};
