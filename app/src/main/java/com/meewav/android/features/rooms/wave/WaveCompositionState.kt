package com.meewav.android.features.rooms.wave

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.net.Uri
import androidx.compose.runtime.*
import kotlinx.coroutines.*
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

internal enum class WaveClipKind(val label: String) { LOOP("Loop"), LONG("Prise longue"), HIT("One-shot") }
internal enum class WaveProposalStatus(val label: String) { PENDING("À écouter"), ACCEPTED("Prises"), ARCHIVED("Archives"), VOTE("Au vote") }
internal data class WaveCompositionClip(
    val id: String, val title: String, val artist: String, val source: String, val category: String,
    val kind: WaveClipKind = WaveClipKind.LOOP, val status: WaveProposalStatus = WaveProposalStatus.PENDING,
    val inComposition: Boolean = false, val repeats: Int = -1, val mute: Boolean = false,
    val solo: Boolean = false, val gain: Float = .65f, val note: String = "", val musical: String = "124 BPM · A MIN",
    val packId: String? = null, val packTitle: String? = null,
)
internal data class WaveDemoVote(val clipId: String, val duration: Int, val endsAt: Long, val yes: Int = 0, val no: Int = 0, val replacementId: String? = null)

/** Local workshop mirrors iOS live-set state. Demo votes are explicitly local, never public ballots. */
internal class WaveCompositionState(private val context: Context, sessionKey: String) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val preferences = context.getSharedPreferences("wave-workshop-${sessionKey.hashCode()}", Context.MODE_PRIVATE)
    val audio = WaveCompositionAudio()
    var clips by mutableStateOf<List<WaveCompositionClip>>(emptyList()); private set
    var bpm by mutableIntStateOf(124); private set
    var key by mutableStateOf("A MIN"); private set
    var open by mutableStateOf(true); private set
    var snapshot by mutableStateOf(WaveAudioSnapshot()); private set
    var preparing by mutableStateOf(setOf<String>()); private set
    var prepared by mutableStateOf<Map<String, WavePcm>>(emptyMap()); private set
    var errors by mutableStateOf<Map<String, String>>(emptyMap()); private set
    var notice by mutableStateOf<String?>(null)
    var vote by mutableStateOf<WaveDemoVote?>(null); private set
    var lastVerdict by mutableStateOf<String?>(null); private set
    var voteSecondsRemaining by mutableIntStateOf(0); private set
    var loopEnabled by mutableStateOf(false); private set
    var loopRange by mutableStateOf(0f..1f); private set
    var transportPending by mutableStateOf(false); private set
    private var auditionGeneration = 0
    var importing by mutableStateOf(false); private set
    var adoptingPack by mutableStateOf<String?>(null); private set
    var preparingPack by mutableStateOf<String?>(null); private set
    val durationFrames: Long get() = clips.filter { it.inComposition }.maxOfOrNull {
        (prepared[it.id]?.frames?.toLong() ?: 0L) * it.repeats.coerceAtLeast(1)
    }?.coerceAtLeast(1) ?: (48_000 * 60L * 32 / bpm)
    val masterPeaks: List<Float> get() {
        val available = clips.filter { it.inComposition && !it.mute && (!clips.any { c -> c.inComposition && c.solo } || it.solo) }
        val span = durationFrames
        return if (available.isEmpty()) emptyList() else List(96) { index ->
            val frame = span * index / 96
            available.sumOf {
                val pcm = prepared[it.id]
                if (pcm == null || (it.repeats > 0 && frame >= pcm.frames.toLong() * it.repeats)) 0.0 else
                    pcm.peaks[((frame % pcm.frames) * 96 / pcm.frames).toInt()].toDouble() * it.gain
            }.toFloat().coerceAtMost(1f)
        }
    }
    private val decodeLock = Mutex()
    private val preparedActions = mutableMapOf<String, () -> Unit>()
    private val manager = context.getSystemService(AudioManager::class.java)
    private val focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build())
        .setOnAudioFocusChangeListener { change -> if (change != AudioManager.AUDIOFOCUS_GAIN) scope.launch { stopTransport() } }.build()
    val categories = listOf("Drums", "Basse", "Mélodie", "Accords", "Nappe", "Acapella", "FX")
    init {
        restore()
        audio.tempo(bpm)
        clips.filter { it.inComposition }.forEach { prepare(it.id) }
        scope.launch {
            while (isActive) {
                snapshot = audio.snapshot
                vote?.let {
                    val remaining = it.endsAt - android.os.SystemClock.elapsedRealtime()
                    voteSecondsRemaining = ((remaining.coerceAtLeast(0) + 999) / 1000).toInt()
                    if (remaining <= 0) finishVote()
                }
                delay(50)
            }
        }
    }
    private fun focus(): Boolean {
        if (manager.requestAudioFocus(focusRequest) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED) return true
        notice = "Une autre application utilise la sortie audio."; return false
    }
    private fun fixture(): List<WaveCompositionClip> {
        val root = "asset:messaging/audio/rooms/wave-test-pack/House_124BPM_A_minor/Loops_8bars/House_"
        return listOf(
            WaveCompositionClip("house-drums-a", "Pulse · drums", "LUMA", "${root}Drums_A_124BPM_8bars.wav", "Drums", status = WaveProposalStatus.ACCEPTED, inComposition = true),
            WaveCompositionClip("house-bass-a", "Deep · bass", "KÉO", "${root}Bass_A_124BPM_8bars.wav", "Basse", status = WaveProposalStatus.ACCEPTED, inComposition = true),
            WaveCompositionClip("house-melody-a", "Neon · mélodie", "AZUR", "${root}Melody_A_124BPM_8bars.wav", "Mélodie", status = WaveProposalStatus.ACCEPTED, inComposition = true),
            WaveCompositionClip("house-drums-b", "Groove alternatif", "SOLEN", "${root}Drums_B_124BPM_8bars.wav", "Drums"),
            WaveCompositionClip("house-bass-b", "Basse ronde", "NOAM A.", "${root}Bass_B_124BPM_8bars.wav", "Basse"),
            WaveCompositionClip("house-melody-b", "Lueur de nuit", "NAYA K.", "${root}Melody_B_124BPM_8bars.wav", "Mélodie"),
            WaveCompositionClip("house-voice", "Voix aérienne", "LINA V.", "${root}Acapella_Test_A_124BPM_8bars.wav", "Acapella"),
        )
    }
    private fun restore() {
        val saved = preferences.getString("state", null)
        if (saved == null) { clips = fixture(); return }
        try {
            val json = JSONObject(saved); bpm = json.optInt("bpm", 124).coerceIn(40, 240); key = json.optString("key", "A MIN"); open = json.optBoolean("open", true)
            val array = json.getJSONArray("clips")
            clips = List(array.length()) { i -> array.getJSONObject(i).let {
                WaveCompositionClip(it.getString("id"), it.getString("title"), it.getString("artist"), it.getString("source"), it.getString("category"),
                    WaveClipKind.valueOf(it.getString("kind")), WaveProposalStatus.valueOf(it.getString("status")), it.getBoolean("inComposition"),
                    it.getInt("repeats"), it.getBoolean("mute"), it.getBoolean("solo"), it.getDouble("gain").toFloat().coerceIn(0f, 1f), it.optString("note"), it.optString("musical"),
                    it.optString("packId").takeIf(String::isNotBlank), it.optString("packTitle").takeIf(String::isNotBlank))
            } }
        } catch (_: Exception) { clips = fixture(); notice = "L’atelier sauvegardé est illisible. Le pack de démonstration a été ouvert." }
    }
    private fun save() {
        val array = JSONArray()
        clips.forEach { c -> array.put(JSONObject().put("id", c.id).put("title", c.title).put("artist", c.artist).put("source", c.source)
            .put("category", c.category).put("kind", c.kind.name).put("status", c.status.name).put("inComposition", c.inComposition)
            .put("repeats", c.repeats).put("mute", c.mute).put("solo", c.solo).put("gain", c.gain).put("note", c.note).put("musical", c.musical)
            .put("packId", c.packId ?: "").put("packTitle", c.packTitle ?: "")) }
        preferences.edit().putString("state", JSONObject().put("bpm", bpm).put("key", key).put("open", open).put("clips", array).toString()).apply()
    }
    private fun update(id: String, change: (WaveCompositionClip) -> WaveCompositionClip) {
        clips = clips.map { if (it.id == id) change(it) else it }; save()
        clips.find { it.id == id }?.let { audio.mix(id, it.mute, it.solo, it.gain, it.repeats) }
    }
    fun prepare(id: String, then: (() -> Unit)? = null) {
        if (then != null) preparedActions[id] = then
        if (id in preparing) return
        val clip = clips.find { it.id == id } ?: return
        prepared[id]?.let {
            if (clip.inComposition) {
                audio.prepare(id, it, clip.repeats)
                audio.mix(id, clip.mute, clip.solo, clip.gain, clip.repeats)
            }
            preparedActions.remove(id)?.invoke(); return
        }
        preparing = preparing + id; errors = errors - id
        scope.launch {
            try {
                val pcm = withContext(Dispatchers.IO) { decodeLock.withLock { WaveCompositionDecoder.decode(context, clip.source) } }
                if (clips.none { it.id == id }) return@launch
                prepared = prepared + (id to pcm)
                clips.find { it.id == id }?.takeIf { it.inComposition }?.let {
                    audio.prepare(id, pcm, it.repeats); audio.mix(id, it.mute, it.solo, it.gain, it.repeats)
                }
                preparedActions.remove(id)?.invoke()
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (e: Exception) { preparedActions.remove(id); transportPending = false; errors = errors + (id to (e.message ?: "Audio indisponible")) }
            finally { preparing = preparing - id }
        }
    }
    fun transport() {
        if (snapshot.running || snapshot.paused) { if (focus()) audio.toggleClock(); return }
        if (transportPending) { transportPending = false; return }
        val active = clips.filter { it.inComposition }
        if (active.isEmpty()) { notice = "Prends une boucle dans Propositions pour commencer."; return }
        if (!focus()) return
        transportPending = true
        fun startIfReady() {
            if (transportPending && active.all { it.id in prepared }) {
                transportPending = false; syncLoop(); audio.toggleClock()
            }
        }
        active.forEach { prepare(it.id, ::startIfReady) }
    }
    fun stopTransport() { transportPending = false; preparedActions.clear(); auditionGeneration++; preparingPack = null; audio.stop() }
    fun toggleLoop() { loopEnabled = !loopEnabled; syncLoop() }
    fun updateLoopRange(range: ClosedFloatingPointRange<Float>) {
        val start = range.start.coerceIn(0f, .98f)
        loopRange = start..range.endInclusive.coerceIn(start + .02f, 1f); syncLoop()
    }
    private fun syncLoop() = audio.loop((durationFrames * loopRange.start).toLong(), if (loopEnabled) (durationFrames * loopRange.endInclusive).toLong() else 0)
    fun seek(progress: Float) = audio.seek((progress.coerceIn(0f, 1f) * durationFrames).toLong())
    fun stepBar(direction: Int) {
        val bar = 48_000 * 60.0 * 4 / bpm
        audio.seek((snapshot.frame + direction * bar).toLong().coerceIn(0, durationFrames))
    }
    fun launch(id: String) { stopPreview(); if (focus()) prepare(id) { audio.launch(id) } }
    fun preview(id: String) {
        val generation = ++auditionGeneration
        if (focus()) prepare(id) { if (generation == auditionGeneration) prepared[id]?.let { audio.preview(id, it) } }
    }
    fun stopPreview() { auditionGeneration++; preparingPack = null; audio.stopPreview() }
    fun previewPack(id: String) {
        if (snapshot.cue == "pack:$id" || preparingPack == id) { stopPreview(); return }
        if (!focus()) return
        val members = clips.filter { it.packId == id }
        if (members.isEmpty()) return
        val generation = ++auditionGeneration
        preparingPack = id
        scope.launch {
            try {
                val pcm = withContext(Dispatchers.IO) {
                    decodeLock.withLock {
                        val inputs = members.map { WaveCompositionDecoder.decode(context, it.source) to it.gain }
                        WaveCompositionDecoder.mix(context, members.joinToString { "${it.source}:${it.gain}" }, inputs)
                    }
                }
                if (generation == auditionGeneration) audio.preview("pack:$id", pcm)
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (e: Exception) { if (generation == auditionGeneration) notice = e.message ?: "Préécoute du pack impossible." }
            finally { if (generation == auditionGeneration) preparingPack = null }
        }
    }
    fun add(id: String) {
        if (adoptingPack != null) { notice = "Le pack est en cours de préparation."; return }
        if (clips.count { it.inComposition } >= 20) { notice = "La composition contient déjà 20 pistes."; return }
        val clip = clips.find { it.id == id } ?: return
        if (clip.inComposition) return
        update(id) { it.copy(status = WaveProposalStatus.ACCEPTED, inComposition = true) }; prepare(id)
    }
    fun remove(id: String) { audio.remove(id); update(id) { it.copy(inComposition = false, mute = false, solo = false) } }
    fun archive(id: String, reason: String) { remove(id); update(id) { it.copy(status = WaveProposalStatus.ARCHIVED, note = reason) }; stopPreview() }
    fun pending(id: String) { update(id) { it.copy(status = WaveProposalStatus.PENDING, note = "") } }
    fun queueVote(id: String) { stopPreview(); update(id) { it.copy(status = WaveProposalStatus.VOTE) } }
    fun mute(id: String) = update(id) { it.copy(mute = !it.mute, solo = if (!it.mute) false else it.solo) }
    fun solo(id: String) {
        val enable = clips.find { it.id == id }?.solo != true
        clips = clips.map { if (it.id == id) it.copy(solo = enable, mute = if (enable) false else it.mute) else if (enable) it.copy(solo = false) else it }
        save(); clips.forEach { audio.mix(it.id, it.mute, it.solo, it.gain, it.repeats) }
    }
    fun gain(id: String, value: Float) = update(id) { it.copy(gain = value.coerceIn(0f, 1f)) }
    fun repeat(id: String) {
        val clip = clips.find { it.id == id } ?: return
        if (clip.kind == WaveClipKind.HIT) return
        val next = when (clip.repeats) { 1 -> 2; 2 -> 4; 4 -> if (clip.kind == WaveClipKind.LOOP) -1 else 1; else -> 1 }
        val active = snapshot.voices.any { it.id == id && it.phase != "Prêt" }
        if (active && (clip.repeats == -1 || (next > 0 && next < clip.repeats))) { notice = "Arrête cette piste avant de réduire ses répétitions."; return }
        update(id) { it.copy(repeats = next) }
    }
    fun kind(id: String, kind: WaveClipKind) { audio.remove(id); update(id) { it.copy(kind = kind, repeats = if (kind == WaveClipKind.LOOP) -1 else 1) }; prepare(id) }
    fun category(id: String, category: String) = update(id) { it.copy(category = category) }
    fun move(id: String, delta: Int) {
        val active = clips.filter { it.inComposition }.toMutableList(); val index = active.indexOfFirst { it.id == id }
        val target = index + delta
        if (index < 0 || target !in active.indices) return
        val element = active.removeAt(index); active.add(target, element)
        clips = active + clips.filterNot { it.inComposition }; save()
    }
    fun rules(tempo: Int, musicalKey: String) {
        if (snapshot.running) { notice = "Arrête le séquenceur avant de modifier le tempo."; return }
        bpm = tempo.coerceIn(40, 240); key = musicalKey; audio.tempo(bpm); save()
    }
    fun toggleIntake() { open = !open; save() }
    fun importFolder(uri: Uri) {
        if (importing) return
        importing = true
        scope.launch {
            try {
                val sources = withContext(Dispatchers.IO) { WaveWorkshopImports.folder(context, uri) }
                val id = UUID.randomUUID().toString()
                sources.forEach { importAudio(it.uri, id, "Composition importée · ${sources.size} pistes", it.title) }
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (e: Exception) { notice = e.message ?: "Import du dossier impossible." }
            finally { importing = false }
        }
    }
    fun importSelection(uris: List<Uri>) {
        if (importing || uris.isEmpty()) return
        importing = true
        scope.launch {
            try {
                val pack = if (uris.size > 1) UUID.randomUUID().toString() else null
                for (uri in uris) {
                    val name = withContext(Dispatchers.IO) { WaveWorkshopImports.name(context, uri) }
                    if (name.endsWith(".zip", true)) {
                        val id = UUID.randomUUID().toString()
                        val files = withContext(Dispatchers.IO) { WaveWorkshopImports.unpack(context, uri) }
                        files.forEach { importAudio(it.uri, id, name.substringBeforeLast('.'), it.title) }
                    } else importAudio(uri, pack, if (pack != null) "Pack importé · ${uris.size} pistes" else null)
                }
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (e: Exception) { notice = e.message ?: "Import impossible." }
            finally { importing = false }
        }
    }
    fun takePack(id: String) {
        if (adoptingPack != null) return
        val members = clips.filter { it.packId == id }
        if (members.isEmpty()) return
        if (clips.count { it.inComposition } + members.count { !it.inComposition } > 20) {
            notice = "Ce pack dépasserait les 20 pistes. Prends ses éléments séparément."; return
        }
        adoptingPack = id
        scope.launch {
            try {
                // Resolve every component before committing any adoption, as in the iOS controller.
                val decoded = withContext(Dispatchers.IO) {
                    decodeLock.withLock { members.associate { it.id to WaveCompositionDecoder.decode(context, it.source) } }
                }
                prepared = prepared + decoded
                if (clips.count { it.inComposition && it.packId != id } + members.size > 20) {
                    notice = "La composition est pleine. Aucun élément du pack n’a été ajouté."; return@launch
                }
                clips = clips.map { if (it.packId == id) it.copy(inComposition = true, status = WaveProposalStatus.ACCEPTED) else it }
                save()
                members.forEach { member ->
                    audio.prepare(member.id, decoded.getValue(member.id), member.repeats)
                    audio.mix(member.id, member.mute, member.solo, member.gain, member.repeats)
                }
                notice = "Composition chargée · aucune piste lancée."
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (e: Exception) { notice = e.message ?: "Le pack n’a pas pu être chargé." }
            finally { adoptingPack = null }
        }
    }
    fun importAudio(uri: Uri, packId: String? = null, packTitle: String? = null, importedTitle: String? = null) {
        scope.launch {
            val name = withContext(Dispatchers.IO) { runCatching {
                context.contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
                    if (it.moveToFirst()) it.getString(0) else null
                }
            }.getOrNull() ?: "Audio importé" }
            val clip = WaveCompositionClip(UUID.randomUUID().toString(), importedTitle ?: name, "VOUS", uri.toString(), WaveWorkshopImports.category(importedTitle ?: name),
                musical = "Analyse…", packId = packId, packTitle = packTitle)
            clips = clips + clip; save(); prepare(clip.id)
            withContext(Dispatchers.IO) {
                WaveAudioAnalysis.analyze(context, uri, onMusicalResult = { value -> withContext(Dispatchers.Main) { update(clip.id) { it.copy(musical = value) } } })
            }
            if (clips.find { it.id == clip.id }?.musical == "Analyse…") update(clip.id) { it.copy(musical = "Non détecté") }
        }
    }
    fun startVote(id: String, seconds: Int, replacementId: String?) {
        if (vote != null) return
        if (replacementId == null && clips.count { it.inComposition } >= 20) {
            notice = "Choisis une piste à remplacer : la composition contient déjà 20 pistes."; return
        }
        if (id !in prepared) { prepare(id) { startVote(id, seconds, replacementId) }; return }
        vote = WaveDemoVote(id, seconds, android.os.SystemClock.elapsedRealtime() + seconds * 1000L, replacementId = replacementId)
        lastVerdict = null; preview(id)
    }
    fun demoBallot(yes: Boolean) { vote = vote?.let { if (yes) it.copy(yes = it.yes + 1) else it.copy(no = it.no + 1) } }
    fun finishVote() {
        val current = vote ?: return
        vote = null; stopPreview()
        val name = clips.find { it.id == current.clipId }?.title ?: "Boucle"
        if (current.yes > current.no) {
            if (current.replacementId == null && clips.count { it.inComposition } >= 20) {
                lastVerdict = "$name : vote favorable, composition pleine. Libère une piste pour l’ajouter."; return
            }
            current.replacementId?.let(::remove); add(current.clipId)
            lastVerdict = "$name : retenue · ${current.yes} pour / ${current.no} contre"
        } else { pending(current.clipId); lastVerdict = "$name : à réécouter · ${current.yes} pour / ${current.no} contre" }
    }
    fun suspendAudio() { stopTransport(); manager.abandonAudioFocusRequest(focusRequest) }
    override fun close() { suspendAudio(); scope.cancel(); audio.close() }
}
