package com.meewav.android.features.rooms.wave

import android.os.SystemClock
import androidx.compose.runtime.*
import kotlinx.coroutines.*

internal enum class CageFormat(val title: String) { TOURNAMENT("Tournoi"), LEAGUE("Championnat"), OPEN_MIC("Open mic"), CHALLENGER("Open mic battle") }
internal data class CageMatch(val id: Int, val a: String, val b: String? = null, val round: Int = 1,
    val winner: String? = null, val completed: Boolean = false, val score: Int? = null)

/** Native local workshop. No ballot or verdict here is presented as a server result. */
internal class CageToolsState(val guests: WaveGuestState) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    var page by mutableIntStateOf(0)
    var format by mutableStateOf(CageFormat.TOURNAMENT); private set
    var roster by mutableStateOf(guests.guests.take(4).map { it.id }); private set
    var matches by mutableStateOf(emptyList<CageMatch>()); private set
    var locked by mutableStateOf(false); private set
    var activeId by mutableStateOf<Int?>(null); private set
    var phase by mutableStateOf("Prêt"); private set
    var rounds by mutableIntStateOf(1); private set
    var passageSeconds by mutableIntStateOf(60); private set
    var performance by mutableStateOf("Successif"); private set
    var step by mutableIntStateOf(0); private set
    var remainingMs by mutableLongStateOf(60_000); private set
    var clockRunning by mutableStateOf(false); private set
    var voteMode by mutableStateOf("Public"); private set
    var voteSeconds by mutableIntStateOf(30); private set
    var voteOpen by mutableStateOf(false); private set
    var voteClosed by mutableStateOf(false); private set
    var revealed by mutableStateOf(false); private set
    var publicBallots by mutableStateOf(mapOf<String, String>()); private set
    var juryBallots by mutableStateOf(mapOf<String, String>()); private set
    var note by mutableFloatStateOf(75f)
    var incident by mutableStateOf<String?>(null); private set
    var notice by mutableStateOf<String?>(null)
    var history by mutableStateOf(listOf("Atelier local · Battle Rap — Paris vs Marseille")); private set
    private var deadline = 0L
    private var voteDeadline = 0L
    val active get() = matches.find { it.id == activeId }
    val isSolo get() = format == CageFormat.OPEN_MIC
    val currentRound get() = matches.maxOfOrNull { it.round } ?: 1
    val finished get() = locked && matches.isNotEmpty() && matches.all { it.completed }
    val steps: List<String> get() = if (isSolo) listOf("A") else (0 until rounds).flatMap { r ->
        when (performance) { "Simultané" -> listOf("A + B"); "Alterné" -> if (r % 2 == 0) listOf("A", "B") else listOf("B", "A"); else -> listOf("A", "B") }
    }
    val speaker get() = steps.getOrElse(step) { "Terminé" }
    val voteRemaining get() = ((voteDeadline - SystemClock.elapsedRealtime()).coerceAtLeast(0) + 999) / 1000
    var voteTick by mutableLongStateOf(0); private set
    fun person(id: String?) = guests.guests.find { it.id == id }
    init { scope.launch { while (isActive) {
        if (clockRunning) {
            remainingMs = (deadline - SystemClock.elapsedRealtime()).coerceAtLeast(0)
            if (remainingMs == 0L) { clockRunning = false; phase = "Temps écoulé"; log("Fin du passage $speaker") }
        }
        if (voteOpen) { voteTick++; if (SystemClock.elapsedRealtime() >= voteDeadline) closeVote() }
        delay(100)
    } } }
    private fun log(text: String) { history = (history + text).takeLast(60) }
    fun chooseFormat(value: CageFormat) { if (!locked) { format = value; matches = emptyList() } }
    fun configure(duration: Int, count: Int, mode: String) { if (!locked) { passageSeconds = duration; rounds = count; performance = mode; remainingMs = duration * 1000L } }
    fun select(id: String) { if (!locked) { roster = if (id in roster) roster - id else (roster + id).take(32); matches = emptyList() } }
    fun shuffle() { if (!locked) { roster = roster.shuffled(); matches = emptyList() } }
    fun generate() {
        if (locked) return
        if (roster.size < if (isSolo) 1 else 2) { notice = "Sélectionne ${if (isSolo) "un artiste" else "au moins deux artistes"}."; return }
        if (format == CageFormat.TOURNAMENT && roster.size.countOneBits() != 1) { notice = "Choisis 2, 4, 8, 16 ou 32 artistes pour ce tournoi."; return }
        matches = when (format) {
            CageFormat.OPEN_MIC -> roster.mapIndexed { i, id -> CageMatch(i, id) }
            CageFormat.LEAGUE -> roster.flatMapIndexed { i, a -> roster.drop(i + 1).map { b -> a to b } }.mapIndexed { i, pair -> CageMatch(i, pair.first, pair.second) }
            CageFormat.CHALLENGER -> listOf(CageMatch(0, roster[0], roster[1]))
            else -> roster.chunked(2).mapIndexed { i, ids -> CageMatch(i, ids[0], ids[1]) }
        }
        log("Programme généré · ${format.title} · ${roster.size} artistes")
    }
    fun lock() { if (matches.isEmpty()) generate(); if (matches.isNotEmpty()) { locked = true; page = 1; log("Programme verrouillé") } }
    fun reset() { clockRunning = false; voteOpen = false; locked = false; matches = emptyList(); activeId = null; phase = "Prêt"; incident = null; page = 0; clearVote(); log("Nouvelle préparation") }
    private fun clearVote() { publicBallots = emptyMap(); juryBallots = emptyMap(); voteClosed = false; revealed = false; voteOpen = false; note = 75f }
    fun call(id: Int) {
        val match = matches.find { it.id == id && !it.completed } ?: return
        if (!locked || clockRunning || voteOpen || active?.let { !it.completed && phase != "Prêt" && phase != "Appel" } == true) return
        activeId = match.id; step = 0; remainingMs = passageSeconds * 1000L; phase = "Appel"; incident = null; clearVote()
        val pair = listOfNotNull(match.a, match.b).toSet()
        guests.move(pair, WaveGuestLocation.BACKSTAGE)
        log("Appel · ${person(match.a)?.name} ${match.b?.let { "vs ${person(it)?.name}" }.orEmpty()}")
    }
    fun ready(): Boolean = active?.let { m -> listOfNotNull(m.a, m.b).all { id -> person(id)?.let { it.connected && it.mic && it.camera && it.location in listOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) } == true } } == true
    fun stage() {
        val match = active ?: return
        if (!ready()) { notice = "Caméra, micro et connexion doivent être prêts pour les deux artistes."; return }
        val ids = listOfNotNull(match.a, match.b).toSet()
        guests.move(guests.onStage.map { it.id }.filterNot { it in ids }.toSet(), WaveGuestLocation.BACKSTAGE)
        guests.move(ids, WaveGuestLocation.STAGE)
        if (ids.all { id -> guests.onStage.any { it.id == id } }) { phase = "Sur scène"; page = 2; log("Artistes sur scène") }
    }
    fun start() {
        if (active == null || active?.completed == true || voteOpen || incident != null || phase !in listOf("Sur scène", "Pause", "Temps écoulé")) return
        if (remainingMs <= 0) remainingMs = passageSeconds * 1000L
        deadline = SystemClock.elapsedRealtime() + remainingMs; clockRunning = true; phase = "Performance"; log("Passage $speaker")
    }
    fun pause() { if (clockRunning) { remainingMs = (deadline - SystemClock.elapsedRealtime()).coerceAtLeast(0); clockRunning = false; phase = "Pause" } }
    fun nextStep() {
        if (active == null || active?.completed == true || phase !in listOf("Performance", "Pause", "Temps écoulé", "Sur scène")) return
        clockRunning = false
        if (step + 1 < steps.size) { step++; remainingMs = passageSeconds * 1000L; phase = "Sur scène" }
        else { phase = "Prêt au vote"; page = 3; log("Passages terminés") }
    }
    fun report(reason: String) { if (active == null || active?.completed == true || voteOpen) return; pause(); incident = reason; phase = "Incident"; log("Incident · $reason") }
    fun resumeIncident() { if (incident != null) { incident = null; phase = "Pause"; log("Incident résolu") } }
    fun voteConfig(mode: String, seconds: Int) { if (!voteOpen && !voteClosed) { voteMode = mode; voteSeconds = seconds } }
    fun openVote() {
        if (phase != "Prêt au vote" || active == null || voteOpen || voteClosed) return
        if (voteMode != "Public" && guests.jury.isEmpty()) { notice = "Ajoute un jury depuis Invités pour ce mode de vote."; return }
        voteOpen = true; voteDeadline = SystemClock.elapsedRealtime() + voteSeconds * 1000L; log("Vote local ouvert · $voteMode")
    }
    fun ballot(id: String, side: String, jury: Boolean) {
        if (!voteOpen || (side == "B" && active?.b == null)) return
        if (jury && guests.jury.none { it.id == id }) return
        if (jury && voteMode != "Public") juryBallots = juryBallots + (id to side)
        if (!jury && voteMode != "Jury") publicBallots = publicBallots + (id to side)
    }
    fun score(side: String): Float {
        fun ratio(v: Map<String, String>) = if (v.isEmpty()) 0f else 100f * v.values.count { it == side } / v.size
        return when (voteMode) { "Jury" -> ratio(juryBallots); "Hybride" -> (ratio(publicBallots) + ratio(juryBallots)) / 2; else -> ratio(publicBallots) }
    }
    fun closeVote() { if (voteOpen) { voteOpen = false; voteClosed = true; log("Vote fermé") } }
    fun reveal() { if (voteClosed) revealed = !revealed }
    fun verdict(id: String) {
        val match = active ?: return
        if (voteOpen || !voteClosed || !revealed || match.completed || id !in listOfNotNull(match.a, match.b)) return
        if (!isSolo && publicBallots.isEmpty() && juryBallots.isEmpty()) { notice = "Aucun bulletin : impossible de désigner un vainqueur."; return }
        matches = matches.map { if (it.id == match.id) it.copy(winner = id, completed = true, score = if (isSolo) note.toInt() else null) else it }
        guests.move(listOfNotNull(match.a, match.b).toSet(), WaveGuestLocation.BACKSTAGE)
        phase = "Résultat validé"; log("${person(id)?.name} · ${if (isSolo) "note ${note.toInt()}/100" else "vainqueur"}")
        if (format == CageFormat.TOURNAMENT) {
            val round = matches.filter { it.round == currentRound }
            if (round.size > 1 && round.all { it.completed }) {
                val nextRound = currentRound + 1; val firstId = matches.size
                matches = matches + round.mapNotNull { it.winner }.chunked(2).mapIndexed { i, pair -> CageMatch(firstId + i, pair[0], pair[1], nextRound) }
            }
        } else if (format == CageFormat.CHALLENGER) {
            val next = roster.getOrNull(matches.size + 1)
            if (next != null) matches = matches + CageMatch(matches.size, id, next, matches.size + 1)
        }
        page = 0
    }
    override fun close() { scope.cancel() }
}
