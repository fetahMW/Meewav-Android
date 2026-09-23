# Free Pro vocal effects — 23 September 2026

## Current status: temporarily withdrawn

After the user reported loss of headphone monitoring, the three new insert processors and their visible controls were removed from the active vocal path. Sources and synthetic tests remain for investigation. The approved noise reducer stays active/available. Native diagnostics now expose input and rendered peaks plus gain (numbers only, no recording) to distinguish capture, processing and playback failures. Do not report monitoring restored until the live headphone test confirms it.

Integrated DaisySP modules (MIT), pinned source and Android adaptation documented in `app/src/main/cpp/third_party/daisysp/ORIGIN.txt`. License included in APK assets/licenses/DaisySP-MIT.txt.

- Delay: 240 ms, wet 18%, feedback 22%; dry onset unchanged.
- Saturation: Overdrive, gentle fixed setting, wet 35%.
- Limiter: peak control, no lookahead. This is not a configurable compressor.

Pro controls operate both native duplex monitoring/RTC publication and fallback vocal DSP. All effects default off. The approved noise reduction algorithm is unchanged. Controls fade over a few milliseconds; they do not add a dry-path audio queue.

On-device native synthetic tests pass for exact bypass, immediate dry onset, finite outputs and delay timing. These checks do not constitute an acoustic latency or listening-quality measurement.

Sources:
- https://github.com/electro-smith/DaisySP (MIT DSP modules)
- https://www.antarestech.com/products/pitch-correction/auto-key-mobile (free key detector, not an embeddable AutoTune engine)
- `AUTOTUNE_LOW_LATENCY_RESEARCH.md` records candidate pitch engines. No replacement Pro autotune integrated yet; Signalsmith pitch shifter stays removed. A configurable compressor and other effect families are not integrated in this pass.
