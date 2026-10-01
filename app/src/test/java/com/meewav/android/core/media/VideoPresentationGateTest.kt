package com.meewav.android.core.media

import org.junit.Assert.assertEquals
import org.junit.Test

class VideoPresentationGateTest {
    @Test fun preparationAfterBackgroundDoesNotStartDecoding() {
        val events = mutableListOf<String>()
        val gate = VideoPresentationGate({ events += "play" }, { events += "pause" })
        gate.setActive(true)
        gate.setActive(false)
        gate.requestPlay() // asynchronous onPrepared after the activity was paused
        assertEquals(listOf("pause"), events)
        gate.setActive(true)
        assertEquals(listOf("pause", "play"), events)
    }

    @Test fun manualPauseSurvivesHideAndReturn() {
        val events = mutableListOf<String>()
        val gate = VideoPresentationGate({ events += "play" }, { events += "pause" })
        gate.setActive(true); gate.requestPlay(); gate.requestPause()
        gate.setActive(false); gate.setActive(true)
        assertEquals(listOf("play", "pause", "pause"), events)
    }

    @Test fun playingLoopResumesOnceAfterTemporaryOcclusion() {
        val events = mutableListOf<String>()
        val gate = VideoPresentationGate({ events += "play" }, { events += "pause" })
        gate.requestPlay(); gate.setActive(true); gate.setActive(true)
        gate.setActive(false); gate.setActive(false); gate.setActive(true)
        assertEquals(listOf("play", "pause", "play"), events)
    }

    @Test fun releaseRejectsLatePreparationAndLifecycleEvents() {
        val events = mutableListOf<String>()
        val gate = VideoPresentationGate({ events += "play" }, { events += "pause" })
        gate.setActive(true); gate.close(); gate.requestPlay(); gate.setActive(false); gate.setActive(true)
        assertEquals(emptyList<String>(), events)
    }

    @Test fun stoppedPlaybackIsNotRestartedByVisibility() {
        val events = mutableListOf<String>()
        val gate = VideoPresentationGate({ events += "play" }, { events += "pause" })
        gate.setActive(true); gate.requestPlay(); gate.reset()
        gate.setActive(false); gate.setActive(true)
        assertEquals(listOf("play", "pause"), events)
    }
}
