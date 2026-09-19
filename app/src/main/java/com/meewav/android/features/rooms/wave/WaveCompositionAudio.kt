package com.meewav.android.features.rooms.wave

import android.content.Context
import android.media.*
import android.net.Uri
import android.os.Process
import kotlinx.coroutines.ensureActive
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.channels.FileChannel
import java.security.MessageDigest
import java.util.concurrent.ConcurrentLinkedQueue
import kotlin.coroutines.coroutineContext
import kotlin.math.*

internal data class WavePcm(val samples: FloatBuffer, val frames: Int, val peaks: List<Float>)

/** One canonical stereo stream per clip. Disk-backed PCM keeps long takes off the heap. */
internal object WaveCompositionDecoder {
    const val RATE = 48_000
    suspend fun decode(context: Context, source: String): WavePcm {
        val directory = File(context.cacheDir, "wave-composition").apply { mkdirs() }
        val key = MessageDigest.getInstance("SHA-256").digest(source.toByteArray()).joinToString("") { "%02x".format(it) }
        val target = File(directory, "$key.pcm")
        if (!target.exists()) {
            val partial = File(directory, "$key.part")
            val extractor = MediaExtractor()
            var codec: MediaCodec? = null
            try {
                if (source.startsWith("asset:")) context.assets.openFd(source.removePrefix("asset:")).use {
                    extractor.setDataSource(it.fileDescriptor, it.startOffset, it.length)
                } else extractor.setDataSource(context, Uri.parse(source), null)
                val index = (0 until extractor.trackCount).firstOrNull {
                    extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)?.startsWith("audio/") == true
                } ?: error("Ce fichier ne contient pas de piste audio.")
                extractor.selectTrack(index)
                val format = extractor.getTrackFormat(index)
                var rate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
                var channels = format.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
                var encoding = if (format.containsKey(MediaFormat.KEY_PCM_ENCODING)) format.getInteger(MediaFormat.KEY_PCM_ENCODING) else AudioFormat.ENCODING_PCM_16BIT
                val duration = if (format.containsKey(MediaFormat.KEY_DURATION)) format.getLong(MediaFormat.KEY_DURATION) else 0
                require(duration <= 300_000_000L) { "Import limité à 5 minutes par prise." }
                FileOutputStream(partial).channel.use { output ->
                    val packed = ByteBuffer.allocateDirect(65536).order(ByteOrder.LITTLE_ENDIAN)
                    var inputFrame = 0L
                    var nextOutput = 0.0
                    var lastLeft = 0f; var lastRight = 0f
                    var written = 0L
                    fun flush() { packed.flip(); while (packed.hasRemaining()) output.write(packed); packed.clear() }
                    fun write(left: Float, right: Float) {
                        require(written++ < RATE * 300L) { "Import limité à 5 minutes par prise." }
                        if (packed.remaining() < 8) flush()
                        packed.putFloat(left); packed.putFloat(right)
                    }
                    fun consume(buffer: ByteBuffer) {
                        buffer.order(ByteOrder.LITTLE_ENDIAN)
                        val bytes = when (encoding) {
                            AudioFormat.ENCODING_PCM_FLOAT, AudioFormat.ENCODING_PCM_32BIT -> 4
                            AudioFormat.ENCODING_PCM_24BIT_PACKED -> 3
                            AudioFormat.ENCODING_PCM_8BIT -> 1
                            AudioFormat.ENCODING_PCM_16BIT -> 2
                            else -> error("Encodage PCM non pris en charge.")
                        }
                        fun sample(): Float = when (encoding) {
                            AudioFormat.ENCODING_PCM_FLOAT -> buffer.float.let { if (it.isFinite()) it.coerceIn(-1f, 1f) else 0f }
                            AudioFormat.ENCODING_PCM_32BIT -> buffer.int / 2147483648f
                            AudioFormat.ENCODING_PCM_24BIT_PACKED -> {
                                val value = (buffer.get().toInt() and 255) or ((buffer.get().toInt() and 255) shl 8) or (buffer.get().toInt() shl 16)
                                value / 8388608f
                            }
                            AudioFormat.ENCODING_PCM_8BIT -> ((buffer.get().toInt() and 255) - 128) / 128f
                            else -> buffer.short / 32768f
                        }
                        while (buffer.remaining() >= channels * bytes) {
                            val left = sample(); val right = if (channels > 1) sample() else left
                            repeat((channels - 2).coerceAtLeast(0)) { sample() }
                            if (inputFrame == 0L) { lastLeft = left; lastRight = right }
                            while (nextOutput <= inputFrame) {
                                val fraction = (nextOutput - (inputFrame - 1)).toFloat().coerceIn(0f, 1f)
                                write(lastLeft + (left - lastLeft) * fraction, lastRight + (right - lastRight) * fraction)
                                nextOutput += rate.toDouble() / RATE
                            }
                            lastLeft = left; lastRight = right; inputFrame++
                        }
                    }
                    if (format.getString(MediaFormat.KEY_MIME) == "audio/raw") {
                        val buffer = ByteBuffer.allocateDirect(1 shl 20)
                        while (true) {
                            coroutineContext.ensureActive(); buffer.clear()
                            val size = extractor.readSampleData(buffer, 0)
                            if (size < 0) break
                            buffer.position(0); buffer.limit(size); consume(buffer); extractor.advance()
                        }
                    } else {
                        val decoder = MediaCodec.createDecoderByType(format.getString(MediaFormat.KEY_MIME)!!)
                        codec = decoder; decoder.configure(format, null, null, 0); decoder.start()
                        var inputDone = false; var outputDone = false
                        val info = MediaCodec.BufferInfo()
                        while (!outputDone) {
                            coroutineContext.ensureActive()
                            if (!inputDone) {
                                val slot = decoder.dequeueInputBuffer(0)
                                if (slot >= 0) {
                                    val buffer = decoder.getInputBuffer(slot)!!
                                    val size = extractor.readSampleData(buffer, 0)
                                    if (size < 0) { decoder.queueInputBuffer(slot, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM); inputDone = true }
                                    else { decoder.queueInputBuffer(slot, 0, size, extractor.sampleTime, 0); extractor.advance() }
                                }
                            }
                            when (val slot = decoder.dequeueOutputBuffer(info, 10_000)) {
                                MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                                    val f = decoder.outputFormat
                                    rate = f.getInteger(MediaFormat.KEY_SAMPLE_RATE); channels = f.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
                                    encoding = if (f.containsKey(MediaFormat.KEY_PCM_ENCODING)) f.getInteger(MediaFormat.KEY_PCM_ENCODING) else AudioFormat.ENCODING_PCM_16BIT
                                }
                                else -> if (slot >= 0) {
                                    if (info.size > 0) decoder.getOutputBuffer(slot)!!.let { it.position(info.offset); it.limit(info.offset + info.size); consume(it) }
                                    decoder.releaseOutputBuffer(slot, false)
                                    outputDone = info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0
                                }
                            }
                        }
                    }
                    flush(); require(written > 0) { "Le fichier audio est vide." }
                }
                check(partial.renameTo(target)) { "Impossible de préparer le fichier audio." }
            } finally {
                runCatching { codec?.stop() }; codec?.release(); extractor.release(); partial.delete()
            }
        }
        return RandomAccessFile(target, "r").use { file ->
            val pcm = file.channel.map(FileChannel.MapMode.READ_ONLY, 0, file.length()).order(ByteOrder.LITTLE_ENDIAN).asFloatBuffer()
            val frames = pcm.limit() / 2
            val peaks = List(96) { bucket ->
                var peak = 0f
                val start = bucket * frames / 96; val end = ((bucket + 1) * frames / 96).coerceAtMost(frames)
                for (frame in start until end step max(1, (end - start) / 96)) peak = max(peak, max(abs(pcm.get(frame * 2)), abs(pcm.get(frame * 2 + 1))))
                peak
            }
            WavePcm(pcm, frames, peaks)
        }
    }
}

