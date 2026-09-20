package com.meewav.android.features.rooms.wave

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import android.os.SystemClock
import androidx.compose.runtime.*
import kotlinx.coroutines.*

internal data class WavePad(val title: String, val source: String, val color: Long)

/** Local mixer tools, ported from PlaceTwists / placeRoomTime. Independent of the Wave workshop. */
internal class WaveMixerToolsState(private val context: Context, private val onTimerEnd: () -> Unit) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val prefs = context.getSharedPreferences("wave-mixer-tools", Context.MODE_PRIVATE)
    private val defaults = listOf(
        WavePad("Battement", "heartbeat.wav", 0xFFFF4F86),
        WavePad("DJ Horn", "air-horn-trimmed.wav", 0xFFFFC34A),
        WavePad("Applause", "applaudissements.m4a", 0xFFA876FF),
        WavePad("Huées du public", "huees-du-public.mp3", 0xFF7F8CFF),
        WavePad("Roulement", "mixkit-drum-roll-566.wav", 0xFF45C2FF),
        WavePad("Compte à rebours", "countdown-10-seconds.wav", 0xFF64D98B)
    )
    var pads by mutableStateOf(List<WavePad?>(15) { index ->
        prefs.getString("pad-$index", null)?.let { WavePad(prefs.getString("name-$index", "Mon son")!!, it, 0xFFA876FF) }
            ?: defaults.getOrNull(index)
    }); private set
    var activePad by mutableStateOf<Int?>(null); private set
    var padPaused by mutableStateOf(false); private set
    var padLoading by mutableStateOf(false); private set
    var padVolume by mutableFloatStateOf(prefs.getFloat("volume", .2f)); private set
    var countdownBefore by mutableStateOf(prefs.getBoolean("intro", false)); private set
    var hornAfter by mutableStateOf(prefs.getBoolean("outro", false)); private set
    var timerEnabled by mutableStateOf(false); private set
    var durationSeconds by mutableIntStateOf(prefs.getInt("duration", 180)); private set
    var remainingMs by mutableLongStateOf(durationSeconds * 1000L); private set
    var timerRunning by mutableStateOf(false); private set
    var pendingStart by mutableStateOf(false); private set
    var error by mutableStateOf<String?>(null); private set
    private var player: MediaPlayer? = null
    private var deadline = 0L
    private var startAction: (() -> Unit)? = null

    init {
        scope.launch {
            while (isActive) {
                val media = player
                if (pendingStart && media != null && !padPaused && !padLoading) {
                    // Match web: use actual media time, with a one-second overlap before the beat.
                    if (runCatching { media.isPlaying && media.duration - media.currentPosition <= 1000 }.getOrDefault(false)) releaseStart()
                }
                if (timerRunning) {
                    remainingMs = (deadline - SystemClock.elapsedRealtime()).coerceAtLeast(0)
                    if (remainingMs == 0L) finish(true)
                }
                delay(25)
            }
        }
    }
    fun intro(value: Boolean) { countdownBefore = value; prefs.edit().putBoolean("intro", value).apply(); if (!value && pendingStart) cancelStart() }
    fun outro(value: Boolean) { hornAfter = value; prefs.edit().putBoolean("outro", value).apply() }
    fun volume(value: Float) { padVolume = value.coerceIn(0f, 1f); player?.setVolume(padVolume, padVolume); prefs.edit().putFloat("volume", padVolume).apply() }
    fun enable(value: Boolean) { cancelStart(); timerEnabled = value; resetTimer() }
    fun configure(minutes: Int, seconds: Int) {
        durationSeconds = (minutes.coerceIn(0, 99) * 60 + seconds.coerceIn(0, 59)).coerceAtLeast(1)
        prefs.edit().putInt("duration", durationSeconds).apply(); resetTimer()
    }
    fun resetTimer() { cancelStart(); timerRunning = false; remainingMs = durationSeconds * 1000L }
    fun pauseTimer() {
        cancelStart()
        if (timerRunning) remainingMs = (deadline - SystemClock.elapsedRealtime()).coerceAtLeast(0)
        timerRunning = false
    }
    private fun beginTimer() {
        if (!timerEnabled || timerRunning) return
        if (remainingMs <= 0) remainingMs = durationSeconds * 1000L
        deadline = SystemClock.elapsedRealtime() + remainingMs; timerRunning = true
    }
    fun requestStart(fromBeginning: Boolean, action: () -> Unit) {
        if (pendingStart) return
        if (fromBeginning && countdownBefore && !timerRunning) {
            pendingStart = true; startAction = action
            playSource(5, defaults[5], true)
        } else { action(); beginTimer() }
    }
    private fun releaseStart() {
        if (!pendingStart) return
        val action = startAction; startAction = null; pendingStart = false
        action?.invoke(); beginTimer()
    }
    fun cancelStart() {
        if (pendingStart) { pendingStart = false; startAction = null; stopPad() }
    }
    fun finish(stopBeat: Boolean = false) {
        cancelStart(); timerRunning = false; remainingMs = durationSeconds * 1000L
        if (stopBeat) onTimerEnd()
        playEndHorn()
    }
    fun playEndHorn() { if (hornAfter) { cancelStart(); playSource(1, defaults[1]) } }
    fun trigger(index: Int) {
        val pad = pads.getOrNull(index) ?: return
        cancelStart(); playSource(index, pad)
    }
    private fun playSource(index: Int, pad: WavePad, automatic: Boolean = false) {
        stopPad(); error = null; activePad = index; padLoading = true
        val media = MediaPlayer(); player = media
        try {
            media.setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
            if (pad.source.contains(":")) media.setDataSource(context, Uri.parse(pad.source))
            else context.assets.openFd("rooms/audio/pads/${pad.source}").use { media.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
            media.setVolume(padVolume, padVolume)
            media.setOnPreparedListener { if (player === it) { padLoading = false; it.start() } }
            media.setOnCompletionListener { if (player === it) { if (automatic) releaseStart(); stopPad() } }
            media.setOnErrorListener { _, _, _ ->
                if (player === media) { pendingStart = false; startAction = null; stopPad(); error = "Lecture du pad impossible. Relance le son." }; true
            }
            media.prepareAsync()
        } catch (_: Exception) { pendingStart = false; startAction = null; stopPad(); error = "Ce son n’est pas accessible." }
    }
    fun togglePadPause() {
        val media = player ?: return
        if (padLoading) return
        if (padPaused) media.start() else media.pause()
        padPaused = !padPaused
    }
    fun stopPad() { player?.release(); player = null; activePad = null; padPaused = false; padLoading = false }
    fun stopAllPads() { cancelStart(); stopPad() }
    fun setPad(index: Int, uri: Uri, name: String) {
        if (index == activePad) stopAllPads()
        pads = pads.toMutableList().also { it[index] = WavePad(name.substringBeforeLast('.', name), uri.toString(), 0xFFA876FF) }
        prefs.edit().putString("pad-$index", uri.toString()).putString("name-$index", name).apply()
    }
    fun restorePad(index: Int) {
        if (index == activePad) stopAllPads()
        pads = pads.toMutableList().also { it[index] = defaults.getOrNull(index) }
        prefs.edit().remove("pad-$index").remove("name-$index").apply()
    }
    override fun close() { startAction = null; pendingStart = false; scope.cancel(); stopPad() }
}
