package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class WaveVocalModeTest {
    @Test fun closingTheEditorKeepsProSelectedAndItsSettingsActive() {
        val opened = WaveVocalMode().select(true)
        assertTrue(opened.pro)
        assertTrue(opened.sheetOpen)
        val closed = opened.dismissEditor()
        assertTrue(closed.pro)
        assertFalse(closed.sheetOpen)
        assertTrue(closed.select(true).sheetOpen)
        val settings = WaveVocalSettings(tune = true, correction = WaveTuneSettings(.7f, .3f, .6f, .2f, 3f))
        assertEquals(settings, closed.applyTo(settings))
    }

    @Test fun simpleSuspendsAdvancedSettingsWithoutErasingThemOrChangingMicrophoneControls() {
        val saved = WaveVocalSettings(mute = true, gain = .42f, monitoring = true,
            tune = true, scale = 5, reverb = true, reverbMix = .27f,
            cleanVoice = true, noiseCalibration = 7, proEffects = 192,
            correction = WaveTuneSettings(.65f, .2f, .7f, .3f, -2f))
        val simple = WaveVocalMode().select(true).select(false)
        assertFalse(simple.pro)
        assertFalse(simple.sheetOpen)
        assertEquals(saved.copy(cleanVoice = false, proEffects = 0, correction = WaveTuneSettings()), simple.applyTo(saved))
        assertEquals(saved, simple.select(true).applyTo(saved))
        assertEquals(saved.correction, simple.select(true).correction(saved.correction))
    }

    @Test fun indicatorsStayDarkWithoutActiveEffectsAndIgnoreSuspendedProEffects() {
        val simple = WaveVocalMode()
        assertFalse(simple.hasActiveEffects(false, false))
        assertFalse(simple.hasActiveEffects(false, false, true, 64))
        assertTrue(simple.hasActiveEffects(true, false))
        assertTrue(simple.hasActiveEffects(false, true))
        val pro = simple.select(true).dismissEditor()
        assertFalse(pro.hasActiveEffects(false, false))
        assertTrue(pro.hasActiveEffects(true, false))
        assertTrue(pro.hasActiveEffects(false, false, effects = 64))
    }
}
