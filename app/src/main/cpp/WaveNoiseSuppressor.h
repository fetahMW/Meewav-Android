#pragma once
#include <array>
#include <algorithm>
#include <cmath>

// Causal four-band downward expansion. No FFT, lookahead or queued audio.
// Complementary one-pole bands sum to the original sample at unity gains.
// Reduces stationary hiss; this is NOT a neural speech/noise separator.
class WaveNoiseSuppressor {
    std::array<float, 3> low{};
    std::array<float, 4> power{}, gain{1,1,1,1};
    // Starting profile; a one-second silent calibration replaces it.
    std::array<double, 4> noise{1e-6, 3e-6, 5e-6, 8e-6}, measured{};
    int calibrationId = 0, remaining = 0;
    float wet = 0;
public:
    void process(float* stereo, int frames, bool enabled, int calibration = 0) {
        if (calibration != calibrationId) {
            calibrationId = calibration;
            remaining = 48000;
            measured.fill(0);
        }
        constexpr float alpha[3] = {.032195257f, .324768093f, .692136261f}; // 250/3000/9000 Hz
        constexpr float detector = .006920388f; // 3 ms causal RMS envelope
        for (int i=0; i<frames; ++i) {
            const float dry = stereo[2*i];
            for (int b=0;b<3;++b) low[b] += alpha[b]*(dry-low[b]);
            const float bands[4] = {low[0],low[1]-low[0],low[2]-low[1],dry-low[2]};
            float filtered = 0;
            for(int b=0;b<4;++b) {
                power[b] += detector*(bands[b]*bands[b]-power[b]);
                if(remaining>0) measured[b] += bands[b]*bands[b];
                const float ratio = float(power[b] / std::max(noise[b],1e-12));
                const float openness = std::clamp((ratio-1.f)/15.f,0.f,1.f);
                const float target = .12589254f + .87410746f*openness;
                gain[b] += (target-gain[b])*(target>gain[b] ? .079955585f : .00041658f);
                filtered += bands[b]*gain[b];
            }
            if(remaining>0 && --remaining==0) {
                for(int b=0;b<4;++b) noise[b]=std::clamp(measured[b]/48000.,1e-12,1e-3);
            }
            const float targetWet=enabled && remaining==0 ? 1.f : 0.f;
            wet += std::clamp(targetWet-wet,-1.f/144,1.f/144);
            const float result=wet==0 ? dry : dry+(filtered-dry)*wet;
            stereo[2*i]=stereo[2*i+1]=result;
        }
    }
};
