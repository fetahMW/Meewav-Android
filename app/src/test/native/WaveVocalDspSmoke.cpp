// Headless Android-device smoke test: exercises the bundled native DSP, no mic or network.
#include <cmath>
#include <cstdio>
#include "Superpowered.h"
#include "SuperpoweredAutomaticVocalPitchCorrection.h"
#include "SuperpoweredReverb.h"
int main() {
    Superpowered::Initialize("ExampleLicenseKey-WillExpire-OnNextUpdate");
    Superpowered::AutomaticVocalPitchCorrection tune;
    Superpowered::Reverb reverb(48000, 48000);
    tune.samplerate = 48000;
    tune.scale = Superpowered::AutomaticVocalPitchCorrection::CMAJOR;
    reverb.enabled = true; reverb.mix = .25f;
    float input[960], output[960];
    double energy = 0, difference = 0;
    for (int block = 0; block < 200; ++block) {
        for (int frame = 0; frame < 480; ++frame) {
            float value = .1f * std::sin(6.28318530718 * 233.08 * (block * 480 + frame) / 48000);
            input[frame * 2] = input[frame * 2 + 1] = value;
        }
        tune.process(input, output, true, 480);
        reverb.process(output, output, 480);
        for (int i = 0; i < 960; ++i) {
            if (!std::isfinite(output[i])) return 2;
            energy += output[i] * output[i];
            difference += std::fabs(output[i] - input[i]);
        }
    }
    if (energy < 1 || difference < 1) return 3;
    std::printf("PASS: 200 stereo DSP blocks, finite non-silent processed output; energy=%.3f delta=%.3f\n", energy, difference);
    return 0;
}
