package com.meewav.android.features.rooms.wave

import kotlinx.coroutines.launch
import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val cageInk = Color(0xFFE3DFEB)
private val cageMuted = Color(0xFF9995A4)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
internal fun CageToolsPanel(state: CageToolsState, programScope: String) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val store = remember(context, programScope) { CageProgramStore(context, programScope) }
    val scope = rememberCoroutineScope()
    var libraryOpen by remember { mutableStateOf(false) }
    var library by remember { mutableStateOf(emptyList<org.json.JSONObject>()) }
    var saving by remember { mutableStateOf(false) }
    fun manageParticipants() { state.guests.selected = emptySet(); state.guests.guestPage = 0; state.selectionMode = true }
    var settings by remember { mutableStateOf(false) }
    var reset by remember { mutableStateOf(false) }
    var incident by remember { mutableStateOf(false) }
    var simulation by remember { mutableStateOf(false) }
    var voter by remember { mutableStateOf("public-1") }
    var voterJury by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().padding(top = 2.dp)) {
        Row(Modifier.fillMaxWidth().height(44.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            listOf(if (state.format == CageFormat.LEAGUE) "Classement" else "Programme", "Régie", "Match", "Vote").forEachIndexed { index, label ->
                Box(Modifier.weight(1f).height(44.dp).clip(RoundedCornerShape(8.dp)).clickable { state.page = index }, contentAlignment = Alignment.Center) {
                    Text(label, color = Color.White.copy(alpha = if (state.page == index) .95f else .5f), fontSize = 11.sp, fontWeight = if (state.page == index) FontWeight.SemiBold else FontWeight.Normal)
                    if (state.page == index) Box(Modifier.align(Alignment.BottomCenter).padding(bottom = 5.dp).width(32.dp).height(2.dp)
                        .background(Brush.horizontalGradient(listOf(Color.Transparent, WaveMixerTheme.capsuleAccentSoft, Color.Transparent)), RoundedCornerShape(50)))
                }
            }
        }
        state.notice?.let { notice -> Row(verticalAlignment = Alignment.CenterVertically) {
            Text(notice, color = WaveMixerTheme.capsuleAccentSoft, fontSize = 11.sp, modifier = Modifier.weight(1f))
            IconButton(onClick = { state.notice = null }) { Icon(Icons.Default.Close, "Fermer", tint = cageMuted) }
        } }
        LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(top = 6.dp, bottom = 12.dp)) {
            item {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(state.format.title, color = cageInk, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        Text(if (state.finished) "Programme terminé" else if (state.locked) "${state.roster.size} artistes · programme confirmé" else "Préparation · ${state.roster.size} artistes", color = cageMuted, fontSize = 11.sp)
                    }
                    IconButton(onClick = { settings = true }) { Icon(Icons.Default.Tune, "Réglages de la compétition", tint = WaveMixerTheme.capsuleAccentSoft) }
                }
            }
            when (state.page) {
                0 -> {
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CageAction("Participants", Modifier.weight(1f), !state.locked) { manageParticipants() }
                            CageAction("Mélanger", Modifier.weight(1f), !state.locked) { state.shuffle() }
                        }
                    }
                    if (!state.locked) item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CageAction("Charger un programme", Modifier.weight(1f)) {
                            val entries = store.list(); library = (0 until entries.length()).map { entries.getJSONObject(it) }; libraryOpen = true
                        }
                        CageAction(if (saving) "Enregistrement…" else "Enregistrer", Modifier.weight(1f), !saving) {
                            saving = true
                            val snapshot = state.program().json()
                            scope.launch {
                                runCatching { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { store.save(org.json.JSONObject().put("id", state.templateId).put("configuration", snapshot)) } }
                                    .onSuccess { state.templateId = it.getString("id"); state.notice = "Programme enregistré dans Mes Cages sur ce téléphone." }
                                    .onFailure { state.notice = "Enregistrement impossible. Vérifie le titre et réessaie." }
                                saving = false
                            }
                        }
                    } }
                    if (!state.locked && state.matches.isEmpty() && state.roster.isNotEmpty()) items(state.roster, key = { "roster-$it" }) { id -> CageCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.weight(1f)) { CagePerson(state.person(id)) }
                            IconButton(onClick = { state.removeParticipants(setOf(id)) }) { Icon(Icons.Default.Close, "Retirer du programme", tint = cageMuted) }
                        }
                        Text(state.person(id)?.originLabel.orEmpty(), color = cageMuted, fontSize = 10.sp)
                    } }
                    if (state.matches.isEmpty()) item { CageCard { Text("Choisis les artistes et le format, puis utilise le bouton en bas pour préparer le programme.", color = cageMuted, fontSize = 12.sp) } }
                    items(state.matches, key = { it.id }) { match ->
                        CageCard {
                            Text("Tour ${match.round} · Match ${match.id + 1}", color = cageMuted, fontSize = 10.sp)
                            CagePerson(state.person(match.a), match.winner == match.a)
                            match.b?.let { CagePerson(state.person(it), match.winner == it) }
                            if (match.completed) Text(match.score?.let { "Note : ${it / 20f} / 5" } ?: "Qualifié : ${state.person(match.winner)?.name}", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 11.sp)
                        }
                    }
                    if (state.format == CageFormat.LEAGUE && state.matches.any { it.completed }) item {
                        CageCard {
                            Text("Classement", color = cageInk, fontWeight = FontWeight.SemiBold)
                            state.roster.sortedByDescending { id -> state.matches.count { it.winner == id } }.forEachIndexed { index, id ->
                                Text("${index + 1}. ${state.person(id)?.name} · ${state.matches.count { it.winner == id } * 3} pts", color = cageMuted, fontSize = 12.sp)
                            }
                        }
                    }
                    if (state.finished && state.format in listOf(CageFormat.TOURNAMENT, CageFormat.CHALLENGER)) item { CageCard {
                        Text("Vainqueur", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp)
                        CagePerson(state.person(state.matches.lastOrNull()?.winner), true)
                    } }
                }
                1 -> {
                    if (!state.locked) item { Text("Prépare les artistes et le programme avant leur entrée en scène.", color = cageMuted, fontSize = 12.sp) }
                    else {
                        items(state.matches.filterNot { it.completed }, key = { it.id }) { match ->
                            CageCard {
                                Text("Match ${match.id + 1}", color = cageMuted, fontSize = 11.sp)
                                listOfNotNull(match.a, match.b).forEach { id ->
                                    val person = state.person(id)
                                    CagePerson(person)
                                    Text(if (person?.connected != true) "Connexion perdue" else if (!person.canParticipate) "Invitation en attente" else if (person.location == WaveGuestLocation.BACKSTAGE) "Prêt à monter" else person.location.label,
                                        color = if (person?.connected == true) cageMuted else Color(0xFFC88B90), fontSize = 10.sp)
                                    if (com.meewav.android.BuildConfig.DEBUG && person != null && (!person.canParticipate || !person.connected)) {
                                        CageAction("Simuler son arrivée") {
                                            state.guests.demoInvitationResponse(id, true)
                                            state.guests.demoReconnect(id)
                                            state.guests.move(setOf(id), WaveGuestLocation.BACKSTAGE)
                                            state.notice = null
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                2 -> {
                    val match = state.active
                    if (match == null) item { Text("Le prochain passage apparaîtra ici après la préparation.", color = cageMuted, fontSize = 12.sp) }
                    else {
                        item { CageCard {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                CageMatchArtist(state.person(match.a), state.speaker.contains("A"), Modifier.weight(1f))
                                match.b?.let { opponent ->
                                    Box(Modifier.height(80.dp).width(52.dp), contentAlignment = Alignment.Center) {
                                        Box(Modifier.size(52.dp).background(Brush.radialGradient(listOf(WaveMixerTheme.capsuleAccentSoft.copy(alpha = .18f), Color.Transparent)), CircleShape), contentAlignment = Alignment.Center) {
                                            Text("VS", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 24.sp, fontWeight = FontWeight.Black, fontStyle = FontStyle.Italic, letterSpacing = 1.sp)
                                        }
                                    }
                                    CageMatchArtist(state.person(opponent), state.speaker.contains("B"), Modifier.weight(1f))
                                }
                            }
                            val seconds = (state.remainingMs + 999) / 1000
                            Text("%02d:%02d".format(seconds / 60, seconds % 60), modifier = Modifier.align(Alignment.CenterHorizontally), fontSize = 38.sp, fontFamily = FontFamily.Monospace, color = WaveMixerTheme.capsuleAccentSoft)
                            Text("${state.phase} · ${state.speaker} · ${state.step + 1}/${state.steps.size}", color = cageMuted, fontSize = 11.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
                        } }
                        if (state.clockRunning) item { CageAction("Mettre en pause") { state.pause() } }
                        item {
                            if (state.incident != null) CageCard {
                                Text(state.incident.orEmpty(), color = Color(0xFFC88B90))
                            } else CageAction("Signaler un incident", enabled = !match.completed && !state.voteOpen) { incident = true }
                        }
                    }
                }
                3 -> {
                    val match = state.active
                    if (match == null) item { Text("Le vote sera disponible après les passages des artistes.", color = cageMuted, fontSize = 12.sp) }
                    else {
                        item { Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("Public", "Jury", "Hybride").forEach { mode -> CageAction(mode, Modifier.weight(1f), !state.voteOpen && !state.voteClosed, primary = state.voteMode == mode) { state.voteConfig(mode, state.voteSeconds) } }
                        } }
                        item { Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(30, 45, 60, 90).forEach { seconds -> CageAction("${seconds}s", Modifier.weight(1f), !state.voteOpen && !state.voteClosed, primary = state.voteSeconds == seconds) { state.voteConfig(state.voteMode, seconds) } }
                        } }
                        if (state.simulatesPublicVote) item {
                            Text(if (state.voteMode == "Public") "Simulation automatique du public · ${state.simulationVoteSeconds} secondes. La durée choisie reste enregistrée."
                                else "Public simulé automatiquement en ${state.simulationVoteSeconds} secondes · durée du jury inchangée.", color = cageMuted, fontSize = 11.sp)
                        }
                        item { CageCard {
                            CagePerson(state.person(match.a))
                            match.b?.let { CagePerson(state.person(it)) }
                            if (state.voteOpen) { state.voteTick; Text("${state.voteRemaining}s · Vote ouvert", color = WaveMixerTheme.capsuleAccentSoft) }
                            run {
                                Text(if (state.revealed) "A : ${state.score("A").toInt()} %" + if (match.b != null) " · B : ${state.score("B").toInt()} %" else "" else "Résultats masqués", color = cageMuted, fontSize = 12.sp)
                                Text("${state.publicBallots.size} bulletins public · ${state.juryBallots.size} jury", color = cageMuted, fontSize = 11.sp)
                            }
                        } }
                        if (!state.simulatesPublicVote || state.voteMode != "Public") item {
                            CageAction(if (state.simulatesPublicVote || state.voteMode == "Jury") "Bulletins du jury" else "Bulletins de démonstration", enabled = state.voteOpen) {
                                voterJury = state.simulatesPublicVote || state.voteMode == "Jury"
                                voter = if (voterJury) state.guests.jury.firstOrNull()?.id.orEmpty() else "public-1"
                                simulation = true
                            }
                        }
                        if (state.revealed && state.voteClosed && !match.completed) {
                            item {
                                val a = state.score("A"); val b = state.score("B")
                                if (a == b) Text("Égalité · lance une manche décisive avec le bouton principal.", color = cageMuted, fontSize = 11.sp)
                            }
                        }
                    }
                }
            }
        }
        Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(8.dp)) {
            Text(state.active?.let { listOfNotNull(state.person(it.a)?.name, state.person(it.b)?.name).joinToString(" · ") } ?: "${state.roster.size} artistes", color = cageMuted, fontSize = 10.sp, maxLines = 1, modifier = Modifier.padding(bottom = 4.dp))
            Text(state.commandHint, color = cageMuted, fontSize = 11.sp, modifier = Modifier.padding(bottom = 6.dp))
            CageAction(state.commandLabel, enabled = state.commandEnabled, primary = true) { state.advance() }
        }
    }
    if (settings) ModalBottomSheet(onDismissRequest = { settings = false }, containerColor = Color(0xFF111216)) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Réglages de la Cage", color = cageInk, fontSize = 18.sp)
            OutlinedTextField(state.title, { if (!state.locked) state.title = it.take(100) }, label = { Text("Nom du programme") }, enabled = !state.locked, singleLine = true)
            Text("${state.capacity} places · ${state.roster.size} participants retenus", color = cageMuted, fontSize = 12.sp)
            Row(Modifier.horizontalScroll(rememberScrollState())) { listOf(2, 4, 8, 12, 16, 24, 32, 64).forEach { n -> TextButton(onClick = { state.changeCapacity(n) }, enabled = !state.locked && n >= state.roster.size) { Text("$n", color = if (state.capacity == n) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            Text("Atelier local · votes et résultats non synchronisés au serveur.", color = cageMuted, fontSize = 11.sp)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { CageFormat.entries.forEach { format -> TextButton(onClick = { state.chooseFormat(format) }, enabled = !state.locked) { Text(format.title, color = if (state.format == format) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            CageSettingSelect("En cas d’égalité", state.tieBreak, linkedMapOf("sudden-death" to "Manche décisive", "replay" to "Rejouer la rencontre"), !state.locked) { state.preparationRules(tie = it) }
            Text("Durée d’un passage", color = cageMuted, fontSize = 12.sp)
            Row(Modifier.horizontalScroll(rememberScrollState())) { (listOf(30, 60, 90, 120, 180, 240, 300) + state.passageSeconds).distinct().sorted().forEach { duration -> TextButton(onClick = { state.configure(duration, state.rounds, state.performance) }, enabled = !state.locked) { Text("${duration}s", color = if (duration == state.passageSeconds) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            state.simulationPassageSeconds?.let { seconds ->
                Text("Simulation · $seconds secondes par passage. La durée choisie reste enregistrée dans le programme.", color = cageMuted, fontSize = 11.sp)
            }
            Row { listOf(1, 2, 3, 5).forEach { count -> TextButton(onClick = { state.configure(state.passageSeconds, count, state.performance) }, enabled = !state.locked) { Text("$count round${if (count > 1) "s" else ""}", color = if (state.rounds == count) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            Row { listOf("Successif", "Alterné", "Simultané").forEach { mode -> TextButton(onClick = { state.configure(state.passageSeconds, state.rounds, mode) }, enabled = !state.locked) { Text(mode, color = if (state.performance == mode) WaveMixerTheme.capsuleAccentSoft else cageMuted, fontSize = 11.sp) } } }
            CageAction("Recommencer la préparation") { reset = true }
            Text("Journal de session", color = cageInk)
            state.history.takeLast(8).reversed().forEach { Text(it, color = cageMuted, fontSize = 11.sp) }
        }
    }
    if (libraryOpen) ModalBottomSheet(onDismissRequest = { libraryOpen = false }, containerColor = Color(0xFF111216)) {
        Row(Modifier.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("Mes programmes", color = cageInk, modifier = Modifier.weight(1f))
            IconButton(onClick = { libraryOpen = false }) { Icon(Icons.Default.Close, "Fermer", tint = WaveMixerTheme.capsuleAccentSoft) }
        }
        LazyColumn(Modifier.heightIn(max = 420.dp).padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (library.isEmpty()) item { Text("Enregistre un programme ici, dans le séquenceur ou depuis Mes Cages dans le profil.", color = cageMuted) }
            items(library) { entry ->
                val program = runCatching { CageProgram.decode(entry.getJSONObject("configuration")) }.getOrNull()
                if (program != null) CageCard { Column(Modifier.fillMaxWidth().clickable { state.applyProgram(program); libraryOpen = false }) {
                    Text(program.title, color = cageInk, fontSize = 14.sp)
                    Text("${program.format.title} · ${program.capacity} places", color = cageMuted, fontSize = 11.sp)
                } }
            }
        }
    }
    if (incident) AlertDialog(onDismissRequest = { incident = false }, containerColor = Color(0xFF141419), title = { Text("Incident de passage") }, text = {
        Column { listOf("Connexion interrompue", "Problème audio", "Artiste absent").forEach { reason -> TextButton(onClick = { state.report(reason); incident = false }) { Text(reason, color = cageInk) } } }
    }, confirmButton = { TextButton(onClick = { incident = false }) { Text("Annuler") } })
    if (reset) AlertDialog(onDismissRequest = { reset = false }, containerColor = Color(0xFF141419), title = { Text("Recommencer ?") }, text = { Text("Le programme, les votes et les résultats de cette session seront effacés.") },
        confirmButton = { TextButton(onClick = { state.reset(); reset = false; settings = false }) { Text("Recommencer") } }, dismissButton = { TextButton(onClick = { reset = false }) { Text("Conserver") } })
    if (simulation) ModalBottomSheet(onDismissRequest = { simulation = false }, containerColor = Color(0xFF111216)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(if (state.simulatesPublicVote || state.voteMode == "Jury") "Bulletins locaux du jury" else "Bulletins locaux de démonstration", color = cageInk)
            Text("Choisis un compte de test. Un nouveau choix remplace son bulletin.", color = cageMuted, fontSize = 12.sp)
            if (!state.simulatesPublicVote && state.voteMode != "Jury") {
                Row(Modifier.horizontalScroll(rememberScrollState())) { (1..5).forEach { n -> TextButton(onClick = { voter = "public-$n"; voterJury = false }) { Text("Public $n", color = if (voter == "public-$n") WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            }
            if (state.voteMode != "Public") {
                Row(Modifier.horizontalScroll(rememberScrollState())) { state.guests.jury.forEach { juror -> TextButton(onClick = { voter = juror.id; voterJury = true }) { Text(juror.name, color = if (voter == juror.id) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CageAction("Vote A", Modifier.weight(1f), state.voteOpen && voter.isNotBlank()) { state.ballot(voter, "A", voterJury) }
                CageAction("Vote B", Modifier.weight(1f), state.voteOpen && voter.isNotBlank()) { state.ballot(voter, "B", voterJury) }
            }
        }
    }
}

@Composable
private fun CageSettingSelect(label: String, value: String, options: Map<String, String>, enabled: Boolean, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        Row(Modifier.fillMaxWidth().hifiBlackSurface(10.dp).clickable(enabled = enabled) { expanded = true }.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(label, color = cageMuted, fontSize = 10.sp)
                Text(options[value].orEmpty(), color = cageInk.copy(alpha = if (enabled) 1f else .5f), fontSize = 12.sp)
            }
            Icon(Icons.Default.ExpandMore, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(20.dp))
        }
        DropdownMenu(expanded, { expanded = false }, containerColor = Color(0xFF151519)) {
            options.forEach { (key, text) -> DropdownMenuItem(text = { Text(text, color = if (key == value) WaveMixerTheme.capsuleAccentSoft else cageInk) }, onClick = { onSelect(key); expanded = false }) }
        }
    }
}
@Composable
private fun CageCard(content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxWidth().hifiBlackSurface(13.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp), content = content)
}
@Composable
private fun CageMatchArtist(guest: WaveGuest?, emphasized: Boolean, modifier: Modifier = Modifier) {
    val ringColor by animateColorAsState(if (emphasized) WaveMixerTheme.capsuleAccentSoft else cageInk.copy(alpha = .18f), label = "cageMatchRing")
    val nameColor by animateColorAsState(if (emphasized) WaveMixerTheme.capsuleAccentSoft else cageInk, label = "cageMatchName")
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Box(Modifier.size(80.dp)) {
            Box(Modifier.fillMaxSize().clip(CircleShape)
                .background(cageInk.copy(alpha = .05f))
                .border(2.dp, ringColor, CircleShape)
                .padding(4.dp), contentAlignment = Alignment.Center) {
                if (guest != null) Image(painterResource(guest.portrait), null, Modifier.fillMaxSize().clip(CircleShape), contentScale = androidx.compose.ui.layout.ContentScale.Crop)
                else Icon(Icons.Default.Person, null, Modifier.size(32.dp), tint = cageMuted)
            }
            guest?.let { CageVictoryBadge(it.cageVictories, Modifier.align(Alignment.BottomCenter)) }
        }
        Text(guest?.name ?: "À déterminer", color = nameColor, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
        Text(guest?.role.orEmpty(), color = cageMuted, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
    }
}
@Composable
private fun CagePerson(guest: WaveGuest?, emphasized: Boolean = false) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        guest?.let { Image(painterResource(it.portrait), null, Modifier.size(32.dp).clip(CircleShape), contentScale = androidx.compose.ui.layout.ContentScale.Crop) }
        guest?.let { CageVictoryBadge(it.cageVictories) }
        Column(Modifier.weight(1f)) {
            Text(guest?.name ?: "À déterminer", color = if (emphasized) WaveMixerTheme.capsuleAccentSoft else cageInk, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Text(guest?.role.orEmpty(), color = cageMuted, fontSize = 10.sp, maxLines = 1)
        }
    }
}
@Composable
private fun CageAction(label: String, modifier: Modifier = Modifier.fillMaxWidth(), enabled: Boolean = true, primary: Boolean = false, onClick: () -> Unit) {
    Box(modifier.heightIn(min = 42.dp).hifiBlackSurface(9.dp).then(if (primary) Modifier.background(WaveMixerTheme.primaryCta.copy(alpha = .28f), RoundedCornerShape(9.dp)) else Modifier)
        .clickable(enabled = enabled, onClick = onClick).padding(horizontal = 8.dp, vertical = 9.dp), contentAlignment = Alignment.Center) {
        Text(label, color = (if (primary) WaveMixerTheme.capsuleAccentSoft else cageInk).copy(alpha = if (enabled) 1f else .35f), fontSize = 11.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }
}
