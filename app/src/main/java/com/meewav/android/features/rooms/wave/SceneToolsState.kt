package com.meewav.android.features.rooms.wave

import android.content.Context
import androidx.compose.runtime.*
import com.meewav.android.R
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

internal val sceneKinds = listOf("Morceau", "Freestyle", "Danse", "DJ set", "Beatbox", "Instrumental", "Présentation", "Collaboration", "Autre")
internal val sceneReactions = listOf("Énergie", "Présence", "Originalité", "Maîtrise")
@Serializable internal data class SceneEntry(val id: String = UUID.randomUUID().toString(), val artistId: String = "", val artistName: String = "",
    val title: String = "", val description: String = "", val kind: String = "Morceau", val minutes: Int = 5,
    val scheduledAt: Long? = null, val delayMinutes: Int = 0, val textId: String = "", val evaluation: Boolean = false,
    val status: String = "upcoming", val startedAt: Long? = null, val endedAt: Long? = null, val memberIds: List<String> = emptyList()) {
    val upcoming get() = status == "upcoming" || status == "ready"
    val statusLabel get() = when(status) { "live" -> "En cours"; "done" -> "Terminé"; "skipped" -> "Passé"; "cancelled" -> "Annulé"; "ready" -> "Prêt"; else -> "Prévu" }
}
@Serializable internal data class SceneMarker(val id: String = UUID.randomUUID().toString(), val label: String, val line: Int)
@Serializable internal data class SceneText(val id: String = UUID.randomUUID().toString(), val title: String = "Nouveau texte", val artistId: String = "", val body: String = "", val markers: List<SceneMarker> = emptyList())
@Serializable internal data class ScenePrompt(val activeId: String = "text-1", val speed: Int = 42, val fontSize: Int = 30,
    val lineHeight: Float = 1.55f, val alignment: String = "center", val countdown: Int = 3, val controller: String = "regie", val mirrored: Boolean = false)
@Serializable internal data class SceneResponse(val rating: Int, val reactions: Set<String>)
@Serializable internal data class SceneEvaluation(val minimum: Int = 5, val public: Boolean = false, val responses: Map<String, SceneResponse> = emptyMap()) {
    val average get() = if (responses.isEmpty()) null else responses.values.map { it.rating }.average()
}
@Serializable internal data class SceneFundraiser(val title: String = "Financer la captation du live", val beneficiary: String = "Collectif Neon",
    val target: Int = 2500, val description: String = "Une captation multicaméra et un mix professionnel pour publier le concert dans les meilleures conditions.",
    val imageUrl: String = "", val endAt: Long? = null, val status: String = "draft", val visible: Boolean = false,
    val highlighted: Boolean = false, val collectedCents: Long = 86000, val count: Int = 27, val contributionIds: Set<String> = emptySet())
@Serializable internal data class SceneArchive(val program: List<SceneEntry>, val texts: List<SceneText>, val prompt: ScenePrompt = ScenePrompt(),
    val evaluations: Map<String, SceneEvaluation> = emptyMap(), val fundraiser: SceneFundraiser = SceneFundraiser())

