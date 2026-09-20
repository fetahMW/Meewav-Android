package com.meewav.android.features.rooms.wave

import android.os.SystemClock
import androidx.compose.runtime.*
import kotlinx.coroutines.*

internal enum class CageFormat(val title: String, val route: String) { TOURNAMENT("Tournoi", "tournament"), LEAGUE("Championnat", "championship"), OPEN_MIC("Open mic", "open-mic"), CHALLENGER("Open mic battle", "open-mic-battle") }
internal data class CageMatch(val id: Int, val a: String, val b: String? = null, val round: Int = 1,
    val winner: String? = null, val completed: Boolean = false, val score: Int? = null)

/** Native local workshop. No ballot or verdict here is presented as a server result. */
internal class CageToolsState(val guests: WaveGuestState,
    private val now: () -> Long = { SystemClock.elapsedRealtime() },
    dispatcher: CoroutineDispatcher = Dispatchers.Main.immediate,
    ticking: Boolean = true) : AutoCloseable {
    private val scope = CoroutineScope(SupervisorJob() + dispatcher)
    var page by mutableIntStateOf(0)
    var videoMode by mutableStateOf("Face à face")
    var format by mutableStateOf(CageFormat.TOURNAMENT); private set
    var roster by mutableStateOf(emptyList<String>()); private set
    var title by mutableStateOf("Battle Rap — Paris vs Marseille")
    var templateId: String? = null
    var capacity by mutableIntStateOf(16); private set
    var selectionMode by mutableStateOf(false)
    var rosterMode by mutableStateOf("manual"); private set
    var feedback by mutableStateOf("scored"); private set
    var tieBreak by mutableStateOf("sudden-death"); private set
    private var decisive = false
    fun applyProgram(program: CageProgram) {
        if (locked) { notice = "Un programme en cours ne peut pas être remplacé."; return }
        reset(); title = program.title; templateId = program.templateId; format = program.format; capacity = program.capacity
        rosterMode = program.rosterMode; feedback = program.feedback; tieBreak = program.tieBreak
        program.roster.forEach { id -> guests.reserveProgramInvite(id, program.people.firstOrNull { it.first == id }?.second ?: id) }
        roster = program.roster.toList(); configure(program.passage, program.rounds, program.performance)
        voteConfig(program.voteMode, program.voteSeconds)
    }
    fun program() = CageProgram(title.trim(), format, capacity, rosterMode, roster,
        roster.map { it to (person(it)?.name ?: it) }, rounds, passageSeconds, performance, voteMode, voteSeconds, feedback, tieBreak, templateId)
    fun changeCapacity(count: Int) { if (!locked && count in (if(isSolo) 1 else 2)..64 && count >= roster.size) capacity = count }
    fun preparationRules(selection: String = rosterMode, response: String = feedback, tie: String = tieBreak) {
        if (locked) return
        if (selection in listOf("manual", "prepared", "random", "first-eligible")) rosterMode = selection
        if (response in listOf("none", "scored", "appreciation")) feedback = response
        if (tie in listOf("replay", "sudden-death")) tieBreak = tie
    }
    fun addParticipants(ids: Set<String>) {
        if (locked) { notice = "Le programme est confirmé."; return }
        val available = ids.filter { person(it)?.location != WaveGuestLocation.JURY && person(it)?.invitation != GuestInvitation.DECLINED && person(it) != null }
        if ((roster + available).distinct().size > capacity) { notice = "${capacity} places maximum. Ajuste la capacité dans les réglages."; return }
        roster = (roster + available).distinct(); matches = emptyList()
    }
    fun removeParticipants(ids: Set<String>) { if (!locked) { roster = roster.filterNot { it in ids }; matches = emptyList() } }
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
    var feedbackBallots by mutableStateOf(mapOf<String, Int>()); private set
    var note by mutableFloatStateOf(75f)
    var incident by mutableStateOf<String?>(null); private set
    var notice by mutableStateOf<String?>(null)
    var history by mutableStateOf(listOf("Atelier local · Battle Rap — Paris vs Marseille")); private set
    private var incidentResumePhase = "Pause"
    private var deadline = 0L
    private var voteDeadline = 0L
    val active get() = matches.find { it.id == activeId }
    val isSolo get() = format == CageFormat.OPEN_MIC
    val currentRound get() = matches.maxOfOrNull { it.round } ?: 1
    val finished get() = locked && matches.isNotEmpty() && matches.all { it.completed }
    val steps: List<String> get() = if (isSolo) listOf("A") else (0 until if (decisive) 1 else rounds).flatMap { r ->
        when (performance) { "Simultané" -> listOf("A + B"); "Alterné" -> if (r % 2 == 0) listOf("A", "B") else listOf("B", "A"); else -> listOf("A", "B") }
    }
    val speaker get() = steps.getOrElse(step) { "Terminé" }
    val voteRemaining get() = ((voteDeadline - now()).coerceAtLeast(0) + 999) / 1000
    var voteTick by mutableLongStateOf(0); private set
    fun person(id: String?) = guests.guests.find { it.id == id }
    init { if (ticking) scope.launch { while (isActive) {
        if (clockRunning) {
            remainingMs = (deadline - now()).coerceAtLeast(0)
            if (remainingMs == 0L) { clockRunning = false; phase = "Temps écoulé"; log("Fin du passage $speaker") }
        }
        if (voteOpen) { voteTick++; if (now() >= voteDeadline) closeVote() }
        delay(100)
    } } }
    private fun log(text: String) { history = (history + text).takeLast(60) }
    val commandLabel: String get() = when {
        !locked && roster.isEmpty() && rosterMode in listOf("manual", "prepared") -> "Choisir les participants"
        !locked -> if (matches.isEmpty()) "Préparer le programme" else if (format == CageFormat.CHALLENGER) "Confirmer les duels" else "Confirmer le programme"
        finished -> "Voir les résultats"
        active == null || active?.completed == true -> "Préparer la rencontre suivante"
        incident != null -> "Reprendre après l’incident"
        phase == "Appel" -> if (ready()) "Monter sur scène" else "En attente des artistes"
        voteOpen -> "Clore le vote"
        voteClosed && !revealed -> "Révéler le résultat"
        voteClosed && !isSolo && publicBallots.isEmpty() && juryBallots.isEmpty() -> "Relancer le vote sans bulletin"
        voteClosed && !isSolo && score("A") == score("B") -> "Jouer la manche décisive"
        voteClosed -> "Valider le résultat"
        phase == "Prêt au vote" -> if (isSolo && feedback == "none") "Terminer ce passage" else if (isSolo) "Ouvrir les avis du public" else "Ouvrir le vote"
        clockRunning || phase == "Temps écoulé" -> "Terminer le passage"
        phase == "Pause" -> "Reprendre le passage"
        else -> "Démarrer le passage"
    }
    val commandEnabled get() = phase != "Appel" || ready()
    val commandHint: String get() = when {
        !locked && matches.isEmpty() -> "Choisis les artistes ; tu pourras revoir l’ordre avant de confirmer."
        !locked -> "Vérifie l’ordre : la confirmation fixe les participants, sans lancer le direct."
        finished -> "Tous les passages sont terminés."
        active == null || active?.completed == true -> if (format == CageFormat.CHALLENGER && active != null) "Le gagnant reste sur scène ; le prochain challenger arrive." else "La prochaine rencontre sera choisie automatiquement."
        phase == "Appel" -> "Les artistes doivent avoir leur connexion, leur caméra et leur micro prêts."
        incident != null -> "Résous le problème avant de reprendre."
        voteOpen -> "Le vote se ferme aussi à la fin du chronomètre."
        voteClosed -> "La suite dépend des bulletins reçus : résultat, égalité ou nouveau vote."
        clockRunning -> "Termine le passage ici ; Pause reste disponible dans Match."
        else -> "Ce bouton te conduit automatiquement à la prochaine étape."
    }
    fun advance() {
        notice = null
        when {
            !locked && roster.isEmpty() && rosterMode in listOf("manual", "prepared") -> { selectionMode = true; guests.guestPage = 1 }
            !locked -> if (matches.isEmpty()) generate() else lock()
            finished -> page = 0
            active == null || active?.completed == true -> matches.firstOrNull { !it.completed }?.let { call(it.id); page = 1 }
            incident != null -> resumeIncident()
            phase == "Appel" -> stage()
            voteOpen -> closeVote()
            voteClosed && !revealed -> reveal()
            voteClosed && !isSolo && publicBallots.isEmpty() && juryBallots.isEmpty() -> { clearVote(); openVote() }
            voteClosed && !isSolo && score("A") == score("B") -> {
                clearVote(); decisive = tieBreak == "sudden-death"; step = 0; remainingMs = passageSeconds * 1000L; phase = "Sur scène"; page = 2
                log("Égalité · nouvelle manche décisive")
            }
            voteClosed -> active?.let { verdict(if (isSolo || score("A") > score("B")) it.a else it.b ?: it.a) }
            phase == "Prêt au vote" -> { page = 3; if (isSolo && feedback == "none") { voteClosed = true; revealed = true; active?.let { verdict(it.a) } } else openVote() }
            clockRunning || phase == "Temps écoulé" -> { nextStep(); page = if (phase == "Prêt au vote") 3 else 2 }
            else -> { start(); page = 2 }
        }
    }
    fun chooseFormat(value: CageFormat) { if (!locked) { format = value; capacity = capacity.coerceAtLeast(if (isSolo) 1 else 2); matches = emptyList() } }
    fun configure(duration: Int, count: Int, mode: String) { if (!locked) { passageSeconds = duration; rounds = count; performance = mode; remainingMs = duration * 1000L } }
    fun select(id: String) { if (id in roster) removeParticipants(setOf(id)) else addParticipants(setOf(id)) }
    fun shuffle() { if (!locked) { roster = roster.shuffled(); matches = emptyList() } }
    fun generate() {
        if (locked) return
        if (roster.isEmpty() && rosterMode in listOf("random", "first-eligible")) {
            val candidates = guests.guests.filter { it.canParticipate && it.connected && it.location != WaveGuestLocation.JURY }
            roster = (if (rosterMode == "random") candidates.shuffled() else candidates).take(capacity).map { it.id }
        }
        if (roster.any { person(it) == null || person(it)?.invitation == GuestInvitation.DECLINED || person(it)?.location == WaveGuestLocation.JURY }) { notice = "Retire les artistes indisponibles ou membres du jury de la sélection."; return }
        if (roster.size < if (isSolo) 1 else 2) { notice = "Sélectionne ${if (isSolo) "un artiste" else "au moins deux artistes"}."; return }
        matches = when (format) {
            CageFormat.OPEN_MIC -> roster.mapIndexed { i, id -> CageMatch(i, id) }
            CageFormat.LEAGUE -> roster.flatMapIndexed { i, a -> roster.drop(i + 1).map { b -> a to b } }.mapIndexed { i, pair -> CageMatch(i, pair.first, pair.second) }
            CageFormat.CHALLENGER -> listOf(CageMatch(0, roster[0], roster[1]))
            else -> {
                var size = 2
                while (size < roster.size) size *= 2
                val byes = size - roster.size
                roster.take(byes).mapIndexed { i, id -> CageMatch(i, id, winner = id, completed = true) } +
                    roster.drop(byes).chunked(2).mapIndexed { i, ids -> CageMatch(byes + i, ids[0], ids[1]) }
            }
        }
        log("Programme généré · ${format.title} · ${roster.size} artistes")
    }
    fun lock() { if (matches.isEmpty()) generate(); if (matches.isNotEmpty()) { locked = true; page = 1; log("Programme verrouillé") } }
    fun reset() { guests.move(listOfNotNull(active?.a, active?.b).filter { person(it)?.location == WaveGuestLocation.STAGE }.toSet(), WaveGuestLocation.BACKSTAGE); clockRunning = false; voteOpen = false; locked = false; matches = emptyList(); activeId = null; phase = "Prêt"; incident = null; page = 0; clearVote(); log("Nouvelle préparation") }
    private fun clearVote() { publicBallots = emptyMap(); juryBallots = emptyMap(); feedbackBallots = emptyMap(); voteClosed = false; revealed = false; voteOpen = false; note = 0f }
    fun call(id: Int) {
        val match = matches.find { it.id == id && !it.completed } ?: return
        if (!locked || clockRunning || voteOpen || active?.let { !it.completed && phase != "Prêt" && phase != "Appel" } == true) return
        activeId = match.id; decisive = false; step = 0; remainingMs = passageSeconds * 1000L; phase = "Appel"; incident = null; clearVote()
        val pair = listOfNotNull(match.a, match.b).toSet()
        guests.move(pair.filterNot { format == CageFormat.CHALLENGER && person(it)?.location == WaveGuestLocation.STAGE }.toSet(), WaveGuestLocation.BACKSTAGE)
        log("Appel · ${person(match.a)?.name} ${match.b?.let { "vs ${person(it)?.name}" }.orEmpty()}")
    }
    fun ready(): Boolean = active?.let { m -> listOfNotNull(m.a, m.b).all { id -> person(id)?.let { it.canParticipate && it.connected && it.mic && it.camera && it.location in listOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) } == true } } == true
    fun stage() {
        val match = active ?: return
        if (phase != "Appel" || match.completed) return
        if (!ready()) { notice = "Caméra, micro et connexion doivent être prêts pour les deux artistes."; return }
        val ids = listOfNotNull(match.a, match.b).toSet()
        guests.move(guests.onStage.map { it.id }.filterNot { it in ids }.toSet(), WaveGuestLocation.BACKSTAGE)
        guests.move(ids, WaveGuestLocation.STAGE)
        if (ids.all { id -> guests.onStage.any { it.id == id } }) { phase = "Sur scène"; page = 2; log("Artistes sur scène") }
    }
    fun start() {
        if (active == null || active?.completed == true || voteOpen || incident != null || phase !in listOf("Sur scène", "Pause", "Temps écoulé")) return
        if (!ready() || listOfNotNull(active?.a, active?.b).any { person(it)?.location != WaveGuestLocation.STAGE }) { notice = "Un artiste n’est plus prêt : vérifie sa connexion, son micro et sa caméra."; return }
        if (remainingMs <= 0) return
        deadline = now() + remainingMs; clockRunning = true; phase = "Performance"; log("Passage $speaker")
    }
    fun pause() { if (clockRunning) { remainingMs = (deadline - now()).coerceAtLeast(0); clockRunning = false; phase = "Pause" } }
    fun nextStep() {
        if (active == null || active?.completed == true || phase !in listOf("Performance", "Pause", "Temps écoulé", "Sur scène")) return
        clockRunning = false
        if (step + 1 < steps.size) { step++; remainingMs = passageSeconds * 1000L; phase = "Sur scène" }
        else { phase = "Prêt au vote"; page = 3; log("Passages terminés") }
    }
    fun report(reason: String) { if (active == null || active?.completed == true || voteOpen || voteClosed || phase == "Appel") return; incidentResumePhase = if (clockRunning) "Pause" else phase; pause(); incident = reason; phase = "Incident"; log("Incident · $reason") }
    fun resumeIncident() { if (incident != null) { incident = null; phase = incidentResumePhase; log("Incident résolu") } }
    fun voteConfig(mode: String, seconds: Int) { if (!voteOpen && !voteClosed) { voteMode = mode; voteSeconds = seconds } }
    fun openVote() {
        if (phase != "Prêt au vote" || active == null || voteOpen || voteClosed) return
        if (!isSolo && voteMode != "Public" && guests.jury.isEmpty()) { notice = "Ajoute un jury depuis Invités pour ce mode de vote."; return }
        voteOpen = true; voteDeadline = now() + voteSeconds * 1000L; log("Vote local ouvert · $voteMode")
    }
    fun ballot(id: String, side: String, jury: Boolean) {
        if (isSolo || !voteOpen || now() >= voteDeadline || side !in listOf("A", "B") || (side == "B" && active?.b == null)) return
        if (jury && guests.jury.none { it.id == id }) return
        if (jury && voteMode != "Public") juryBallots = juryBallots + (id to side)
        if (!jury && voteMode != "Jury") publicBallots = publicBallots + (id to side)
    }
    fun feedbackBallot(id: String, rating: Int) {
        if (!isSolo || !voteOpen || now() >= voteDeadline || feedback == "none" || rating !in 1..5) return
        feedbackBallots = feedbackBallots + (id to if (feedback == "appreciation") 1 else rating)
        note = if (feedback == "scored") feedbackBallots.values.average().toFloat() * 20 else 0f
    }
    fun score(side: String): Float {
        fun ratio(v: Map<String, String>) = if (v.isEmpty()) 0f else 100f * v.values.count { it == side } / v.size
        return when (voteMode) { "Jury" -> ratio(juryBallots); "Hybride" -> (ratio(publicBallots) + ratio(juryBallots)) / 2; else -> ratio(publicBallots) }
    }
    fun closeVote() { if (voteOpen) { voteOpen = false; voteClosed = true; page = 3; log("Vote fermé") } }
    fun reveal() { if (voteClosed) { revealed = !revealed; page = 3 } }
    fun verdict(id: String) {
        val match = active ?: return
        if (voteOpen || !voteClosed || !revealed || match.completed || id !in listOfNotNull(match.a, match.b)) return
        if (!isSolo && publicBallots.isEmpty() && juryBallots.isEmpty()) { notice = "Aucun bulletin : impossible de désigner un vainqueur."; return }
        if (!isSolo && (score("A") == score("B") || (id == match.a && score("A") < score("B")) || (id == match.b && score("B") < score("A")))) { notice = "Une égalité nécessite une manche décisive ; le résultat doit respecter le vote."; return }
        matches = matches.map { if (it.id == match.id) it.copy(winner = id, completed = true, score = if (isSolo && feedback == "scored" && feedbackBallots.isNotEmpty()) note.toInt() else null) else it }
        guests.move(listOfNotNull(match.a, match.b).filterNot { format == CageFormat.CHALLENGER && it == id }.toSet(), WaveGuestLocation.BACKSTAGE)
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