internal data class WaveVoiceSnapshot(val id: String, val phase: String, val progress: Float)
internal data class WaveAudioSnapshot(val running: Boolean = false, val frame: Long = 0, val voices: List<WaveVoiceSnapshot> = emptyList(), val cue: String? = null, val error: String? = null)

/** Port of the iOS clock/clip policies. A single AudioTrack mixes all voices sample by sample. */
internal class WaveCompositionAudio : AutoCloseable {
    private data class Voice(val id: String, val pcm: WavePcm, var start: Long = -1, var repeats: Int = -1,
        var mute: Boolean = false, var solo: Boolean = false, var gain: Float = .7f, var smoothGain: Float = 0f)
    private val commands = ConcurrentLinkedQueue<() -> Unit>()
    private val voices = linkedMapOf<String, Voice>()
    @Volatile private var alive = true
    @Volatile var snapshot = WaveAudioSnapshot(); private set
    private var clock = 0L; private var running = false; private var bpm = 124
    private var cue: Voice? = null; private var cueFrame = 0
    private var output: AudioTrack? = null
    private var master = 1f
    fun masterGain(value: Float) = command { master = value.coerceIn(0f, 1f) }
    private fun command(action: () -> Unit) { if (alive) commands.add(action) }
    fun prepare(id: String, pcm: WavePcm, repeats: Int) = command {
        if (id !in voices && voices.size < 20) voices[id] = Voice(id, pcm, repeats = repeats)
    }
    fun remove(id: String) = command { voices.remove(id) }
    fun tempo(value: Int) = command { if (!running) bpm = value.coerceIn(40, 240) }
    fun toggleClock() = command { if (running) stopInternal() else { running = true; clock = 0 } }
    fun launch(id: String) = command {
        val voice = voices[id] ?: return@command
        if (voice.start >= 0) { voice.start = -1; return@command }
        val barFrames = 4.0 * 60 * WaveCompositionDecoder.RATE / bpm
        if (!running) { running = true; clock = 0; voice.start = 0 }
        else voice.start = (ceil((clock + 1) / barFrames) * barFrames).roundToLong()
    }
    fun mix(id: String, mute: Boolean, solo: Boolean, gain: Float, repeats: Int) = command {
        voices[id]?.let { it.mute = mute; it.solo = solo; it.gain = gain; it.repeats = repeats }
    }
    fun preview(id: String, pcm: WavePcm) = command { cue = if (cue?.id == id) null else Voice(id, pcm, gain = .8f); cueFrame = 0 }
    fun stopPreview() = command { cue = null }
    fun stop() = command { stopInternal(); cue = null }
    private fun stopInternal() { running = false; clock = 0; voices.values.forEach { it.start = -1; it.smoothGain = 0f }; output?.pause(); output?.flush() }
    private val thread = Thread({
        Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO)
        val block = FloatArray(512 * 2)
        try {
            while (alive) {
                while (true) (commands.poll() ?: break).invoke()
                if (!alive) break
                if (!running && cue == null) { snapshot = WaveAudioSnapshot(voices = voices.values.map { WaveVoiceSnapshot(it.id, "Prêt", 0f) }); output?.pause(); Thread.sleep(12); continue }
                val track = output ?: AudioTrack.Builder()
                    .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
                    .setAudioFormat(AudioFormat.Builder().setSampleRate(WaveCompositionDecoder.RATE).setChannelMask(AudioFormat.CHANNEL_OUT_STEREO).setEncoding(AudioFormat.ENCODING_PCM_FLOAT).build())
                    .setTransferMode(AudioTrack.MODE_STREAM)
                    .setBufferSizeInBytes(max(8192, AudioTrack.getMinBufferSize(WaveCompositionDecoder.RATE, AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_FLOAT)))
                    .build().also { check(it.state == AudioTrack.STATE_INITIALIZED); output = it }
                if (track.playState != AudioTrack.PLAYSTATE_PLAYING) track.play()
                block.fill(0f)
                val hasSolo = voices.values.any { it.solo }
                for (voice in voices.values) {
                    if (!running || voice.start < 0) continue
                    val targetGain = if (cue != null || voice.mute || (hasSolo && !voice.solo)) 0f else voice.gain
                    for (i in 0 until 512) {
                        val elapsed = clock + i - voice.start
                        if (elapsed < 0) continue
                        if (voice.repeats > 0 && elapsed >= voice.pcm.frames.toLong() * voice.repeats) { voice.start = -1; break }
                        voice.smoothGain += (targetGain - voice.smoothGain) * .006f
                        val source = (elapsed % voice.pcm.frames).toInt() * 2
                        block[i * 2] += voice.pcm.samples.get(source) * voice.smoothGain
                        block[i * 2 + 1] += voice.pcm.samples.get(source + 1) * voice.smoothGain
                    }
                }
                cue?.let { preview ->
                    for (i in 0 until 512) {
                        if (cueFrame >= preview.pcm.frames) { cue = null; break }
                        val gain = min(1f, cueFrame / 240f) * preview.gain
                        block[i * 2] += preview.pcm.samples.get(cueFrame * 2) * gain
                        block[i * 2 + 1] += preview.pcm.samples.get(cueFrame * 2 + 1) * gain
                        cueFrame++
                    }
                }
                // Peak protection: preserve quiet material and bound summed peaks.
                for (i in block.indices) block[i] = (block[i] * master).coerceIn(-.98f, .98f)
                var offset = 0
                while (offset < block.size && alive) {
                    val n = track.write(block, offset, block.size - offset, AudioTrack.WRITE_BLOCKING)
                    check(n > 0) { "La sortie audio est indisponible." }; offset += n
                }
                if (running) clock += 512
                snapshot = WaveAudioSnapshot(running, clock, voices.values.map {
                    val elapsed = clock - it.start
                    WaveVoiceSnapshot(it.id, if (it.start < 0) "Prêt" else if (elapsed < 0) "Prochaine mesure" else "En lecture",
                        if (it.start < 0 || elapsed < 0) 0f else (elapsed % it.pcm.frames).toFloat() / it.pcm.frames)
                }, cue?.id)
            }
        } catch (_: InterruptedException) { /* Closing. */ }
        catch (e: Exception) { snapshot = WaveAudioSnapshot(error = e.message ?: "Sortie audio indisponible") }
        finally { runCatching { output?.stop() }; output?.release(); output = null }
    }, "Meewav-Wave-Clock").apply { start() }
    override fun close() { alive = false; thread.interrupt() }
}