/** Host tools ported exclusively from web roomTools.service.ts. This entry is a local demo session. */
internal class SceneToolsState(context: Context, val guests: WaveGuestState, scope: String, seedDemoPeople:Boolean=true) {
    private val prefs = context.getSharedPreferences("scene-tools-" + scope.hashCode(), Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }
    var data by mutableStateOf(sceneInitialState()); private set
    var tab by mutableIntStateOf(0)
    var notice by mutableStateOf<String?>(null)
    var line by mutableIntStateOf(0); private set
    var playing by mutableStateOf(false)
    val people get() = guests.guests.filter { it.canParticipate && it.location in setOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) }
    val live get() = data.program.firstOrNull { it.status == "live" }
    val upcoming get() = data.program.filter { it.upcoming }
    val next get() = upcoming.firstOrNull()
    val activeText get() = data.texts.find { it.id == data.prompt.activeId } ?: data.texts.firstOrNull()
    init {
        val names = listOf("Naya Oris", "Lior Benali", "Malik Soren", "Collectif Neon", "June Kairo")
        val portraits = listOf(R.drawable.scene_artist_0,R.drawable.scene_artist_1,R.drawable.scene_artist_2,R.drawable.scene_artist_3,R.drawable.scene_artist_4)
        val roles = listOf("Chanteuse", "Guitariste", "Chanteur Soul", "Collectif de danse", "DJ Drum & Bass")
        val ids = listOf("scene-a", "scene-b", "scene-c", "scene-d", "scene-e")
        if(seedDemoPeople) guests.addSceneDemoPeople(ids.mapIndexed { i, id -> WaveGuest(id, names[i], roles[i], portraits[i], WaveGuestLocation.BACKSTAGE, gradeLevel = listOf(4,2,3,3,2,4)[i]) })
        prefs.getString("state", null)?.let { saved -> runCatching { data = json.decodeFromString<SceneArchive>(saved) }
            .onFailure { notice = "Le programme enregistré n’a pas pu être chargé." } }
        // Older demo archives represented the duo as one fictitious guest. Use the two real feeds.
        data = data.copy(program = data.program.map { if (it.artistId == "scene-duo") it.copy(artistId = "scene-a", memberIds = listOf("scene-a", "scene-c")) else it })
        if(seedDemoPeople) live?.let { saved ->
            if (!guests.transitionScenePassage(performerIds(saved), emptySet())) {
                commit(data.copy(program = data.program.map { if (it.id == saved.id) it.copy(status = "ready", startedAt = null) else it }))
                notice = "Le passage attend ses artistes en coulisses avant de reprendre."
            }
        }
    }
    private fun commit(next: SceneArchive) {
        data = next
        prefs.edit().putString("state", json.encodeToString(next)).apply()
    }
    fun prepareSwitch(config:RoomSwitchConfig) {
        val text=SceneText(title=config.title,artistId="host",body=config.prompter)
        commit(SceneArchive(program=config.program.lines().filter{it.isNotBlank()}.map{SceneEntry(artistId="host",artistName="Luma",title=it.trim(),minutes=config.minutes,evaluation=config.evaluation,textId=text.id)},texts=listOf(text),prompt=ScenePrompt(activeId=text.id)))
    }
    fun performerIds(entry: SceneEntry): Set<String> = (entry.memberIds.ifEmpty { listOf(entry.artistId) }).filter { it.isNotBlank() && it != "host" }.toSet()
    fun prepared(entry: SceneEntry): Boolean = performerIds(entry).all { id -> people.any { it.id == id } }
    fun available(entry: SceneEntry): Boolean = prepared(entry) && performerIds(entry).all { id -> people.any { it.id == id && it.connected } }
    fun onStage(entry: SceneEntry): Boolean = performerIds(entry).all { id -> guests.onStage.any { it.id == id } }
    fun readiness(entry: SceneEntry): String = when {
        performerIds(entry).isEmpty() -> "Mon show"
        !prepared(entry) -> "En attente des coulisses"
        !available(entry) -> "Connexion à rétablir"
        onStage(entry) -> "Sur scène"
        else -> "Prêt en coulisses"
    }
    fun message(entry: SceneEntry) { guests.messageRecipientIds = performerIds(entry).filter { id -> guests.guests.any { it.id == id } }.toSet() }
    fun locateArtists(entry: SceneEntry) {
        val ids = performerIds(entry)
        guests.guestPage = if (people.any { it.id in ids }) 0 else 1
        guests.selected = emptySet()
    }
    fun mount(entry: SceneEntry, outgoing: Set<String>): Boolean {
        if (!available(entry)) { notice = readiness(entry) + " · retrouve les artistes dans Invités."; return false }
        if (!guests.transitionScenePassage(performerIds(entry), outgoing)) {
            notice = "Il reste des invités sur scène. Libère une place dans Invités avant de lancer ce passage."
            return false
        }
        notice = null
        return true
    }
    fun remountLive() { live?.let { mount(it, emptySet()) } }
    fun saveEntry(entry: SceneEntry): Boolean {
        if (entry.title.isBlank() || entry.artistName.isBlank() || entry.minutes !in 1..180 || entry.delayMinutes !in 0..180 || entry.kind !in sceneKinds) return false
        if (!prepared(entry) || performerIds(entry).size > 3) { notice = "Choisis jusqu’à trois artistes préparés dans les coulisses, ou Mon show."; return false }
        val sanitized = entry.copy(title = entry.title.trim().take(100), artistName = entry.artistName.trim().take(80), description = entry.description.trim().take(1200))
        commit(data.copy(program = if (data.program.any { it.id == entry.id }) data.program.map { if (it.id == entry.id) sanitized else it } else data.program + sanitized))
        return true
    }
    fun status(id: String, status: String) {
        val entry = data.program.find { it.id == id } ?: return
        if (status !in setOf("live", "done", "upcoming", "skipped", "cancelled", "ready")) return
        if (status == "live") {
            if (entry.status == "live") { remountLive(); return }
            if (!mount(entry, live?.let(::performerIds).orEmpty())) return
        } else if (entry.status == "live") {
            guests.transitionScenePassage(emptySet(), performerIds(entry))
        }
        val now = System.currentTimeMillis()
        val finished = if (status == "live") data.program.filter { it.status == "live" } else if (status == "done") listOf(entry) else emptyList()
        val evaluations = data.evaluations.toMutableMap()
        finished.filter { it.evaluation }.forEach { evaluations.putIfAbsent(it.id, SceneEvaluation()) }
        val program = data.program.map { item -> when {
            item.id == id -> item.copy(status = status, startedAt = if (status == "live") now else if (status == "upcoming") null else item.startedAt,
                endedAt = if (status == "done") now else if (status in setOf("upcoming", "live")) null else item.endedAt)
            status == "live" && item.status == "live" -> item.copy(status = "done", endedAt = now)
            else -> item
        } }
        commit(data.copy(program = program, evaluations = evaluations))
        if (status == "live" && entry.textId.isNotBlank()) selectText(entry.textId)
    }
    fun move(id: String, direction: Int) {
        val visible = upcoming; val from = visible.indexOfFirst { it.id == id }; val other = visible.getOrNull(from + direction) ?: return
        val list = data.program.toMutableList(); val a = list.indexOfFirst { it.id == id }; val b = list.indexOf(other)
        if (a < 0 || b < 0) return
        java.util.Collections.swap(list, a, b); commit(data.copy(program = list))
    }
    fun removeEntry(id: String) {
        if (live?.id == id) { notice = "Termine le passage avant de le supprimer."; return }
        commit(data.copy(program = data.program.filterNot { it.id == id }, evaluations = data.evaluations - id))
    }
    fun selectText(id: String) {
        if (data.texts.none { it.id == id }) return
        line = 0; playing = false; commit(data.copy(prompt = data.prompt.copy(activeId = id)))
    }
    fun openPrompter(id: String) { selectText(id); tab = 1 }
    fun saveText(text: SceneText) {
        val safe = text.copy(title = text.title.trim().ifBlank { "Nouveau texte" }.take(100), body = text.body.take(100000),
            markers = text.markers.map { it.copy(line = it.line.coerceIn(0, text.body.lines().lastIndex.coerceAtLeast(0)), label = it.label.take(60)) })
        val exists = data.texts.any { it.id == text.id }
        commit(data.copy(texts = if (exists) data.texts.map { if (it.id == text.id) safe else it } else data.texts + safe,
            prompt = data.prompt.copy(activeId = text.id)))
        seek(line); playing = false
    }
    fun seek(value: Int) { line = value.coerceIn(0, activeText?.body?.lines()?.lastIndex?.coerceAtLeast(0) ?: 0) }
    fun prompt(value: ScenePrompt) { commit(data.copy(prompt = value.copy(speed = value.speed.coerceIn(10,100), fontSize = value.fontSize.coerceIn(20,54)))) }
    fun configureEvaluation(id: String, enabled: Boolean, minimum: Int, public: Boolean) {
        val entry = data.program.find { it.id == id } ?: return
        val evaluation = (data.evaluations[id] ?: SceneEvaluation()).copy(minimum = minimum.coerceIn(1,100), public = public)
        commit(data.copy(program = data.program.map { if (it.id == id) entry.copy(evaluation = enabled) else it }, evaluations = data.evaluations + (id to evaluation)))
    }
    fun demoResponses(id: String) {
        val entry = data.program.find { it.id == id } ?: return
        if (!entry.evaluation || entry.status != "done") return
        val evaluation = data.evaluations[id] ?: SceneEvaluation()
        val responses = evaluation.responses.toMutableMap()
        repeat(8) { index -> responses.putIfAbsent("demo-fan-" + index, SceneResponse(if (index == 0) 3 else if (index < 3) 4 else 5,
            sceneReactions.filterIndexed { r, _ -> (index + r) % 3 != 0 }.toSet())) }
        commit(data.copy(evaluations = data.evaluations + (id to evaluation.copy(responses = responses))))
    }
    fun fundraiser(value: SceneFundraiser): Boolean {
        val safe = value.copy(title = value.title.trim().take(100), beneficiary = value.beneficiary.trim().take(100), description = value.description.trim().take(500),
            highlighted = value.highlighted && value.visible && value.status == "live")
        if (safe.title.isBlank() || safe.beneficiary.isBlank() || safe.target !in 1..1000000) { notice = "Renseigne le titre, le bénéficiaire et un objectif valide."; return false }
        if (safe.status == "live" && safe.endAt != null && safe.endAt <= System.currentTimeMillis() && (data.fundraiser.status != "live" || safe.endAt != data.fundraiser.endAt)) { notice = "La date de fin doit être à venir."; return false }
        commit(data.copy(fundraiser = safe)); return true
    }
    fun demoContribution(cents: Int, id: String = UUID.randomUUID().toString()) {
        val f = data.fundraiser
        if (f.status != "live" || !f.visible || (f.endAt != null && f.endAt <= System.currentTimeMillis()) || cents !in 100..100000 || id in f.contributionIds) return
        commit(data.copy(fundraiser = f.copy(collectedCents = f.collectedCents + cents, count = f.count + 1, contributionIds = f.contributionIds + id)))
    }
}

