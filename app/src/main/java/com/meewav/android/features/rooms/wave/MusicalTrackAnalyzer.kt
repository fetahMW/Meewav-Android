package com.meewav.android.features.rooms.wave

import androidx.annotation.Keep
import java.nio.ByteBuffer
import kotlin.math.roundToInt

@Keep
internal class MusicalTrackAnalyzer(rate: Int, seconds: Int) : AutoCloseable {
    private var handle = create(rate, seconds.coerceAtLeast(1))
    fun consume(pcm: ByteBuffer, offset: Int, bytes: Int, channels: Int, floating: Boolean) {
        if (handle != 0L) process(handle, pcm, offset, bytes, channels, floating)
    }
    fun finish(): String {
        if (handle == 0L) return "Non détecté"
        val values = results(handle)
        val bpm = values[0].takeIf { it.isFinite() }?.roundToInt()?.takeIf { it in 60..200 }
        val key = values[1].toInt().takeIf { it in 0..23 }
        val notes = listOf("A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯")
        return listOfNotNull(bpm?.let { "$it BPM" }, key?.let { "${notes[it % 12]} ${if (it < 12) "MAJ" else "MIN"}" })
            .joinToString(" · ").ifBlank { "Non détecté" }
    }
    override fun close() { if (handle != 0L) release(handle); handle = 0 }
    private external fun create(rate: Int, seconds: Int): Long
    private external fun process(handle: Long, pcm: ByteBuffer, offset: Int, bytes: Int, channels: Int, floating: Boolean)
    private external fun results(handle: Long): FloatArray
    private external fun release(handle: Long)
    companion object { init { System.loadLibrary("meewav_analysis") } }
}
