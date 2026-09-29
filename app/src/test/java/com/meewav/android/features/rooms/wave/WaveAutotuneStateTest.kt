package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class WaveAutotuneStateTest {
    private val custom = WaveTuneSettings(.72f, .31f, .64f, .25f, -2f)

    @Test fun proEnablesAutotuneAndSecondTapRestoresSimpleWithoutCuttingVoice() {
        val pro = WaveAutotuneState().editPro(custom).togglePro()
        assertTrue(pro.enabled)
        assertTrue(pro.proActive)
        assertEquals(custom, pro.correction)

        val simple = pro.togglePro()
        assertTrue(simple.enabled)
        assertFalse(simple.proActive)
        assertEquals(WaveTuneSettings(), simple.correction)
        assertEquals(custom, simple.proSettings)
        assertEquals(custom, simple.togglePro().correction)
    }

    @Test fun smallPowerButtonStopsProAndRestartsInSimple() {
        val off = WaveAutotuneState().editPro(custom).togglePro().toggleSimplePower()
        assertFalse(off.enabled)
        assertFalse(off.proActive)
        val simple = off.toggleSimplePower()
        assertTrue(simple.enabled)
        assertFalse(simple.proActive)
        assertEquals(WaveTuneSettings(), simple.correction)
        assertEquals(custom, simple.togglePro().correction)
    }

    @Test fun sheetPowerRestartsTheSavedAdvancedSettings() {
        val off = WaveAutotuneState().editPro(custom).togglePro().toggleProPower()
        assertFalse(off.enabled)
        assertFalse(off.proActive)
        val restored = off.toggleProPower()
        assertTrue(restored.enabled)
        assertTrue(restored.proActive)
        assertEquals(custom, restored.correction)
    }

    @Test fun editingStoredProSettingsDoesNotLeakIntoSimpleDsp() {
        val simple = WaveAutotuneState().toggleSimplePower().editPro(custom)
        assertEquals(WaveTuneSettings(), simple.correction)
        assertEquals(custom, simple.togglePro().correction)
    }

    @Test fun remoteHydrationReflectsActualPowerAndCorrection() {
        assertEquals(WaveAutotuneMode.OFF, WaveAutotuneState.fromRemote(false, custom).mode)
        assertEquals(WaveAutotuneMode.SIMPLE, WaveAutotuneState.fromRemote(true, WaveTuneSettings()).mode)
        val pro = WaveAutotuneState.fromRemote(true, custom)
        assertTrue(pro.proActive)
        assertEquals(custom, pro.correction)
    }

    @Test fun savedProValuesAreBoundedBeforeReactivation() {
        val pro = WaveAutotuneState().editPro(WaveTuneSettings(Float.NaN, 5f, -4f, 2f, 40f)).togglePro()
        assertEquals(WaveTuneSettings(1f, 1f, 0f, 1f, 12f), pro.correction)
    }
}