private fun sceneInitialState(): SceneArchive {
    val text1 = SceneText("text-1", "Lumière noire", "scene-a", "La ville s’endort sous les néons\nJe garde le tempo, je garde le nom\n\nOn lève les yeux, la nuit nous ressemble\nLa lumière noire nous rassemble\n\nReviens au signal, retrouve ma voix\nLe public respire au même pas", listOf(SceneMarker(label="Intro",line=0),SceneMarker(label="Couplet 1",line=2),SceneMarker(label="Refrain",line=4),SceneMarker(label="Outro",line=6)))
    val text2 = SceneText("text-2", "Interlude guitare", "scene-b", "Entrée guitare seule\nBoucle quatre mesures\nRegarder la régie\nFinal sur accord suspendu", listOf(SceneMarker(label="Final",line=3)))
    val text3 = SceneText("text-3", "Soul Transit", "scene-c", "Intro parlée\nPremier couplet\nMontée du refrain\nRefrain final\nRemerciements", listOf(SceneMarker(label="Intro parlée",line=0),SceneMarker(label="Refrain final",line=3)))
    return SceneArchive(program = listOf(
        SceneEntry("perf-1","scene-a","Naya Oris","Lumière noire","Une création soul aux textures électroniques.",minutes=4,textId="text-1",status="ready",evaluation=true),
        SceneEntry("perf-2","scene-b","Lior Benali","Nuit acoustique","Arpèges acoustiques et variations improvisées.",kind="Instrumental",minutes=6,textId="text-2"),
        SceneEntry("perf-3","scene-c","Malik Soren","Soul Transit","Groove chaleureux et envolées vocales.",minutes=5,textId="text-3"),
        SceneEntry("perf-4","scene-d","Collectif Neon","Corps électrique","Danse urbaine, synchronisation et solos.",kind="Danse",minutes=7,evaluation=false),
        SceneEntry("perf-5","scene-e","June Kairo","Minuit 140","Un DJ set Drum & Bass.",kind="DJ set",minutes=12),
        SceneEntry("perf-6","scene-duo","Naya Oris × Malik Soren","Deux voix","Harmonies croisées et final commun.",kind="Collaboration",minutes=6,textId="text-3",status="done",evaluation=true)
    ), texts = listOf(text1,text2,text3), evaluations = mapOf("perf-6" to SceneEvaluation(responses = (0..7).associate { "demo-fan-" + it to SceneResponse(if (it==0) 3 else if(it<3) 4 else 5, sceneReactions.filterIndexed { r, _ -> (it+r)%3!=0 }.toSet()) })))
}
