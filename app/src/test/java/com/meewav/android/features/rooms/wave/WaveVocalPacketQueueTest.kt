package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class WaveVocalPacketQueueTest {
    @Test fun `capture bursts do not discard alternate packets for public listeners`() {
        val queue = WaveVocalPacketQueue()
        val received = mutableListOf<Int>()
        repeat(100) { burst ->
            queue.offer(floatArrayOf((burst * 2).toFloat()))
            queue.offer(floatArrayOf((burst * 2 + 1).toFloat()))
            received += queue.poll()!![0].toInt()
            received += queue.poll()!![0].toInt()
        }
        assertEquals((0 until 200).toList(), received)
    }
    @Test fun `native four millisecond callbacks keep all ten millisecond RTC packets`() {
        val queue = WaveVocalPacketQueue()
        val received = mutableListOf<Int>()
        var captured = 0
        var next = 0
        for (millis in 0 until 2000) {
            if (millis % 4 == 0) {
                captured += 192
                if (captured >= 480) {
                    captured -= 480
                    queue.offer(floatArrayOf((next++).toFloat()))
                }
            }
            if (millis % 10 == 0) queue.poll()?.let { received += it[0].toInt() }
        }
        assertTrue(received.size > 195)
        assertEquals((0 until received.size).toList(), received)
    }
    @Test fun `a stalled network cannot grow the voice queue indefinitely`() {
        val queue = WaveVocalPacketQueue()
        repeat(100) { queue.offer(floatArrayOf(it.toFloat())) }
        assertEquals(listOf(96f, 97f, 98f, 99f), List(4) { queue.poll()!![0] })
        assertNull(queue.poll())
        queue.offer(floatArrayOf(100f))
        assertNull(queue.poll())
        queue.offer(floatArrayOf(101f))
        assertEquals(100f, queue.poll()!![0], 0f)
    }
}
