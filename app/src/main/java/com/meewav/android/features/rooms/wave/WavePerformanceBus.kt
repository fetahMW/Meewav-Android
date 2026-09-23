package com.meewav.android.features.rooms.wave

import kotlin.math.abs
import kotlin.math.min

/** Bounded 48 kHz stereo queue. Producers never wait for the network. No private cue here. */
internal class WavePerformanceBus(private val capacity: Int = 8) {
    companion object { const val FRAMES = 480; const val SAMPLES = FRAMES * 2 }
    private val packets = ArrayDeque<ByteArray>()
    var dropped: Long = 0; private set
    private var gain = 1f
    @Synchronized fun offer(program: FloatArray) {
        require(program.size == SAMPLES)
        val bytes = ByteArray(SAMPLES * 2)
        for (frame in 0 until FRAMES) {
            val l = program[frame * 2].let { if (it.isFinite()) it else 0f }
            val r = program[frame * 2 + 1].let { if (it.isFinite()) it else 0f }
            val peak = maxOf(abs(l), abs(r), .98f)
            val target = .98f / peak
            gain = if (target < gain) target else min(target, gain + .0004f)
            for (channel in 0..1) {
                val value = (((if (channel == 0) l else r) * gain).coerceIn(-.98f, .98f) * 32767f).toInt()
                val offset = (frame * 2 + channel) * 2
                bytes[offset] = value.toByte(); bytes[offset + 1] = (value shr 8).toByte()
            }
        }
        if (packets.size == capacity) { packets.removeFirst(); dropped++ }
        packets.addLast(bytes)
    }
    @Synchronized fun poll(): ByteArray? = if (packets.isEmpty()) null else packets.removeFirst()
    @Synchronized fun clear() { packets.clear(); gain = 1f }
    @Synchronized fun size() = packets.size
}

internal data class WaveVocalSettings(
    val mute: Boolean = true, val gain: Float = .72f, val monitoring: Boolean = false,
    val tune: Boolean = false, val scale: Int = 0, val reverb: Boolean = false, val reverbMix: Float = .15f,
    val cleanVoice: Boolean = false, val noiseCalibration: Int = 0,
    val proEffects: Int = 0,
)

internal fun waveTuneScale(key: String, mode: String): Int {
    val keys = listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
    val index = keys.indexOf(key.uppercase().replace("♯", "#"))
    if (index < 0 || mode.contains("chrom", true)) return 0
    return (index + if (mode.contains("min", true)) 3 else 0) % 12 + 1
}

/** Adapter from an existing deck render thread into the final program bus, never its AudioTrack. */
internal class WaveProgramInput {
    private data class Block(val samples: FloatArray, val at: Long)
    private val blocks = ArrayDeque<Block>()
    @Volatile var enabled = false
    @Volatile var gain = 1f
    @Synchronized fun offer(program: FloatArray) {
        if (!enabled) { blocks.clear(); return }
        if (blocks.size == 3) blocks.removeFirst()
        blocks.addLast(Block(program.copyOf(), System.nanoTime()))
    }
    @Synchronized fun poll(): FloatArray? {
        if (!enabled) { blocks.clear(); return null }
        val now = System.nanoTime()
        while (blocks.isNotEmpty()) {
            val block = blocks.removeFirst()
            if (now - block.at <= 50_000_000L) return block.samples
        }
        return null
    }
    @Synchronized fun clear() { blocks.clear() }
}
