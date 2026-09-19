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
internal enum class WaveListeningMode(val label: String) { BASE("BASE"), LOOP("BOUCLE"), MIX("MIX") }
internal enum class WaveImportDestination { PROPOSALS, BASE, VOTE }
internal data class WaveCompositionClip(
    val id: String, val title: String, val artist: String, val source: String, val category: String,
    val kind: WaveClipKind = WaveClipKind.LOOP, val status: WaveProposalStatus = WaveProposalStatus.PENDING,
    val inComposition: Boolean = false, val repeats: Int = -1, val mute: Boolean = false,
    val solo: Boolean = false, val gain: Float = .82f, val note: String = "", val musical: String = "124 BPM · A MIN",
    val packId: String? = null, val packTitle: String? = null,
    val isBase: Boolean = false,
)
internal data class WaveDemoVote(val clipId: String, val duration: Int, val endsAt: Long, val yes: Int = 0, val no: Int = 0, val replacementId: String? = null,
    val id: String = UUID.randomUUID().toString(), val version: String = clipId, val ballots: Map<String, Boolean> = emptyMap())
internal data class WaveVoteResult(val roundId: String, val clipId: String, val accepted: Boolean, val yes: Int, val no: Int)
internal data class WaveDawExport(val id: String, val uri: String, val title: String, val bpm: Double, val key: String, val sources: List<String>)
internal data class WaveDawDraft(val uri: Uri, val export: WaveDawExport)
internal data class WaveMixPin(val id: String, val clipId: String, val baseId: String, val startBar: Int, val bars: Int)

