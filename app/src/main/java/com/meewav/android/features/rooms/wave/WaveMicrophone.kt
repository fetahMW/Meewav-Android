package com.meewav.android.features.rooms.wave

import android.annotation.SuppressLint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Process
import com.meewav.android.BuildConfig
import java.util.concurrent.ArrayBlockingQueue

internal object WaveVocalDsp {
    init { System.loadLibrary("meewav_analysis") }
    external fun create(license: String): Long
    external fun process(handle: Long, samples: FloatArray, tune: Boolean, scale: Int, reverb: Boolean, amount: Float)
    external fun release(handle: Long)
}

/** Mic owns its DSP; only processed voice leaves this object. Short queue bounds route latency. */
internal class WaveMicrophone(private val onFailure: (String) -> Unit) : AutoCloseable {
    @Volatile var settings = WaveVocalSettings()
    @Volatile private var running = false
    private var recorder: AudioRecord? = null
    private var thread: Thread? = null
    private val voice = ArrayBlockingQueue<FloatArray>(3)
    fun read(): FloatArray? = voice.poll()
    @SuppressLint("MissingPermission")
    fun start() {
        check(!running)
        val minimum = AudioRecord.getMinBufferSize(48000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        check(minimum > 0) { "Capture 48 kHz indisponible" }
        val record = AudioRecord.Builder().setAudioSource(MediaRecorder.AudioSource.VOICE_RECOGNITION)
            .setAudioFormat(AudioFormat.Builder().setSampleRate(48000).setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                .setEncoding(AudioFormat.ENCODING_PCM_16BIT).build())
            .setBufferSizeInBytes(maxOf(minimum, 480 * 8)).build()
        recorder = record
        check(record.state == AudioRecord.STATE_INITIALIZED) { "Micro indisponible" }
        record.startRecording()
        check(record.recordingState == AudioRecord.RECORDSTATE_RECORDING) { "Capture micro refusée" }
        running = true
        thread = Thread({
            Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO)
            var dsp = 0L
            try {
                dsp = WaveVocalDsp.create(BuildConfig.SUPERPOWERED_LICENSE_KEY)
                check(dsp != 0L) { "DSP vocal indisponible" }
                val mono = ShortArray(480)
                while (running) {
                    var read = 0
                    while (running && read < mono.size) {
                        val count = record.read(mono, read, mono.size - read, AudioRecord.READ_BLOCKING)
                        check(count > 0) { "Capture micro interrompue ($count)" }; read += count
                    }
                    if (!running) break
                    val config = settings
                    val stereo = FloatArray(960) { mono[it / 2] / 32768f }
                    WaveVocalDsp.process(dsp, stereo, config.tune, config.scale, config.reverb, config.reverbMix)
                    if (!voice.offer(stereo)) { voice.poll(); voice.offer(stereo) }
                }
            } catch (failure: Throwable) { if (running) onFailure(failure.message ?: "DSP vocal interrompu") }
            finally { if (dsp != 0L) WaveVocalDsp.release(dsp) }
        }, "Wave-Micro-DSP").apply { start() }
    }
    override fun close() {
        running = false
        runCatching { recorder?.stop() }
        thread?.join()
        recorder?.release(); recorder = null; thread = null; voice.clear()
    }
}

internal class WaveLiveOutput(val microphone: WaveMicrophone, val bus: WavePerformanceBus) {
    val production = WaveProgramInput()
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
            if (config.monitoring) monitor[i] = (monitor[i] + vocal).coerceIn(-.98f, .98f)
        }
        bus.offer(program)
    }
}
