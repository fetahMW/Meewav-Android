package com.meewav.android.features.rooms.wave

/** The active signal settings and the visibility of their editor are independent. */
internal data class WaveVocalMode(val pro: Boolean = false, val sheetOpen: Boolean = false) {
    fun select(pro: Boolean) = copy(pro = pro, sheetOpen = pro)
    fun dismissEditor() = copy(sheetOpen = false)
    fun activatePro() = copy(pro = true)

    fun correction(saved: WaveTuneSettings) = if (pro) saved else WaveTuneSettings()

    fun hasActiveEffects(tune: Boolean, reverb: Boolean, cleanVoice: Boolean = false, effects: Int = 0) =
        tune || reverb || (pro && (cleanVoice || effects != 0))

    // Keep the saved Pro settings intact, and never change microphone or routing controls.
    fun applyTo(saved: WaveVocalSettings) = if (pro) saved else saved.copy(
        correction = WaveTuneSettings(), cleanVoice = false, proEffects = 0,
    )
}