/** Local workshop mirrors iOS live-set state. Demo votes are explicitly local, never public ballots. */
internal class WaveCompositionState(private val context: Context, sessionKey: String) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val preferences = context.getSharedPreferences("wave-workshop-${sessionKey.hashCode()}", Context.MODE_PRIVATE)
    val audio = WaveCompositionAudio()
    var outputGain by mutableFloatStateOf(1f); private set
    fun outputVolume(value: Float) { outputGain = value.coerceIn(0f, 1f); audio.masterGain(outputGain) }
    var exportProgress by mutableStateOf<Float?>(null); private set
    private var exportJob: Job? = null
    var dawExports by mutableStateOf<List<WaveDawExport>>(emptyList()); private set
    var dawDraft by mutableStateOf<WaveDawDraft?>(null); private set
    var dawImporting by mutableStateOf(false); private set
    var dawError by mutableStateOf<String?>(null); private set
    private val bakedSources = mutableMapOf<String, Set<String>>()
    private val baseArrangements = mutableMapOf<String, Set<String>>()
    fun reviewDaw(uri: Uri, archive: WaveDawExport) { dawDraft = WaveDawDraft(uri, archive); dawError = null }
    fun cancelDaw() { if (!dawImporting) { dawDraft = null; dawError = null } }
    fun acceptDaw(credits: Map<String, String>, propose: Boolean) {
        val draft = dawDraft ?: return
        if (dawImporting) return
        dawImporting = true; dawError = null
        scope.launch {
            try {
                val pcm = withContext(Dispatchers.IO) { decodeLock.withLock { WaveCompositionDecoder.decode(context, draft.uri.toString()) } }
                val id = UUID.randomUUID().toString()
                val clip = WaveCompositionClip(id, "${draft.export.title} · retour DAW", "VOUS", draft.uri.toString(), "Mélodie",
                    isBase = true, status = if (propose) WaveProposalStatus.VOTE else WaveProposalStatus.ACCEPTED,
                    gain = 1f, musical = "${draft.export.bpm} BPM · ${draft.export.key}", note = credits.entries.joinToString("\n") { (source, status) -> "$source:$status" })
                bakedSources[id] = credits.filterValues { it != "Retirée" }.keys
                clips = clips + clip; prepared = prepared + (id to pcm)
                if (!propose) activateReference(id)
                dawDraft = null; save()
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (error: Exception) { dawError = error.message ?: "Retour DAW impossible." }
            finally { dawImporting = false }
        }
    }
    fun cancelExport() { exportJob?.cancel() }
    fun export(uri: Uri, archive: Boolean = false, focusedBase: String? = null) {
        if (exportJob?.isActive == true) return
        val selected = if (focusedBase != null) clips.filter { it.id == focusedBase }
            else listOfNotNull(reference) + clips.filter { it.inComposition && !it.isBase }
        if (selected.isEmpty()) return
        val placementSnapshot = selected.associate { clip -> clip.id to pinsFor(clip.id).map { (it.startBar * framesPerBar).toLong() to ((it.startBar + it.bars) * framesPerBar).toLong() } }
        val frameCount = durationFrames.toInt(); val tempo = bpm; val musicalKey = key
        exportProgress = 0f
        exportJob = scope.launch {
            try {
                withContext(Dispatchers.IO) {
                    val sources = selected.map { clip -> WaveExportStem(clip, decodeLock.withLock { WaveCompositionDecoder.decode(context, clip.source) }, placementSnapshot[clip.id].orEmpty()) }
                    context.contentResolver.openOutputStream(uri, "wt")!!.use { output ->
                        val frames = if (focusedBase != null) sources.first().pcm.frames else frameCount
                        val progress: suspend (Float) -> Unit = { value -> withContext(Dispatchers.Main) { exportProgress = value } }
                        if (archive) WaveArrangementExport.archive(output, frames, sources, tempo, musicalKey, progress)
                        else WaveArrangementExport.render(output, frames, sources, progress)
                    }
                }
                notice = if (archive) "Archive DAW et crédits enregistrés." else "Audio enregistré."
                if (archive) {
                    dawExports = dawExports + WaveDawExport(UUID.randomUUID().toString(), uri.toString(), reference?.title ?: "Arrangement", tempo, musicalKey, selected.map { it.id })
                    save()
                }
                if (focusedBase != null) {
                    val send = android.content.Intent(android.content.Intent.ACTION_SEND).setType("audio/wav")
                        .putExtra(android.content.Intent.EXTRA_STREAM, uri).addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    context.startActivity(android.content.Intent.createChooser(send, "Partager la base").addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK))
                }
            } catch (cancelled: CancellationException) {
                withContext(NonCancellable + Dispatchers.IO) { runCatching { android.provider.DocumentsContract.deleteDocument(context.contentResolver, uri) } }; throw cancelled
            } catch (e: Exception) { notice = e.message ?: "Export impossible." }
            finally { exportProgress = null }
        }
    }
    var clips by mutableStateOf<List<WaveCompositionClip>>(emptyList()); private set
    var bpm by mutableDoubleStateOf(124.0); private set
    var key by mutableStateOf("A MIN"); private set
    var open by mutableStateOf(true); private set
    var snapshot by mutableStateOf(WaveAudioSnapshot()); private set
    var preparing by mutableStateOf(setOf<String>()); private set
    var prepared by mutableStateOf<Map<String, WavePcm>>(emptyMap()); private set
    var errors by mutableStateOf<Map<String, String>>(emptyMap()); private set
    var notice by mutableStateOf<String?>(null)
    var vote by mutableStateOf<WaveDemoVote?>(null); private set
    var voteHistory by mutableStateOf<List<WaveVoteResult>>(emptyList()); private set
    var followVote by mutableStateOf(false)
    var acceptedCategories by mutableStateOf(setOf("Basse", "Drums", "Mélodie", "Accords", "Nappe", "Acapella", "FX")); private set
    var requestedBars by mutableIntStateOf(8); private set
    var editorialDirection by mutableStateOf(""); private set
    fun submissionRules(categories: Set<String>, bars: Int, direction: String) {
        acceptedCategories = categories; requestedBars = bars; editorialDirection = direction.take(50)
        preferences.edit().putStringSet("acceptedCategories", categories).putInt("requestedBars", bars).putString("direction", editorialDirection).apply()
    }
    fun proposals(status: WaveProposalStatus): List<WaveCompositionClip> {
        val groups = categories.associateWith { category -> clips.filter { !it.isBase && it.status == status && it.category == category } }
        return buildList { repeat(groups.values.maxOfOrNull { it.size } ?: 0) { index -> categories.forEach { groups[it]?.getOrNull(index)?.let(::add) } } }
    }
    var lastVerdict by mutableStateOf<String?>(null); private set
    var voteSecondsRemaining by mutableIntStateOf(0); private set
    var loopEnabled by mutableStateOf(false); private set
    var loopRange by mutableStateOf(0f..1f); private set
    var transportPending by mutableStateOf(false); private set
    private var auditionGeneration = 0
    var importing by mutableStateOf(false); private set
    var adoptingPack by mutableStateOf<String?>(null); private set
    var preparingPack by mutableStateOf<String?>(null); private set
    var listeningMode by mutableStateOf(WaveListeningMode.BASE); private set
    var compositionPage by mutableStateOf(false); private set
    var referenceId by mutableStateOf<String?>(null); private set
    var candidateId by mutableStateOf<String?>(null); private set
    var loopBars by mutableIntStateOf(0); private set
    var cueFrame by mutableLongStateOf(0); private set
    var publicRoute by mutableStateOf(false); private set
    private var pendingGrid: Pair<Double, String>? = null
    var pins by mutableStateOf<List<WaveMixPin>>(emptyList()); private set
    var selectedPinId by mutableStateOf<String?>(null); private set
    var selectedMixId by mutableStateOf<String?>(null); private set
    private val rememberedPins = mutableMapOf<String, String>()
    var auditionGains by mutableStateOf<Map<String, Float>>(emptyMap()); private set
    fun auditionGain(id: String) = auditionGains[id] ?: .75f
    fun auditionVolume(id: String, value: Float) {
        val level = kotlin.math.round(value.coerceIn(0f, 1f) * 100) / 100
        auditionGains = auditionGains + (id to level); audio.candidateGain(id, level * (clips.find { it.id == id }?.gain ?: .82f))
    }
    var privateMessages by mutableStateOf<Map<String, List<String>>>(emptyMap()); private set
    fun message(artist: String, text: String) {
        if (text.isBlank()) return
        privateMessages = privateMessages + (artist to (privateMessages[artist].orEmpty() + text.trim()))
    }
    val selectedPin get() = pins.find { it.id == selectedPinId && it.baseId == referenceId }
    val reference get() = clips.find { it.id == referenceId && it.isBase }
    val referenceReady get() = referenceId in prepared
    val playing get() = snapshot.running || (snapshot.cue != null && !snapshot.cuePaused)
    val candidate get() = clips.find { it.id == candidateId }
    val canLoop get() = referenceReady && (compositionPage || listeningMode != WaveListeningMode.LOOP)
    val durationFrames: Long get() = referenceId?.let { prepared[it]?.frames?.toLong() } ?: clips.filter { it.inComposition }.maxOfOrNull {
        (prepared[it.id]?.frames?.toLong() ?: 0L) * it.repeats.coerceAtLeast(1)
    }?.coerceAtLeast(1) ?: (48_000 * 60L * 32 / bpm).toLong()
    val masterPeaks: List<Float> get() {
        referenceId?.let { prepared[it]?.let { pcm -> return pcm.peaks } }
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
    val categories = listOf("Basse", "Drums", "Mélodie", "Accords", "Nappe", "Acapella", "FX")
    init {
        restore()
        acceptedCategories = preferences.getStringSet("acceptedCategories", categories.toSet())!!.toSet()
        requestedBars = preferences.getInt("requestedBars", 8)
        editorialDirection = preferences.getString("direction", "") ?: ""
        // Add newly ported demo sources without overwriting user imports or decisions.
        clips = clips + waveDemoProposals().filter { demo -> clips.none { it.id == demo.id } }
        save()
        audio.tempo(bpm)
        clips.filter { it.inComposition }.forEach { prepare(it.id) }
        referenceId?.let { id -> prepare(id) { activateReference(id) } }
        scope.launch {
            while (isActive) {
                snapshot = audio.snapshot
                if (!snapshot.running) pendingGrid?.let { (tempo, tonality) -> pendingGrid = null; rules(tempo, tonality) }
                vote?.let {
                    val remaining = it.endsAt - android.os.SystemClock.elapsedRealtime()
                    voteSecondsRemaining = ((remaining.coerceAtLeast(0) + 999) / 1000).toInt()
                    if (remaining <= 0) finishVote()
                }
                delay(33)
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
            val json = JSONObject(saved); bpm = json.optDouble("bpm", 124.0).coerceIn(40.0, 260.0); key = json.optString("key", "A MIN"); open = json.optBoolean("open", true)
            referenceId = json.optString("referenceId").takeIf(String::isNotBlank)
            json.optJSONObject("baked")?.let { values -> values.keys().forEach { id -> val list = values.getJSONArray(id); bakedSources[id] = (0 until list.length()).map { list.getString(it) }.toSet() } }
            json.optJSONObject("arrangements")?.let { values -> values.keys().forEach { id -> val list = values.getJSONArray(id); baseArrangements[id] = (0 until list.length()).map { list.getString(it) }.toSet() } }
            json.optJSONArray("dawExports")?.let { list -> dawExports = (0 until list.length()).map { i -> list.getJSONObject(i).let { item ->
                val sources = item.getJSONArray("sources")
                WaveDawExport(item.getString("id"), item.getString("uri"), item.getString("title"), item.getDouble("bpm"), item.getString("key"), (0 until sources.length()).map { sources.getString(it) })
            } } }
            json.optJSONArray("votes")?.let { list -> voteHistory = (0 until list.length()).map { i -> list.getJSONObject(i).let {
                WaveVoteResult(it.getString("round"), it.getString("clip"), it.getBoolean("accepted"), it.getInt("yes"), it.getInt("no"))
            } } }
            val array = json.getJSONArray("clips")
            clips = List(array.length()) { i -> array.getJSONObject(i).let {
                WaveCompositionClip(it.getString("id"), it.getString("title"), it.getString("artist"), it.getString("source"), it.getString("category"),
                    WaveClipKind.valueOf(it.getString("kind")), WaveProposalStatus.valueOf(it.getString("status")), it.getBoolean("inComposition"),
                    it.getInt("repeats"), it.getBoolean("mute"), it.getBoolean("solo"), it.getDouble("gain").toFloat().coerceIn(0f, 1f), it.optString("note"), it.optString("musical"),
                    it.optString("packId").takeIf(String::isNotBlank), it.optString("packTitle").takeIf(String::isNotBlank), it.optBoolean("isBase"))
            } }
            val savedPins = json.optJSONArray("pins") ?: JSONArray()
            pins = List(savedPins.length()) { i -> savedPins.getJSONObject(i).let {
                WaveMixPin(it.getString("id"), it.getString("clip"), it.getString("base"), it.getInt("start"), it.getInt("bars"))
            } }
        } catch (_: Exception) { clips = fixture(); notice = "L’atelier sauvegardé est illisible. Le pack de démonstration a été ouvert." }
    }
    private fun save() {
        val array = JSONArray()
        clips.forEach { c -> array.put(JSONObject().put("id", c.id).put("title", c.title).put("artist", c.artist).put("source", c.source)
            .put("category", c.category).put("kind", c.kind.name).put("status", c.status.name).put("inComposition", c.inComposition)
            .put("repeats", c.repeats).put("mute", c.mute).put("solo", c.solo).put("gain", c.gain).put("note", c.note).put("musical", c.musical)
            .put("packId", c.packId ?: "").put("packTitle", c.packTitle ?: "").put("isBase", c.isBase)) }
        val savedPins = JSONArray()
        pins.forEach { savedPins.put(JSONObject().put("id", it.id).put("clip", it.clipId).put("base", it.baseId).put("start", it.startBar).put("bars", it.bars)) }
        val baked = JSONObject(); bakedSources.forEach { (id, sources) -> baked.put(id, JSONArray(sources.toList())) }
        val arrangements = JSONObject(); baseArrangements.forEach { (id, sources) -> arrangements.put(id, JSONArray(sources.toList())) }
        val exports = JSONArray(); dawExports.forEach { exports.put(JSONObject().put("id", it.id).put("uri", it.uri).put("title", it.title).put("bpm", it.bpm).put("key", it.key).put("sources", JSONArray(it.sources))) }
        val history = JSONArray(); voteHistory.forEach { history.put(JSONObject().put("round", it.roundId).put("clip", it.clipId).put("accepted", it.accepted).put("yes", it.yes).put("no", it.no)) }
        preferences.edit().putString("state", JSONObject().put("baked", baked).put("arrangements", arrangements).put("dawExports", exports).put("votes", history)
            .put("pins", savedPins).put("referenceId", referenceId ?: "").put("bpm", bpm).put("key", key).put("open", open).put("clips", array).toString()).apply()
    }
    private fun update(id: String, change: (WaveCompositionClip) -> WaveCompositionClip) {
        clips = clips.map { if (it.id == id) change(it) else it }; save()
        clips.find { it.id == id }?.let { audio.mix(id, it.mute, it.solo, it.gain, it.repeats) }
    }
    fun selectMix(id: String) {
        selectedMixId = if (selectedMixId == id) null else id
        selectedPinId = selectedMixId?.let { rememberedPins["$referenceId:$it"] }?.takeIf { saved -> pins.any { it.id == saved } }
    }
    fun pinsFor(id: String) = pins.filter { it.clipId == id && it.baseId == referenceId }.sortedBy { it.startBar }
    fun selectPin(id: String?) {
        selectedPinId = id?.takeIf { candidate -> pins.any { it.id == candidate && it.baseId == referenceId } }
        selectedPin?.let { rememberedPins["$referenceId:${it.clipId}"] = it.id }
    }
    private fun nextPin(id: String): WaveMixPin? {
        val base = referenceId ?: return null
        if (!referenceReady) return null
        val existing = pinsFor(id)
        val total = (durationFrames / framesPerBar).toInt()
        if (total <= 0) return null
        val length = (selectedPin?.takeIf { it.clipId == id }?.bars ?: loopBars.takeIf { loopEnabled && it > 0 } ?: 4)
            .let { if (existing.isEmpty()) it.coerceAtMost(total) else it }
        if (length > total) return null
        val anchor = selectedPin?.takeIf { it.clipId == id }?.let { it.startBar + it.bars }
            ?: (if (loopEnabled) loopRange.start * durationFrames / framesPerBar else snapshot.frame / framesPerBar).toInt()
        val initial = (anchor / length * length).coerceIn(0, (total - length).coerceAtLeast(0))
        if (selectedPin == null) existing.find { it.startBar == initial && it.bars == length }?.let { return it }
        val slots = (0..(total - length) step length).toList()
        val ordered = slots.filter { it >= initial } + slots.filter { it < initial }
        val start = ordered.firstOrNull { at -> existing.none { at < it.startBar + it.bars && at + length > it.startBar } } ?: return null
        return WaveMixPin(UUID.randomUUID().toString(), id, base, start, length)
    }
    fun canAddPin(id: String) = nextPin(id) != null
    fun addPin(id: String) {
        val pin = nextPin(id) ?: return
        if (pins.none { it.id == pin.id }) pins = pins + pin
        selectedMixId = id; selectPin(pin.id); syncPins(); save()
    }    fun movePin(progress: Float) {
        val pin = selectedPin ?: return
        val step = pin.bars
        val last = ((durationFrames / framesPerBar).toInt() - step).coerceAtLeast(0) / step
        val start = kotlin.math.floor(progress * durationFrames / framesPerBar / step + .5).toInt().coerceIn(0, last) * step
        replacePin(pin.copy(startBar = start))
    }
    fun resizePin(bars: Int) {
        val pin = selectedPin ?: return
        if (bars in listOf(4, 8, 16, 32) && (pin.startBar + bars) * framesPerBar <= durationFrames + 1) replacePin(pin.copy(bars = bars))
    }
    private fun replacePin(pin: WaveMixPin) {
        pinsFor(pin.clipId).find { it.id != pin.id && pin.startBar == it.startBar && pin.bars == it.bars }?.let {
            selectPin(it.id); return
        }
        pins = pins.map { if (it.id == pin.id) pin else it }; syncPins(); save()
    }
    fun removePin() {
        val removed = selectedPin ?: return
        val siblings = pinsFor(removed.clipId); val index = siblings.indexOf(removed)
        pins = pins.filterNot { it.id == removed.id }
        selectPin(siblings.getOrNull(index + 1)?.id ?: siblings.getOrNull(index - 1)?.id)
        syncPins(); save()
    }
    private fun syncPins() {
        clips.filter { it.inComposition }.forEach { clip -> audio.placements(clip.id, pinsFor(clip.id).map {
            (it.startBar * framesPerBar).toLong() to ((it.startBar + it.bars) * framesPerBar).toLong()
        }) }
    }
    fun prepare(id: String, then: (() -> Unit)? = null) {
        if (then != null) preparedActions[id] = then
        if (id in preparing) return
        val clip = clips.find { it.id == id } ?: return
        prepared[id]?.let {
            if (clip.inComposition) {
                audio.prepare(id, it, clip.repeats)
                audio.mix(id, clip.mute, clip.solo, clip.gain, clip.repeats)
                syncPins()
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
                    syncPins()
                }
                preparedActions.remove(id)?.invoke()
            } catch (cancelled: CancellationException) { throw cancelled }
            catch (e: Exception) { preparedActions.remove(id); transportPending = false; errors = errors + (id to (e.message ?: "Audio indisponible")) }
            finally { preparing = preparing - id }
        }
    }
    fun transport() {
        if (snapshot.cue != null) { audio.pausePreview(); return }
        if (snapshot.running || snapshot.paused) { if (focus()) audio.toggleClock(); return }
        if (transportPending) { transportPending = false; return }
        val active = clips.filter { it.inComposition }
        if (!compositionPage && !referenceReady) { notice = "Importe une base ou écoute une proposition avec son bouton lecture."; return }
        if (active.isEmpty() && !referenceReady) { notice = "Prends une boucle dans Propositions pour commencer."; return }
        if (!focus()) return
        transportPending = true
        fun startIfReady() {
            if (transportPending && active.all { it.id in prepared }) {
                transportPending = false; syncLoop(); audio.toggleClock()
            }
        }
        active.forEach { prepare(it.id, ::startIfReady) }
        startIfReady()
    }
    fun stopTransport() { transportPending = false; preparedActions.clear(); auditionGeneration++; preparingPack = null; audio.stop() }
    fun toggleLoop() { loopEnabled = !loopEnabled; syncLoop() }
    fun updateLoopRange(range: ClosedFloatingPointRange<Float>) {
        val next = snapRegion(range)
        if (next != loopRange) { loopRange = next; syncLoop() }
    }
    val framesPerBar get() = 48_000 * 60.0 * 4 / bpm
    fun snapRegion(range: ClosedFloatingPointRange<Float>, bars: Int = loopBars): ClosedFloatingPointRange<Float> {
        val minimum = (4800f / durationFrames).coerceAtMost(1f)
        val length = if (bars > 0) (framesPerBar * bars / durationFrames).toFloat().coerceAtMost(1f)
            else (range.endInclusive - range.start).coerceIn(minimum, 1f)
        val start = if (bars > 0) {
            val lastBlock = kotlin.math.floor((1.0 - length + 0.000001) / length).toInt().coerceAtLeast(0)
            kotlin.math.floor(range.start / length + .5f).toInt().coerceIn(0, lastBlock) * length
        } else range.start.coerceIn(0f, 1f - length)
        return start..(start + length).coerceAtMost(1f)
    }
    fun selectLoop(bars: Int) {
        if (!canLoop) return
        val wasEnabled = loopEnabled
        val previous = loopRange
        loopEnabled = bars != -1; loopBars = bars.coerceAtLeast(0)
        if (!loopEnabled) loopRange = 0f..1f
        else if (bars == 0) loopRange = if (wasEnabled) previous else 0f..1f
        else {
            val length = (framesPerBar * bars / durationFrames).toFloat().coerceAtMost(1f)
            val start = if (wasEnabled) previous.start else snapshot.frame.toFloat() / durationFrames
            loopRange = snapRegion(start..start + length, bars)
        }
        syncLoop()
    }    private fun syncLoop() = audio.loop((durationFrames * loopRange.start).toLong(), if (loopEnabled && referenceReady) (durationFrames * loopRange.endInclusive).toLong() else 0)
    fun setPage(composition: Boolean) {
        compositionPage = composition; stopPreview(); selectedPinId = null
        if (!composition) listeningMode = WaveListeningMode.BASE
        audio.monitor(listeningMode, compositionPage); syncLoop()
    }
    fun listen(mode: WaveListeningMode) { listeningMode = mode; audio.monitor(mode, compositionPage) }
    fun setCue() { cueFrame = snapshot.frame; notice = "Point de reprise mémorisé." }
    fun returnToCue() = audio.seek(if (loopEnabled) (loopRange.start * durationFrames).toLong() else cueFrame)
    fun toggleRoute() {
        if (snapshot.cue != null && !snapshot.cuePaused) audio.pausePreview()
        if (snapshot.running) audio.toggleClock()
        publicRoute = !publicRoute
        notice = if (publicRoute) "Sortie publique sélectionnée · diffusion RTC non raccordée." else "Écoute privée sur ce téléphone."
    }
    fun activateReference(id: String) {
        if (vote != null || (id == referenceId && referenceReady)) return
        val clip = clips.find { it.id == id && it.isBase } ?: return
        referenceId?.let { baseArrangements[it] = clips.filter { clip -> clip.inComposition }.map { clip -> clip.id }.toSet() }
        val arrangement = baseArrangements[id] ?: clips.filter { it.inComposition }.map { it.id }.toSet()
        clips = clips.map { c ->
            val active = c.id in arrangement && c.id !in bakedSources[id].orEmpty() && !c.isBase
            if (!active && c.inComposition) audio.remove(c.id)
            c.copy(inComposition = active)
        }
        referenceId = id; publicRoute = false; loopEnabled = false; cueFrame = 0; selectedPinId = null; pendingGrid = null; stopTransport(); save()
        prepare(id) {
            if (referenceId == id) prepared[id]?.let { audio.reference(id, it); audio.monitor(listeningMode, compositionPage); syncPins() }
        }
        clips.filter { it.inComposition }.forEach { prepare(it.id) }
        val detectedBpm = Regex("(\\d+(?:[.,]\\d+)?) BPM").find(clip.musical)?.groupValues?.get(1)?.replace(',', '.')?.toDoubleOrNull()
        if (detectedBpm != null) pendingGrid = detectedBpm to clip.musical.substringAfter("·", key).trim()
    }
    fun seek(progress: Float) {
        snapshot.cue?.let { id -> prepared[id]?.let { audio.seekPreview((progress.coerceIn(0f, 1f) * it.frames).toLong()) }; return }
        val position = if (loopEnabled && progress !in loopRange) loopRange.start else progress.coerceIn(0f, 1f)
        audio.seek((position * durationFrames).toLong().coerceAtMost((durationFrames - 1).coerceAtLeast(0)))
    }
    private data class ScrubSession(val base: String?, val cue: String?, val frame: Long, val running: Boolean, val cueRunning: Boolean)
    private var scrubSession: ScrubSession? = null
    fun beginScrub() {
        val cueFrames = snapshot.cue?.let { prepared[it]?.frames } ?: 0
        scrubSession = ScrubSession(referenceId, snapshot.cue,
            if (snapshot.cue != null) (snapshot.cueProgress * cueFrames).toLong() else snapshot.frame,
            snapshot.running, snapshot.cue != null && !snapshot.cuePaused)
        if (snapshot.running) audio.toggleClock()
        if (snapshot.cue != null && !snapshot.cuePaused) audio.pausePreview()
    }
    fun endScrub(cancel: Boolean) {
        val session = scrubSession ?: return
        scrubSession = null
        if (session.base != referenceId || session.cue != snapshot.cue) return
        if (cancel) { if (session.cue != null) audio.seekPreview(session.frame) else audio.seek(session.frame) }
        if (session.running) audio.toggleClock()
        if (session.cueRunning) audio.pausePreview()
    }
    fun stepBar(direction: Int) {
        val bar = 48_000 * 60.0 * 4 / bpm
        audio.seek((snapshot.frame + direction * bar).toLong().coerceIn(0, durationFrames))
    }
    fun launch(id: String) { stopPreview(); if (focus()) prepare(id) { audio.launch(id) } }
    fun preview(id: String) {
        val generation = ++auditionGeneration
        if (snapshot.pendingCandidate == id) { candidateId = snapshot.candidate; audio.cancelPendingCandidate(); return }
        if (candidateId == id && (snapshot.candidate == id || snapshot.pendingCandidate == id)) { candidateId = null; audio.clearCandidate(); return }
        candidateId = id
        if (focus()) prepare(id) { if (generation == auditionGeneration) prepared[id]?.let {
            if (referenceReady && loopEnabled && loopBars > 0 && it.frames > framesPerBar * loopBars) {
                val minimum = listOf(4, 8, 16, 32).firstOrNull { bars -> bars * framesPerBar >= it.frames && bars * framesPerBar <= durationFrames + 1 }
                if (minimum != null) selectLoop(minimum) else selectLoop(-1)
            }
            if (referenceReady && clips.find { c -> c.id == id }?.isBase != true) audio.candidate(id, it, auditionGain(id) * (clips.find { clip -> clip.id == id }?.gain ?: .82f))
            else audio.preview(id, it, auditionGain(id))
        } }
    }
    fun stopPreview() { auditionGeneration++; preparingPack = null; candidateId = null; audio.stopPreview(); audio.clearCandidate() }
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
        if (id in bakedSources[referenceId].orEmpty()) { notice = "Cette contribution est déjà intégrée dans la base active."; return }
        if (adoptingPack != null) { notice = "Le pack est en cours de préparation."; return }
        if (clips.count { it.inComposition } >= 20) { notice = "La composition contient déjà 20 pistes."; return }
        val clip = clips.find { it.id == id } ?: return
        if (clip.inComposition) return
        update(id) { it.copy(status = WaveProposalStatus.ACCEPTED, inComposition = true) }; prepare(id)
    }
    fun remove(id: String) { audio.remove(id); pins = pins.filterNot { it.clipId == id }; selectedPinId = null; update(id) { it.copy(inComposition = false, mute = false, solo = false) } }
    fun archive(id: String, reason: String) { remove(id); update(id) { it.copy(status = WaveProposalStatus.ARCHIVED, note = reason) }; stopPreview() }
    fun pending(id: String) { update(id) { it.copy(status = WaveProposalStatus.PENDING, note = "") } }
    fun queueVote(id: String) { stopPreview(); update(id) { it.copy(status = WaveProposalStatus.VOTE) } }
    fun mute(id: String) = update(id) { it.copy(mute = !it.mute, solo = if (!it.mute) false else it.solo) }
    fun solo(id: String) {
        val enable = clips.find { it.id == id }?.solo != true
        clips = clips.map { if (it.id == id) it.copy(solo = enable, mute = if (enable) false else it.mute) else if (enable) it.copy(solo = false) else it }
        save(); clips.forEach { audio.mix(it.id, it.mute, it.solo, it.gain, it.repeats) }
    }
    fun gain(id: String, value: Float) { update(id) { it.copy(gain = kotlin.math.round(value.coerceIn(0f, 1f) * 100) / 100) } }
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
    fun rules(tempo: Int, musicalKey: String) = rules(tempo.toDouble(), musicalKey)
    fun rules(tempo: Double, musicalKey: String) {
        if (snapshot.running) { notice = "Arrête le séquenceur avant de modifier le tempo."; return }
        bpm = tempo.coerceIn(40.0, 260.0); key = musicalKey; audio.tempo(bpm); syncPins(); save()
    }
    fun toggleIntake() { open = !open; save() }
    val intakeOpen get() = open && acceptedCategories.isNotEmpty()
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
    fun importSelection(uris: List<Uri>, destination: WaveImportDestination = WaveImportDestination.PROPOSALS) {
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
                    } else importAudio(uri, pack, if (pack != null) "Pack importé · ${uris.size} pistes" else null, destination = destination)
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
    private suspend fun importAudio(uri: Uri, packId: String? = null, packTitle: String? = null, importedTitle: String? = null,
        destination: WaveImportDestination = WaveImportDestination.PROPOSALS) {
            val name = withContext(Dispatchers.IO) { runCatching {
                context.contentResolver.query(uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
                    if (it.moveToFirst()) it.getString(0) else null
                }
            }.getOrNull() ?: "Audio importé" }
            val clip = WaveCompositionClip(UUID.randomUUID().toString(), importedTitle ?: name, "VOUS", uri.toString(), WaveWorkshopImports.category(importedTitle ?: name),
                musical = "Analyse…", packId = packId, packTitle = packTitle, isBase = destination != WaveImportDestination.PROPOSALS,
                status = if (destination == WaveImportDestination.VOTE) WaveProposalStatus.VOTE else WaveProposalStatus.PENDING)
            clips = clips + clip; save()
            if (destination == WaveImportDestination.BASE) activateReference(clip.id) else prepare(clip.id)
            withContext(Dispatchers.IO) {
                WaveAudioAnalysis.analyze(context, uri, onMusicalResult = { value -> withContext(Dispatchers.Main) {
                    update(clip.id) { it.copy(musical = value) }
                    if (referenceId == clip.id) Regex("(\\d+(?:[.,]\\d+)?) BPM").find(value)?.groupValues?.get(1)?.replace(',', '.')?.toDoubleOrNull()?.let {
                        pendingGrid = it to value.substringAfter("·", key).trim()
                    }
                } })
            }
            if (clips.find { it.id == clip.id }?.musical == "Analyse…") update(clip.id) { it.copy(musical = "Non détecté") }
    }
    fun startVote(id: String, seconds: Int, replacementId: String?, demonstration: Boolean = true) {
        if (vote != null) return
        if (clips.find { it.id == id }?.isBase != true && replacementId == null && clips.count { it.inComposition } >= 20) {
            notice = "Choisis une piste à remplacer : la composition contient déjà 20 pistes."; return
        }
        if (id !in prepared) { prepare(id) { startVote(id, seconds, replacementId, demonstration) }; return }
        stopPreview()
        vote = WaveDemoVote(id, seconds, android.os.SystemClock.elapsedRealtime() + seconds * 1000L, replacementId = replacementId)
        lastVerdict = null
        if (demonstration) { vote = vote?.copy(yes = 1, ballots = mapOf("demo-host" to true)); finishVote() }
        else followVote = true
    }
    fun demoBallot(yes: Boolean, voterId: String = "demo-host") {
        vote = vote?.let { current ->
            val ballots = current.ballots + (voterId to yes)
            current.copy(ballots = ballots, yes = ballots.values.count { it }, no = ballots.values.count { !it })
        }
    }
    fun finishVote() {
        val current = vote ?: return
        vote = null; stopPreview()
        val name = clips.find { it.id == current.clipId }?.title ?: "Boucle"
        voteHistory = voteHistory + WaveVoteResult(current.id, current.clipId,
            current.yes + current.no > 0 && current.yes.toDouble() / (current.yes + current.no) >= .60, current.yes, current.no)
        if (current.yes + current.no > 0 && current.yes.toDouble() / (current.yes + current.no) >= .60) {
            if (current.replacementId == null && clips.count { it.inComposition } >= 20) {
                lastVerdict = "$name : vote favorable, composition pleine. Libère une piste pour l’ajouter."; return
            }
            current.replacementId?.let(::remove)
            if (clips.find { it.id == current.clipId }?.isBase == true) {
                update(current.clipId) { it.copy(status = WaveProposalStatus.ACCEPTED) }; activateReference(current.clipId)
            } else add(current.clipId)
            lastVerdict = "$name : retenue · ${current.yes} pour / ${current.no} contre"
        } else { pending(current.clipId); lastVerdict = "$name : à réécouter · ${current.yes} pour / ${current.no} contre" }
    }
    fun suspendAudio() { stopTransport(); manager.abandonAudioFocusRequest(focusRequest) }
    override fun close() { suspendAudio(); scope.cancel(); audio.close() }
}
