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
import android.os.Build
import android.util.Log
import kotlin.math.abs
import kotlin.math.sqrt
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/** Plays the processed microphone locally, only when an earphone output is available. */
internal class WaveLocalVocalMonitor(context: Context) : AutoCloseable {
    companion object {
        fun hasHeadphones(context: Context): Boolean = headphone(context.getSystemService(AudioManager::class.java)) != null

        private fun isWiredLowLatencyDevice(device: AudioDeviceInfo?): Boolean = when (device?.type) {
            AudioDeviceInfo.TYPE_WIRED_HEADSET, AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
            AudioDeviceInfo.TYPE_USB_HEADSET, AudioDeviceInfo.TYPE_USB_DEVICE -> true
            else -> false
        }

        private fun headphone(manager: AudioManager): AudioDeviceInfo? = manager
            .getDevices(AudioManager.GET_DEVICES_OUTPUTS)
            .sortedBy { if (isWiredLowLatencyDevice(it)) 0 else 1 }
            .firstOrNull { device -> device.type in setOf(
                AudioDeviceInfo.TYPE_WIRED_HEADSET,
                AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
                AudioDeviceInfo.TYPE_USB_HEADSET,
                AudioDeviceInfo.TYPE_USB_DEVICE,
                AudioDeviceInfo.TYPE_BLE_HEADSET,
                AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
                AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
            ) }
    }

