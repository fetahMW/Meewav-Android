package com.meewav.android.features.auth

import org.junit.Assert.*
import org.junit.Test

class GlobeOrientationTurnTest {
    @Test fun anUnchangedOrientationStaysLockedIndefinitelyInAllFourPositions() {
        for (rotation in listOf(0, 90, 180, 270)) {
            val turn = GlobeOrientationTurn()
            turn.reset(rotation)
            val initial = turn.value
            for (step in 0..1000) {
                turn.update(rotation, 1_000_000_000L + step * 30_000_000L)
                assertEquals(initial, turn.value, 0.0)
                assertFalse(turn.turning)
                assertEquals(0L, turn.deadline)
            }
        }
    }

    @Test fun onlyAConfirmedDisplayChangeStartsABoundedTurn() {
        val turn = GlobeOrientationTurn()
        turn.reset(0)
        turn.update(0, 1_000_000_000L)
        assertFalse(turn.turning)
        turn.update(90, 1_100_000_000L)
        assertTrue(turn.turning)
        assertEquals(-90.0, turn.value, 0.0)
        val deadline = turn.deadline
        for (step in 1..8) turn.update(90, 1_100_000_000L + step * 30_000_000L)
        assertEquals(deadline, turn.deadline)
        assertFalse(turn.finish(deadline - 1))
        assertTrue(turn.finish(deadline))
        assertFalse(turn.turning)
        assertEquals(-90.0, turn.value, 0.0)
        for (step in 0..100) turn.update(90, deadline + step * 30_000_000L)
        assertFalse(turn.turning)
        assertEquals(0L, turn.deadline)
    }

    @Test fun clockwiseAndCounterclockwiseTurnsKeepTheNearestRevolution() {
        for (direction in listOf(-1, 1)) {
            val turn = GlobeOrientationTurn()
            turn.reset(0)
            var previous = turn.value
            for (step in 1..12) {
                val rotation = ((-direction * step * 90) % 360 + 360) % 360
                turn.update(rotation, 1_000_000_000L + step * 500_000_000L)
                assertTrue(turn.turning)
                assertEquals(direction * 90.0, turn.value - previous, 0.0)
                assertTrue(turn.finish(turn.deadline))
                previous = turn.value
            }
            assertEquals(direction * 1080.0, turn.value, 0.0)
        }
    }

    @Test fun aQuickReversalRetargetsOnceAndThenStaysLocked() {
        val turn = GlobeOrientationTurn()
        turn.reset(0)
        turn.update(90, 1_000_000_000L)
        turn.update(0, 1_100_000_000L)
        assertEquals(0.0, turn.value, 0.0)
        assertEquals(1_400_000_000L, turn.deadline)
        turn.update(0, 1_300_000_000L)
        assertEquals(1_400_000_000L, turn.deadline)
        assertTrue(turn.finish(1_400_000_000L))
        assertFalse(turn.turning)
    }

    @Test fun lifecycleResumePlacesTheExistingOrientationWithoutAnimating() {
        val turn = GlobeOrientationTurn()
        turn.reset(0)
        turn.update(90, 1_000_000_000L)
        turn.reset(270)
        assertFalse(turn.turning)
        assertEquals(0L, turn.deadline)
        assertFalse(turn.finish(5_000_000_000L))
        val angle = turn.value
        turn.update(270, 5_030_000_000L)
        assertEquals(angle, turn.value, 0.0)
        assertFalse(turn.turning)
    }

    @Test fun malformedRotationsAreIgnoredAndEquivalentAnglesDoNotRetrigger() {
        val turn = GlobeOrientationTurn()
        turn.reset(270)
        val angle = turn.value
        for (rotation in listOf(42, 60, -55, 360 + 270, -90)) {
            turn.update(rotation, 1_000_000_000L)
            assertEquals(angle, turn.value, 0.0)
            assertFalse(turn.turning)
        }
    }
}
