package com.meewav.android.features.rooms.wave

internal enum class WaveAutotuneMode { OFF, SIMPLE, PRO }

/** One state drives both the illuminated controls and the settings sent to DSP. */
internal data class WaveAutotuneState(
    val mode: WaveAutotuneMode = WaveAutotuneMode.OFF,
    val proSettings: WaveTuneSettings = WaveTuneSettings(),
) {
    val enabled: Boolean get() = mode != WaveAutotuneMode.OFF
    val proActive: Boolean get() = mode == WaveAutotuneMode.PRO
    val correction: WaveTuneSettings get() = if (proActive) proSettings else WaveTuneSettings()

    fun togglePro() = copy(mode = if (proActive) WaveAutotuneMode.SIMPLE else WaveAutotuneMode.PRO)
    fun toggleSimplePower() = copy(mode = if (enabled) WaveAutotuneMode.OFF else WaveAutotuneMode.SIMPLE)
    fun toggleProPower() = copy(mode = if (enabled) WaveAutotuneMode.OFF else WaveAutotuneMode.PRO)
    fun editPro(settings: WaveTuneSettings) = copy(proSettings = settings.bounded())

    companion object {
        fun fromRemote(enabled: Boolean, settings: WaveTuneSettings): WaveAutotuneState {
            val bounded = settings.bounded()
            return WaveAutotuneState(
                mode = when {
                    !enabled -> WaveAutotuneMode.OFF
                    bounded != WaveTuneSettings() -> WaveAutotuneMode.PRO
                    else -> WaveAutotuneMode.SIMPLE
                },
                proSettings = bounded,
            )
        }
    }
}
