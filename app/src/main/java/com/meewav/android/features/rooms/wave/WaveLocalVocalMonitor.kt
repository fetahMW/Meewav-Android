package com.meewav.android.features.rooms.wave

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.os.Handler
import android.os.Looper
import android.os.Process
import android.util.Log
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit

/** Plays the processed microphone locally, only when an earphone output is available. */
internal class WaveLocalVocalMonitor(context: Context) : AutoCloseable {
    companion object {
        fun hasHeadphones(context: Context): Boolean = headphone(context.getSystemService(AudioManager::class.java)) != null

        private fun headphone(manager: AudioManager): AudioDeviceInfo? = manager
            .getDevices(AudioManager.GET_DEVICES_OUTPUTS)
            .firstOrNull { device -> device.type in setOf(
                AudioDeviceInfo.TYPE_WIRED_HEADSET,
                AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
                AudioDeviceInfo.TYPE_USB_HEADSET,
                AudioDeviceInfo.TYPE_BLE_HEADSET,
                AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
                AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
            ) }
    }

    private val manager = context.getSystemService(AudioManager::class.java)
    private val blocks = ArrayBlockingQueue<FloatArray>(3)
    @Volatile private var route = headphone(manager)
    @Volatile private var alive = true
    @Volatile var enabled = false
        set(value) {
            field = value
            if (!value) blocks.clear()
        }
    private val callback = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) { route = headphone(manager) }
        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>) {
            route = headphone(manager)
            blocks.clear()
        }
    }
    private val writer = Thread({
        Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO)
        var track: AudioTrack? = null
        var routeId = -1
        try {
            while (alive) {
                val block = blocks.poll(100, TimeUnit.MILLISECONDS) ?: continue
                val device = route
                if (!enabled || device == null) continue
                if (track == null || routeId != device.id) {
                    track?.release()
                    track = AudioTrack.Builder()
                        .setAudioAttributes(AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
                        .setAudioFormat(AudioFormat.Builder()
                            .setSampleRate(48000)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                            .setEncoding(AudioFormat.ENCODING_PCM_FLOAT).build())
                        .setTransferMode(AudioTrack.MODE_STREAM)
                        .setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
                        .setBufferSizeInBytes(maxOf(8192, AudioTrack.getMinBufferSize(
                            48000, AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_FLOAT)))
                        .build()
                    if (track.state != AudioTrack.STATE_INITIALIZED || !track.setPreferredDevice(device)) {
                        track.release(); track = null; continue
                    }
                    routeId = device.id
                    track.play()
                }
                var offset = 0
                while (alive && enabled && route?.id == routeId && offset < block.size) {
                    val written = track.write(block, offset, block.size - offset, AudioTrack.WRITE_BLOCKING)
                    if (written <= 0) break
                    offset += written
                }
            }
        } catch (_: InterruptedException) {
            // The room is closing.
        } catch (error: Exception) {
            Log.w("WaveRTC", "Local vocal monitor stopped", error)
        } finally {
            runCatching { track?.stop() }
            track?.release()
        }
    }, "Wave-Local-Vocal").apply { start() }

    init { manager.registerAudioDeviceCallback(callback, Handler(Looper.getMainLooper())) }

    fun offer(samples: FloatArray) {
        if (!alive || !enabled || route == null) return
        val copy = samples.copyOf()
        if (!blocks.offer(copy)) { blocks.poll(); blocks.offer(copy) }
    }

    override fun close() {
        alive = false
        enabled = false
        manager.unregisterAudioDeviceCallback(callback)
        writer.interrupt()
        writer.join()
    }
}
