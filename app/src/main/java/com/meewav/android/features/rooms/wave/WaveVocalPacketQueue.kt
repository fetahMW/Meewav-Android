package com.meewav.android.features.rooms.wave

/** A 10 ms reserve belongs to publication only, never to the headphone path. */
internal class WaveVocalPacketQueue {
    private val packets = ArrayDeque<FloatArray>()
    private var primed = false
    private var dropped = 0L
    private var gaps = 0L
    private var received = 0L
    private var consumed = 0L
    @Synchronized fun offer(samples: FloatArray) {
        received++
        if (packets.size == 4) { packets.removeFirst(); dropped++ }
        packets.addLast(samples)
    }
    @Synchronized fun poll(): FloatArray? {
        if (!primed) {
            if (packets.size < 2) return null
            primed = true
        }
        if (packets.isEmpty()) { primed = false; gaps++; return null }
        consumed++
        return packets.removeFirst()
    }
    @Synchronized fun clear() { packets.clear(); primed = false }
    @Synchronized fun diagnostics() = "captured=$received sent=$consumed pending=${packets.size} dropped=$dropped gaps=$gaps"
}
