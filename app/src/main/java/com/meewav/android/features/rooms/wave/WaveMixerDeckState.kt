package com.meewav.android.features.rooms.wave

import android.content.Context
import android.net.Uri
import androidx.compose.runtime.*
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.util.UUID

internal data class WaveDeckLane(val id: String = UUID.randomUUID().toString(), val name: String = "Importer un audio",
    val source: String? = null, val pcm: WavePcm? = null, val muted: Boolean = false, val solo: Boolean = false, val loading: Boolean = false,
    val musical: String = "")

/** Separate engine and gain from the Wave Vote/Composition player. IDs survive reordering. */
internal class WaveMixerDeckState(private val context: Context, val allowPublic: Boolean = true) : AutoCloseable {
    val documentPicker = RoomDocumentPickerState()
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val lock = Mutex()
    val audio = WaveCompositionAudio()
    val tools = WaveMixerToolsState(context) { audio.stop(); audio.seek(0) }
    var lanes by mutableStateOf(listOf(WaveDeckLane(id = "main"))); private set
    var snapshot by mutableStateOf(WaveAudioSnapshot()); private set
    var repeat by mutableStateOf(false); private set
    var public by mutableStateOf(false); private set
    var error by mutableStateOf<String?>(null); private set
    private val jobs = mutableMapOf<String, Job>()
    val duration get() = lanes.maxOfOrNull { it.pcm?.frames ?: 0 } ?: 0
    init {
        audio.monitor(WaveListeningMode.MIX, true)
        scope.launch { while (isActive) {
            snapshot = audio.snapshot
            if (snapshot.running && !repeat && snapshot.frame >= duration && duration > 0) { audio.stop(); tools.finish() }
            delay(33)
        } }
    }
    fun volume(value: Float) = audio.masterGain(value)
    fun pause() { tools.pauseTimer(); if (audio.snapshot.running) audio.toggleClock() }
    fun suspendAudio() { pause(); tools.stopAllPads() }
    fun route() { if (!allowPublic) return; pause(); public = !public }
    fun toggleLoop() { repeat = !repeat; syncLoop() }
    private fun syncLoop() { audio.loop(0, if (repeat) duration.toLong() else 0) }
    fun toggle() {
        if (tools.pendingStart || audio.snapshot.running) { pause(); return }
        if (lanes.any { it.pcm != null } && lanes.none { it.loading }) {
            if (audio.snapshot.frame >= duration) audio.seek(0)
            tools.requestStart(audio.snapshot.frame == 0L) { if (!audio.snapshot.running) audio.toggleClock() }
        }
    }
    fun toggleChrono() {
        if (tools.timerRunning || tools.pendingStart) pause()
        else tools.requestStart(tools.remainingMs == tools.durationSeconds * 1000L) { }
    }
    fun seek(progress: Float) { audio.seek((duration * progress.coerceIn(0f, 1f)).toLong()) }
    fun add(): String { val lane = WaveDeckLane(); lanes = lanes + lane; return lane.id }
    fun remove(id: String) {
        jobs.remove(id)?.cancel(); audio.remove(id); lanes = lanes.filterNot { it.id == id }
        if (lanes.isEmpty()) lanes = listOf(WaveDeckLane(id = "main"))
        syncLoop()
    }
    fun mute(id: String) { lanes = lanes.map { if (it.id == id) it.copy(muted = !it.muted, solo = false) else it }; syncMix() }
    fun solo(id: String) { lanes = lanes.map { if (it.id == id) it.copy(solo = !it.solo, muted = false) else it }; syncMix() }
    private fun syncMix() { lanes.forEach { audio.mix(it.id, it.muted, it.solo, 1f, 1) } }
    fun import(id: String, uri: Uri) {
        jobs.remove(id)?.cancel(); pause(); audio.remove(id)
        lanes = lanes.map { if (it.id == id) it.copy(loading = true, pcm = null, source = uri.toString()) else it }
        jobs[id] = scope.launch {
            try {
                val title = withContext(Dispatchers.IO) { WaveWorkshopImports.name(context, uri) }
                val pcm = withContext(Dispatchers.IO) { lock.withLock { WaveCompositionDecoder.decode(context, uri.toString()) } }
                lanes = lanes.map { if (it.id == id) it.copy(name = title, pcm = pcm, loading = false) else it }
                audio.prepare(id, pcm, 1); syncMix(); syncLoop()
                withContext(Dispatchers.IO) { WaveAudioAnalysis.analyze(context, uri, onMusicalResult = { text ->
                    withContext(Dispatchers.Main) { lanes = lanes.map { if (it.id == id) it.copy(musical = text) else it } }
                }) }
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (failure: Exception) { error = failure.message ?: "Import impossible"; lanes = lanes.map { if (it.id == id) it.copy(loading = false) else it } }
        }
    }
    fun importPack(uri: Uri, folder: Boolean) {
        scope.launch {
            try {
                val files = withContext(Dispatchers.IO) { if (folder) WaveWorkshopImports.folder(context, uri) else WaveWorkshopImports.unpack(context, uri) }
                files.forEach { import(add(), it.uri) }
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (failure: Exception) { error = failure.message }
        }
    }
    override fun close() { tools.close(); scope.cancel(); audio.close() }
}
