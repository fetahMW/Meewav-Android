package com.meewav.android.features.rooms.wave

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.util.Log
import java.util.concurrent.locks.LockSupport

internal object WaveNativeDuplex {
    init { System.loadLibrary("meewav_analysis") }
    external fun open(inputDevice: Int, outputDevice: Int, rawInput: Boolean): Long
    external fun configure(handle: Long, flags: Int, gain: Float, scale: Int, mix: Float, calibration: Int)
    external fun read(handle: Long, samples: FloatArray): Int
    external fun diagnostics(handle: Long): String
    external fun close(handle: Long)
}

/** Control/publication thread only. The private monitor never crosses this thread or JNI. */
internal class WaveNativeCapture(
    context: Context,
    private val settings: () -> WaveVocalSettings,
    private val publish: (FloatArray) -> Unit,
    private val onFailure: (String) -> Unit,
) : AutoCloseable {
    private val manager = context.getSystemService(AudioManager::class.java)
    private val rawInput = manager.getProperty(AudioManager.PROPERTY_SUPPORT_AUDIO_SOURCE_UNPROCESSED).toBoolean()
    private data class Route(val input: Int, val output: Int, val headphones: Boolean)
    private fun route(): Route {
        val wiredTypes = setOf(AudioDeviceInfo.TYPE_USB_HEADSET, AudioDeviceInfo.TYPE_USB_DEVICE,
            AudioDeviceInfo.TYPE_WIRED_HEADSET, AudioDeviceInfo.TYPE_WIRED_HEADPHONES)
        val output = manager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).firstOrNull { it.type in wiredTypes }
        val input = manager.getDevices(AudioManager.GET_DEVICES_INPUTS).firstOrNull { it.type in wiredTypes }
        return Route(input?.id ?: 0, output?.id ?: 0, output != null)
    }
    @Volatile private var running = false
    private var worker: Thread? = null

    fun start(): Boolean {
        var selected = route()
        var calibrationBase = settings().noiseCalibration
        var handle = WaveNativeDuplex.open(selected.input, selected.output, rawInput)
        if (handle == 0L) return false
        running = true
        worker = Thread({
            var configured: WaveVocalSettings? = null
            var reportAt = 0L
            var routeAt = 0L
            val samples = FloatArray(960)
            try {
                while (running) {
                    val now = System.nanoTime()
                    val next = if (now >= routeAt) route().also { routeAt = now + 250_000_000L } else selected
                    val read = WaveNativeDuplex.read(handle, samples)
                    if (next != selected || read < 0) {
                        WaveNativeDuplex.close(handle)
                        handle = 0L
                        selected = next
                        // A new microphone needs a fresh, deliberate silent measurement.
                        // Do not replay a previous calibration command while someone talks.
                        calibrationBase = settings().noiseCalibration
                        handle = WaveNativeDuplex.open(selected.input, selected.output, rawInput)
                        check(handle != 0L) { "Retour audio natif indisponible après changement de casque" }
                        configured = null
                    } else if (read > 0) publish(samples.copyOf())
                    val config = settings().let { it.copy(monitoring = it.monitoring && selected.headphones) }
                    if (config != configured) {
                        val flags = (if (config.monitoring) 1 else 0) or (if (config.mute) 2 else 0) or
                            (if (config.tune) 4 else 0) or (if (config.reverb) 8 else 0) or (if (config.cleanVoice) 32 else 0) or (config.proEffects and 448)
                        WaveNativeDuplex.configure(handle, flags, config.gain, config.scale, config.reverbMix, config.noiseCalibration - calibrationBase)
                        configured = config
                    }
                    if (now >= reportAt) {
                        Log.i("WaveLatency", WaveNativeDuplex.diagnostics(handle))
                        reportAt = now + 2_000_000_000L
                    }
                    if (read == 0) LockSupport.parkNanos(1_000_000L)
                }
            } catch (error: Throwable) {
                if (running) onFailure(error.message ?: "Retour audio natif interrompu")
            } finally {
                if (handle != 0L) WaveNativeDuplex.close(handle)
            }
        }, "Wave-Native-Publication").apply { start() }
        return true
    }

    override fun close() {
        running = false
        worker?.join()
        worker = null
    }
}
