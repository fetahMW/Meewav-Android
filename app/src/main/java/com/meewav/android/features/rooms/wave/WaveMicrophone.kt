package com.meewav.android.features.rooms.wave

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.AudioTimestamp
import android.media.MediaRecorder
import android.os.Process
import android.os.Build
import android.util.Log

internal object WaveVocalDsp {
    init { System.loadLibrary("meewav_analysis") }
    external fun create(): Long
    external fun process(handle: Long, samples: FloatArray, tune: Boolean, scale: Int, reverb: Boolean, amount: Float, cleanVoice: Boolean, calibration: Int, effects: Int)
    external fun release(handle: Long)
}

/** Mic owns its DSP; only processed voice leaves this object. Short queue bounds route latency. */
internal class WaveMicrophone(
    private val context: Context? = null,
    private val onMonitor: ((FloatArray, WaveVocalSettings) -> Unit)? = null,
    private val onFailure: (String) -> Unit,
) : AutoCloseable {
    val hasDirectMonitor get() = onMonitor != null
    @Volatile var settings = WaveVocalSettings()
    @Volatile private var running = false
    private var recorder: AudioRecord? = null
    private var thread: Thread? = null
    private var nativeCapture: WaveNativeCapture? = null
    private val voice = WaveVocalPacketQueue()
    fun read(): FloatArray? = voice.poll()
    fun publicationDiagnostics(): String = voice.diagnostics()
    /** Deliver to the local output before any composition clock or RTC consumer can wait. */
    internal fun deliver(samples: FloatArray, config: WaveVocalSettings) {
        onMonitor?.invoke(samples, config)
        voice.offer(samples)
    }
    @SuppressLint("MissingPermission")
    fun start() {
        check(!running)
        if (context != null) {
            val native = WaveNativeCapture(context, { settings }, { samples ->
                voice.offer(samples)
            }, onFailure)
            if (native.start()) {
                nativeCapture = native
                running = true
                return
            }
            Log.w("WaveRTC", "Native duplex unavailable; using platform capture")
        }
        val minimum = AudioRecord.getMinBufferSize(48000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        check(minimum > 0) { "Capture 48 kHz indisponible" }
        val source = if (Build.VERSION.SDK_INT >= 29) MediaRecorder.AudioSource.VOICE_PERFORMANCE
            else MediaRecorder.AudioSource.VOICE_RECOGNITION
        val record = AudioRecord.Builder().setAudioSource(source)
            .setAudioFormat(AudioFormat.Builder().setSampleRate(48000).setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT).build())
            .setBufferSizeInBytes(maxOf(minimum, 480 * 8)).build()
        recorder = record
        check(record.state == AudioRecord.STATE_INITIALIZED) { "Micro indisponible" }
        record.startRecording()
        check(record.recordingState == AudioRecord.RECORDSTATE_RECORDING) { "Capture micro refusée" }
        Log.i("WaveRTC", "Vocal capture buffer=${record.bufferSizeInFrames} frames route=${record.routedDevice?.type}")
        running = true
        thread = Thread({
            Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO)
            var dsp = 0L
            try {
                dsp = WaveVocalDsp.create()
                check(dsp != 0L) { "DSP vocal indisponible" }
                val mono = ShortArray(480)
                val timestamp = AudioTimestamp()
                var capturedFrames = 0L
                var cleanTailFrames = 0
                var effectsTailFrames = 0
                val calibrationBase = settings.noiseCalibration
                var reportAt = 0L
                while (running) {
                    val readStart = System.nanoTime()
                    var read = 0
                    while (running && read < mono.size) {
                        val count = record.read(mono, read, mono.size - read, AudioRecord.READ_BLOCKING)
                        check(count > 0) { "Capture micro interrompue ($count)" }; read += count
                    }
                    if (!running) break
                    capturedFrames += read
                    val readEnd = System.nanoTime()
                    val config = settings
                    val stereo = FloatArray(960) { mono[it / 2] / 32768f }
                    // No effect work or JNI buffer copies on the dry path.
                    if (config.cleanVoice) cleanTailFrames = 480
                    if (config.proEffects != 0) effectsTailFrames = 24000
                    if (config.tune || config.reverb || config.cleanVoice || effectsTailFrames > 0 || cleanTailFrames > 0) {
                        WaveVocalDsp.process(dsp, stereo, config.tune, config.scale, config.reverb, config.reverbMix, config.cleanVoice, config.noiseCalibration - calibrationBase, config.proEffects)
                    }
                    if (!config.cleanVoice) cleanTailFrames = 0
                    if (config.proEffects == 0) effectsTailFrames = (effectsTailFrames - 480).coerceAtLeast(0)
                    val dspEnd = System.nanoTime()
                    deliver(stereo, config)
                    if (dspEnd >= reportAt) {
                        val timestampOk = record.getTimestamp(timestamp, AudioTimestamp.TIMEBASE_MONOTONIC) == AudioRecord.SUCCESS
                        val captureEndAgeMs = if (timestampOk) {
                            val endTime = timestamp.nanoTime + (capturedFrames - timestamp.framePosition) * 1_000_000_000L / 48000
                            (readEnd - endTime) / 1_000_000.0
                        } else null
                        // Timestamp extrapolation is an estimate, invalid after capture overruns;
                        // keep the counters so a device trace can distinguish that case.
                        Log.i("WaveLatency", "capture readBlockMs=${(readEnd - readStart) / 1_000_000.0} captureEndAgeEstimateMs=$captureEndAgeMs readFrames=$capturedFrames timestampFrame=${if (timestampOk) timestamp.framePosition else null} dspMs=${(dspEnd - readEnd) / 1_000_000.0} bufferFrames=${record.bufferSizeInFrames} route=${record.routedDevice?.type} tune=${config.tune} reverb=${config.reverb}")
                        reportAt = dspEnd + 2_000_000_000L
                    }
                }
            } catch (failure: Throwable) { if (running) onFailure(failure.message ?: "DSP vocal interrompu") }
            finally { if (dsp != 0L) WaveVocalDsp.release(dsp) }
        }, "Wave-Micro-DSP").apply { start() }
    }
    override fun close() {
        running = false
        nativeCapture?.close(); nativeCapture = null
        runCatching { recorder?.stop() }
        thread?.join()
        recorder?.release(); recorder = null; thread = null; voice.clear()
    }
}

internal class WaveLiveOutput(val microphone: WaveMicrophone, val bus: WavePerformanceBus) {
    val production = WaveProgramInput()
    val composition = WaveProgramInput().apply { enabled = true }
    @Volatile var active = true
    @Volatile var musicPublic = false
    @Volatile var musicGain = 1f
    fun render(voice: FloatArray?, program: FloatArray, monitor: FloatArray) {
        if (!active) return
        val config = microphone.settings
        val imported = production.poll()
        for (i in program.indices) {
            val vocal = if (config.mute) 0f else (voice?.get(i) ?: 0f) * config.gain
            program[i] = (if (musicPublic) program[i] * musicGain else 0f) + vocal + (imported?.get(i) ?: 0f) * production.gain
            if (config.monitoring && !microphone.hasDirectMonitor) monitor[i] = (monitor[i] + vocal).coerceIn(-.98f, .98f)
        }
        bus.offer(program)
    }
}