    private val manager = context.getSystemService(AudioManager::class.java)
    private data class Block(val samples: FloatArray, val capturedAt: Long, val generation: Int)
    // The monitor is a live output, not a recording: never accumulate voice to replay later.
    private val blocks = ArrayBlockingQueue<Block>(1)
    private val generation = AtomicInteger()
    // USB capture arrives in 20 ms hardware bursts. Keep both 10 ms halves together so
    // playback receives a continuous 20 ms block instead of underrunning between halves.
    private var firstHalf: FloatArray? = null
    private var firstHalfGeneration = -1
    @Volatile private var route = headphone(manager)
    @Volatile private var alive = true
    @Volatile var enabled = false
        set(value) {
            if (field == value) return
            field = value
            generation.incrementAndGet()
            blocks.clear()
        }
    private fun refreshRoute() {
        val next = headphone(manager)
        // Android also reports input and unrelated output changes here. Recreating a
        // playing AudioTrack for those events cuts the monitor even though its USB
        // headset did not change.
        if (route?.id == next?.id && route?.type == next?.type) return
        Log.i("WaveRTC", "Vocal monitor output changed ${route?.type}:${route?.id} -> ${next?.type}:${next?.id}")
        route = next
        generation.incrementAndGet()
        blocks.clear()
    }
    private val callback = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) = refreshRoute()
        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>) = refreshRoute()
    }
    private val writer = Thread({
        Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO)
        var track: AudioTrack? = null
        var routeId = -1
        var trackGeneration = -1
        var underruns = 0
        var writtenFrames = 0L
        var reportAt = 0L
        var startedAt = 0L
        try {
            while (alive) {
                val block = blocks.poll(20, TimeUnit.MILLISECONDS)
                val device = route
                val currentGeneration = generation.get()
                if (!enabled || device == null || trackGeneration != currentGeneration || routeId != device.id) {
                    // Pause + flush discards queued voice after mute, unplug or route changes.
                    track?.pause()
                    track?.flush()
                    track?.release()
                    track = null
                }
                if (!enabled || device == null || block == null || block.generation != currentGeneration) continue
                if (System.nanoTime() - block.capturedAt > 30_000_000L) continue
                if (track == null) {
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
                        .setBufferSizeInBytes(maxOf(1920 * 8, AudioTrack.getMinBufferSize(
                            48000, AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_FLOAT)))
                        .build()
                    if (track.state != AudioTrack.STATE_INITIALIZED || !track.setPreferredDevice(device)) {
                        track.release(); track = null; continue
                    }
                    routeId = device.id
                    trackGeneration = currentGeneration
                    if (isWiredLowLatencyDevice(device)) {
                        track.setBufferSizeInFrames(1344)
                        // Otherwise Android waits for the entire output buffer before
                        // starting, defeating our smaller initial safety cushion.
                        if (Build.VERSION.SDK_INT >= 31) track.setStartThresholdInFrames(960)
                    }
                    // A 4 ms cushion covers scheduling jitter around the USB burst. Prime
                    // while stopped, then start playback with real voice already queued.
                    val initial = FloatArray(block.samples.size + 384)
                    block.samples.copyInto(initial, 384)
                    var primed = track.write(initial, 0, initial.size, AudioTrack.WRITE_NON_BLOCKING)
                    if (primed < 0) primed = 0
                    track.play()
                    while (primed < initial.size && alive && enabled && generation.get() == trackGeneration) {
                        val written = track.write(initial, primed, initial.size - primed, AudioTrack.WRITE_BLOCKING)
                        if (written <= 0) break
                        primed += written
                    }
                    writtenFrames = primed / 2L
                    startedAt = System.nanoTime()
                    underruns = track.underrunCount
                    Log.i("WaveRTC", "Vocal monitor route=${device.type} buffer=${track.bufferSizeInFrames} frames mode=${track.performanceMode} systemMode=${manager.mode} nativeRate=${manager.getProperty(AudioManager.PROPERTY_OUTPUT_SAMPLE_RATE)} nativeBurst=${manager.getProperty(AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER)} deviceRates=${device.sampleRates.joinToString()}")
                    continue
                }
                val writeStart = System.nanoTime()
                var offset = 0
                while (alive && enabled && generation.get() == trackGeneration && offset < block.samples.size) {
                    val written = track.write(block.samples, offset, block.samples.size - offset, AudioTrack.WRITE_BLOCKING)
                    if (written <= 0) break
                    offset += written
                }
                writtenFrames += offset / 2
                val currentUnderruns = track.underrunCount
                val now = System.nanoTime()
                if (isWiredLowLatencyDevice(device) && now - startedAt > 1_000_000_000L && currentUnderruns > underruns) {
                    // Increase one 10 ms block at a time; one startup underrun must not
                    // switch USB monitoring straight back to a large media buffer.
                    val frames = minOf(track.bufferCapacityInFrames, 1920, track.bufferSizeInFrames + 192)
                    if (frames > track.bufferSizeInFrames) track.setBufferSizeInFrames(frames)
                }
                underruns = currentUnderruns
                if (now >= reportAt) {
                    val played = track.playbackHeadPosition.toLong() and 0xffffffffL
                    val queued = ((writtenFrames - played) and 0xffffffffL).coerceAtMost(Int.MAX_VALUE.toLong())
                    val peak = block.samples.maxOf { abs(it) }
                    val rms = sqrt(block.samples.sumOf { (it * it).toDouble() } / block.samples.size)
                    Log.i("WaveLatency", "monitor queueAgeMs=${(writeStart - block.capturedAt) / 1_000_000.0} writeMs=${(now - writeStart) / 1_000_000.0} queuedFrames=$queued bufferFrames=${track.bufferSizeInFrames} underruns=$underruns route=${track.routedDevice?.type}:${track.routedDevice?.id} mode=${track.performanceMode} playState=${track.playState} rms=$rms peak=$peak mediaVolume=${manager.getStreamVolume(AudioManager.STREAM_MUSIC)}")
                    reportAt = now + 2_000_000_000L
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

    fun offer(samples: FloatArray, settings: WaveVocalSettings) {
        if (!alive || !enabled || route == null || !settings.monitoring || settings.mute) {
            firstHalf = null
            return
        }
        val epoch = generation.get()
        val capturedAt = System.nanoTime()
        val copy = FloatArray(samples.size) { (samples[it] * settings.gain).coerceIn(-.98f, .98f) }
        val first = firstHalf
        if (first == null || firstHalfGeneration != epoch || first.size != copy.size) {
            firstHalf = copy
            firstHalfGeneration = epoch
            return
        }
        firstHalf = null
        val combined = FloatArray(first.size + copy.size)
        first.copyInto(combined)
        copy.copyInto(combined, first.size)
        val block = Block(combined, capturedAt, epoch)
        if (!blocks.offer(block)) { blocks.poll(); blocks.offer(block) }
    }

    override fun close() {
        alive = false
        enabled = false
        manager.unregisterAudioDeviceCallback(callback)
        writer.interrupt()
        writer.join()
    }
}
