package com.meewav.android.features.rooms.wave

import org.junit.Assert.assertEquals
import org.junit.Test

class WaveProposalGestureTest {
    @Test fun leftDeletesAndRightQueuesVote() {
        assertEquals(WaveProposalGesture.DELETE, resolveWaveProposalGesture(-80f, 0f))
        assertEquals(WaveProposalGesture.VOTE, resolveWaveProposalGesture(80f, 0f))
    }
    @Test fun shortMovementOrTouchJitterDoesNothing() {
        assertEquals(WaveProposalGesture.NONE, resolveWaveProposalGesture(20f, 3000f))
        assertEquals(WaveProposalGesture.NONE, resolveWaveProposalGesture(-60f, 0f))
    }
    @Test fun intentionalFlickCommitsOnlyInItsDirection() {
        assertEquals(WaveProposalGesture.VOTE, resolveWaveProposalGesture(40f, 1000f))
        assertEquals(WaveProposalGesture.DELETE, resolveWaveProposalGesture(-40f, -1000f))
        assertEquals(WaveProposalGesture.NONE, resolveWaveProposalGesture(-40f, 2000f))
    }
    @Test fun invalidPointerDataCannotTriggerAnAction() {
        assertEquals(WaveProposalGesture.NONE, resolveWaveProposalGesture(Float.NaN, 0f))
        assertEquals(WaveProposalGesture.NONE, resolveWaveProposalGesture(90f, Float.POSITIVE_INFINITY))
    }
}
