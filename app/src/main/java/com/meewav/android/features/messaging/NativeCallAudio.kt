package com.meewav.android.features.messaging

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.Ringtone
import android.media.RingtoneManager
import android.os.Build
import android.os.Handler
import android.os.Looper

/** Owns foreground call audio only; Android retains volume, silent and DND policy. */
class NativeCallAudio(context: Context, private val interrupted: () -> Unit) {
    private val manager = context.getSystemService(AudioManager::class.java)
    private val appContext = context.applicationContext
    private var ringtone: Ringtone? = null
    private var focused = false
    private var previousMode = AudioManager.MODE_NORMAL
    private var previousSpeaker = false
    private val focus = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
        .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
        .setOnAudioFocusChangeListener { change ->
            if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                stop(); interrupted()
            }
        }.build()
    private val devices = object : AudioDeviceCallback() {
        override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>) { if (focused) route() }
        override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>) { if (focused) route() }
    }
    init { manager.registerAudioDeviceCallback(devices, Handler(Looper.getMainLooper())) }

    fun incoming() {
        if (ringtone != null || focused) return
        try {
            ringtone = RingtoneManager.getRingtone(appContext, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE))?.apply {
                audioAttributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build()
                if (Build.VERSION.SDK_INT >= 28) isLooping = true
                play()
            }
        } catch (_: Exception) { /* The visible incoming-call panel remains available. */ }
    }
    fun connecting() {
        ringtone?.stop(); ringtone = null
        if (focused) return
        if (manager.requestAudioFocus(focus) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) { interrupted(); return }
        previousMode = manager.mode
        @Suppress("DEPRECATION")
        previousSpeaker = manager.isSpeakerphoneOn
        focused = true
        manager.mode = AudioManager.MODE_IN_COMMUNICATION
        route()
    }
    private fun route() {
        try {
            if (Build.VERSION.SDK_INT >= 31) {
                val external = setOf(AudioDeviceInfo.TYPE_BLUETOOTH_SCO, AudioDeviceInfo.TYPE_BLE_HEADSET,
                    AudioDeviceInfo.TYPE_WIRED_HEADSET, AudioDeviceInfo.TYPE_WIRED_HEADPHONES, AudioDeviceInfo.TYPE_USB_HEADSET)
                val choices = manager.availableCommunicationDevices
                val target = choices.firstOrNull { it.type in external }
                    ?: choices.firstOrNull { it.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
                if (target != null) manager.setCommunicationDevice(target)
            } else {
                @Suppress("DEPRECATION")
                val external = manager.isBluetoothScoOn || manager.isWiredHeadsetOn
                @Suppress("DEPRECATION")
                manager.isSpeakerphoneOn = !external
            }
        } catch (_: SecurityException) { /* Keep Android's current audio route. */ }
    }
    fun stop() {
        ringtone?.stop(); ringtone = null
        if (!focused) return
        focused = false
        if (Build.VERSION.SDK_INT >= 31) manager.clearCommunicationDevice()
        else { @Suppress("DEPRECATION")
            manager.isSpeakerphoneOn = previousSpeaker
        }
        manager.mode = previousMode
        manager.abandonAudioFocusRequest(focus)
    }
    fun destroy() { stop(); manager.unregisterAudioDeviceCallback(devices) }
}
