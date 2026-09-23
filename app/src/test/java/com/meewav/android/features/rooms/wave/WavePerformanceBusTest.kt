package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test
import java.nio.ByteBuffer
import java.nio.ByteOrder

class WavePerformanceBusTest {
    @Test fun `10 ms stereo little endian with stereo linked limiter`() {
        val bus = WavePerformanceBus()
        bus.offer(FloatArray(960) { if (it % 2 == 0) 2f else -1f })
        val bytes = bus.poll()!!
        assertEquals(1920, bytes.size)
        val pcm = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer()
        assertTrue(pcm.get(0) in 32000..32113)
        assertEquals(-2f, pcm.get(0).toFloat() / pcm.get(1), .001f)
    }
    @Test fun `network stalls drop oldest without growing latency indefinitely`() {
        val bus = WavePerformanceBus(3)
        repeat(10) { n -> bus.offer(FloatArray(960) { n / 100f }) }
        assertEquals(3, bus.size()); assertEquals(7L, bus.dropped)
        val first = ByteBuffer.wrap(bus.poll()!!).order(ByteOrder.LITTLE_ENDIAN).short
        assertEquals((.07f * 32767).toInt(), first.toInt())
        bus.clear(); assertNull(bus.poll())
    }
    @Test fun `non finite input never becomes full scale noise`() {
        val bus = WavePerformanceBus()
        bus.offer(FloatArray(960) { if (it % 2 == 0) Float.NaN else Float.POSITIVE_INFINITY })
        assertTrue(bus.poll()!!.all { it == 0.toByte() })
    }
    @Test fun `minor maps to relative major like iOS`() {
        assertEquals(1, waveTuneScale("A", "Mineur"))
        assertEquals(10, waveTuneScale("A", "Majeur"))
        assertEquals(0, waveTuneScale("A", "Chromatique"))
    }
    @Test fun `private monitoring does not leak into public program`() {
        val mic = WaveMicrophone { error(it) }
        mic.settings = WaveVocalSettings(mute = false, gain = .5f, monitoring = false)
        val bus = WavePerformanceBus(); val output = WaveLiveOutput(mic, bus)
        val monitor = FloatArray(960) { .9f } // cue only
        output.render(FloatArray(960) { .2f }, FloatArray(960) { .5f }, monitor)
        val sample = ByteBuffer.wrap(bus.poll()!!).order(ByteOrder.LITTLE_ENDIAN).short
        assertEquals((.1f * 32767).toInt(), sample.toInt())
        assertEquals(.9f, monitor[0], 0f)
        mic.settings = mic.settings.copy(mute = true, monitoring = true)
        output.musicPublic = true; output.musicGain = .5f
        output.render(FloatArray(960) { .2f }, FloatArray(960) { .4f }, monitor)
        assertEquals((.2f * 32767).toInt(), ByteBuffer.wrap(bus.poll()!!).order(ByteOrder.LITTLE_ENDIAN).short.toInt())
    }
    @Test fun `processed vocal enters private monitor when enabled`() {
        val mic = WaveMicrophone { error(it) }
        mic.settings = WaveVocalSettings(mute = false, gain = .5f, monitoring = true)
        val bus = WavePerformanceBus(); val output = WaveLiveOutput(mic, bus)
        val monitor = FloatArray(960)

        output.render(FloatArray(960) { .2f }, FloatArray(960), monitor)

        assertEquals(.1f, monitor[0], .0001f)
        assertEquals((.1f * 32767).toInt(), ByteBuffer.wrap(bus.poll()!!)
            .order(ByteOrder.LITTLE_ENDIAN).short.toInt())
        mic.settings = mic.settings.copy(monitoring = false)
        monitor.fill(0f)
        output.render(FloatArray(960) { .2f }, FloatArray(960), monitor)
        assertTrue(monitor.all { it == 0f })
    }
    @Test fun `imported production joins after voice processing only when routed public`() {
        val mic = WaveMicrophone { error(it) }
        val bus = WavePerformanceBus(); val output = WaveLiveOutput(mic, bus)
        output.production.offer(FloatArray(960) { .4f })
        output.render(null, FloatArray(960), FloatArray(960))
        assertTrue(bus.poll()!!.all { it == 0.toByte() })
        output.production.enabled = true; output.production.gain = .5f
        output.production.offer(FloatArray(960) { .4f })
        output.render(null, FloatArray(960), FloatArray(960))
        assertEquals((.2f * 32767).toInt(), ByteBuffer.wrap(bus.poll()!!).order(ByteOrder.LITTLE_ENDIAN).short.toInt())
        output.production.enabled = false
        output.render(null, FloatArray(960), FloatArray(960))
        assertTrue(bus.poll()!!.all { it == 0.toByte() })
    }
}
