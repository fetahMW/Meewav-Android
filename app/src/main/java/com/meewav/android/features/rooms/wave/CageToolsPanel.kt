package com.meewav.android.features.rooms.wave

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val cageInk = Color(0xFFE3DFEB)
private val cageMuted = Color(0xFF9995A4)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
internal fun CageToolsPanel(state: CageToolsState) {
    var settings by remember { mutableStateOf(false) }
    var rosterOpen by remember { mutableStateOf(false) }
    var reset by remember { mutableStateOf(false) }
    var incident by remember { mutableStateOf(false) }
    var verdict by remember { mutableStateOf<String?>(null) }
    var simulation by remember { mutableStateOf(false) }
    var voter by remember { mutableStateOf("public-1") }
    var voterJury by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().height(44.dp)) {
            listOf(if (state.format == CageFormat.LEAGUE) "Classement" else "Programme", "Régie", "Match", "Vote").forEachIndexed { index, label ->
                Column(Modifier.weight(1f).fillMaxHeight().clickable { state.page = index }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    Text(label, color = if (state.page == index) cageInk else cageMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(6.dp))
                    Box(Modifier.width(34.dp).height(2.dp).background(Brush.horizontalGradient(listOf(Color.Transparent, if (state.page == index) WaveMixerTheme.capsuleAccentSoft else Color.Transparent, Color.Transparent))))
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
                        Text(if (state.finished) "Programme terminé" else if (state.locked) "${state.roster.size} artistes · programme verrouillé" else "Préparation · ${state.roster.size} artistes", color = cageMuted, fontSize = 11.sp)
                    }
                    IconButton(onClick = { settings = true }) { Icon(Icons.Default.Tune, "Réglages de la compétition", tint = WaveMixerTheme.capsuleAccentSoft) }
                }
            }
            when (state.page) {
                0 -> {
                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CageAction("Artistes", Modifier.weight(1f), !state.locked) { rosterOpen = true }
                            CageAction("Mélanger", Modifier.weight(1f), !state.locked) { state.shuffle() }
                        }
                    }
                    if (!state.locked) item { CageAction(if (state.matches.isEmpty()) "Générer le programme" else "Verrouiller le programme", primary = true) { if (state.matches.isEmpty()) state.generate() else state.lock() } }
                    if (state.matches.isEmpty()) item { CageCard { Text("Choisis les artistes et le format, puis génère le programme.", color = cageMuted, fontSize = 12.sp) } }
                    items(state.matches, key = { it.id }) { match ->
                        CageCard {
                            Text(if (state.isSolo) "Passage ${match.id + 1}" else "Tour ${match.round} · Match ${match.id + 1}", color = cageMuted, fontSize = 10.sp)
                            CagePerson(state.person(match.a), match.winner == match.a)
                            match.b?.let { CagePerson(state.person(it), match.winner == it) }
                            if (match.completed) Text(match.score?.let { "Note : $it / 100" } ?: "Qualifié : ${state.person(match.winner)?.name}", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 11.sp)
                            else if (state.locked) CageAction("Préparer en régie", enabled = state.active == null || state.active?.completed == true || state.phase == "Appel") { state.page = 1; state.call(match.id) }
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
                    if (!state.locked) item { CageAction("Préparer le programme", primary = true) { state.page = 0 } }
                    else {
                        items(state.matches.filterNot { it.completed }, key = { it.id }) { match ->
                            CageCard {
                                Text(if (state.isSolo) "Passage ${match.id + 1}" else "Match ${match.id + 1}", color = cageMuted, fontSize = 11.sp)
                                listOfNotNull(match.a, match.b).forEach { id ->
                                    val person = state.person(id)
                                    CagePerson(person)
                                    Text(if (person?.connected != true) "Connexion perdue" else if (!person.camera || !person.mic) "Caméra ou micro à préparer" else person.healthLabel,
                                        color = if (person?.connected == true) cageMuted else Color(0xFFC88B90), fontSize = 10.sp)
                                }
                                if (state.activeId == match.id) CageAction("Monter sur scène", enabled = state.ready() && state.phase == "Appel", primary = true) { state.stage() }
                                else CageAction("Appeler les artistes", enabled = state.active == null || state.active?.completed == true || state.phase == "Appel") { state.call(match.id) }
                            }
                        }
                    }
                }
                2 -> {
                    val match = state.active
                    if (match == null) item { CageAction("Choisir un match en régie") { state.page = 1 } }
                    else {
                        item { CageCard {
                            CagePerson(state.person(match.a), state.speaker.contains("A"))
                            match.b?.let { CagePerson(state.person(it), state.speaker.contains("B")) }
                            val seconds = (state.remainingMs + 999) / 1000
                            Text("%02d:%02d".format(seconds / 60, seconds % 60), modifier = Modifier.align(Alignment.CenterHorizontally), fontSize = 38.sp, fontFamily = FontFamily.Monospace, color = WaveMixerTheme.capsuleAccentSoft)
                            Text("${state.phase} · ${state.speaker} · ${state.step + 1}/${state.steps.size}", color = cageMuted, fontSize = 11.sp, modifier = Modifier.align(Alignment.CenterHorizontally))
                        } }
                        item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CageAction(if (state.clockRunning) "Pause" else "Démarrer", Modifier.weight(1f), enabled = state.phase in listOf("Performance", "Pause", "Temps écoulé", "Sur scène"), primary = true) { if (state.clockRunning) state.pause() else state.start() }
                            CageAction(if (state.step + 1 == state.steps.size) "Fin des passages" else "Passage suivant", Modifier.weight(1f), state.phase in listOf("Performance", "Pause", "Temps écoulé", "Sur scène")) { state.nextStep() }
                        } }
                        item {
                            if (state.incident != null) CageCard {
                                Text(state.incident.orEmpty(), color = Color(0xFFC88B90))
                                CageAction("Incident résolu") { state.resumeIncident() }
                            } else CageAction("Signaler un incident", enabled = !match.completed && !state.voteOpen) { incident = true }
                        }
                        if (state.phase == "Prêt au vote") item { CageAction("Passer au vote", primary = true) { state.page = 3 } }
                    }
                }
                3 -> {
                    val match = state.active
                    if (match == null) item { CageAction("Préparer un match") { state.page = 1 } }
                    else {
                        item { Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf("Public", "Jury", "Hybride").forEach { mode -> CageAction(mode, Modifier.weight(1f), !state.voteOpen && !state.voteClosed, primary = state.voteMode == mode) { state.voteConfig(mode, state.voteSeconds) } }
                        } }
                        item { Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(30, 45, 60, 90).forEach { seconds -> CageAction("${seconds}s", Modifier.weight(1f), !state.voteOpen && !state.voteClosed, primary = state.voteSeconds == seconds) { state.voteConfig(state.voteMode, seconds) } }
                        } }
                        item { CageCard {
                            CagePerson(state.person(match.a))
                            match.b?.let { CagePerson(state.person(it)) }
                            if (state.voteOpen) { state.voteTick; Text("${state.voteRemaining}s · Vote ouvert", color = WaveMixerTheme.capsuleAccentSoft) }
                            Text(if (state.revealed) "A : ${state.score("A").toInt()} %" + if (match.b != null) " · B : ${state.score("B").toInt()} %" else "" else "Résultats masqués", color = cageMuted, fontSize = 12.sp)
                            Text("${state.publicBallots.size} bulletins public · ${state.juryBallots.size} jury", color = cageMuted, fontSize = 11.sp)
                        } }
                        item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            CageAction(if (state.voteOpen) "Fermer le vote" else "Ouvrir le vote", Modifier.weight(1f), state.phase == "Prêt au vote" && !state.voteClosed, true) { if (state.voteOpen) state.closeVote() else state.openVote() }
                            CageAction(if (state.revealed) "Masquer" else "Révéler", Modifier.weight(1f), state.voteClosed) { state.reveal() }
                        } }
                        item { CageAction("Bulletins de démonstration", enabled = state.voteOpen) { simulation = true } }
                        if (state.revealed && state.voteClosed && !match.completed) {
                            if (state.isSolo) item { CageCard {
                                Text("Note du passage : ${state.note.toInt()} / 100", color = cageInk)
                                WaveOutputFader(state.note / 100, { state.note = it * 100 }, Modifier.fillMaxWidth().height(44.dp))
                                CageAction("Valider le passage", primary = true) { verdict = match.a }
                            } } else item {
                                val a = state.score("A"); val b = state.score("B")
                                if (a == b) Text("Égalité · lance une manche décisive avec le bouton principal.", color = cageMuted, fontSize = 11.sp)
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    if (a > b) CageAction("Valider A", Modifier.weight(1f), primary = true) { verdict = match.a }
                                    if (b > a) CageAction("Valider B", Modifier.weight(1f), primary = true) { verdict = match.b }
                                }
                            }
                        }
                    }
                }
            }
        }
        Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(8.dp)) {
            Text(state.active?.let { listOfNotNull(state.person(it.a)?.name, state.person(it.b)?.name).joinToString(" · ") } ?: "${state.roster.size} artistes", color = cageMuted, fontSize = 10.sp, maxLines = 1, modifier = Modifier.padding(bottom = 4.dp))
            CageAction(state.commandLabel, enabled = state.commandEnabled, primary = true) { state.advance() }
        }
    }
    if (settings) ModalBottomSheet(onDismissRequest = { settings = false }, containerColor = Color(0xFF111216)) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Réglages de la Cage", color = cageInk, fontSize = 18.sp)
            Text("Atelier local · votes et résultats non synchronisés au serveur.", color = cageMuted, fontSize = 11.sp)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { CageFormat.entries.forEach { format -> TextButton(onClick = { state.chooseFormat(format) }, enabled = !state.locked) { Text(format.title, color = if (state.format == format) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            Text("Durée d’un passage", color = cageMuted, fontSize = 12.sp)
            Row { listOf(60, 90, 120, 180).forEach { duration -> TextButton(onClick = { state.configure(duration, state.rounds, state.performance) }, enabled = !state.locked) { Text("${duration}s", color = if (duration == state.passageSeconds) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            Row { (1..3).forEach { count -> TextButton(onClick = { state.configure(state.passageSeconds, count, state.performance) }, enabled = !state.locked) { Text("$count round${if (count > 1) "s" else ""}", color = if (state.rounds == count) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            Row { listOf("Successif", "Alterné", "Simultané").forEach { mode -> TextButton(onClick = { state.configure(state.passageSeconds, state.rounds, mode) }, enabled = !state.locked) { Text(mode, color = if (state.performance == mode) WaveMixerTheme.capsuleAccentSoft else cageMuted, fontSize = 11.sp) } } }
            CageAction("Recommencer la préparation") { reset = true }
            Text("Journal de session", color = cageInk)
            state.history.takeLast(8).reversed().forEach { Text(it, color = cageMuted, fontSize = 11.sp) }
        }
    }
    if (rosterOpen) ModalBottomSheet(onDismissRequest = { rosterOpen = false }, containerColor = Color(0xFF111216)) {
        Text("Participants · ${state.roster.size} sélectionnés", color = cageInk, modifier = Modifier.padding(16.dp))
        LazyColumn(Modifier.heightIn(max = 400.dp).padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            items(state.guests.guests, key = { it.id }) { guest -> Row(Modifier.fillMaxWidth().hifiBlackSurface(10.dp).clickable { state.select(guest.id) }.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.weight(1f)) { CagePerson(guest) }
                Checkbox(guest.id in state.roster, { state.select(guest.id) }, colors = CheckboxDefaults.colors(checkedColor = WaveMixerTheme.primaryCta))
            } }
        }
        TextButton(onClick = { rosterOpen = false }, modifier = Modifier.fillMaxWidth()) { Text("Terminé", color = WaveMixerTheme.capsuleAccentSoft) }
    }
    if (incident) AlertDialog(onDismissRequest = { incident = false }, containerColor = Color(0xFF141419), title = { Text("Incident de passage") }, text = {
        Column { listOf("Connexion interrompue", "Problème audio", "Artiste absent").forEach { reason -> TextButton(onClick = { state.report(reason); incident = false }) { Text(reason, color = cageInk) } } }
    }, confirmButton = { TextButton(onClick = { incident = false }) { Text("Annuler") } })
    if (reset) AlertDialog(onDismissRequest = { reset = false }, containerColor = Color(0xFF141419), title = { Text("Recommencer ?") }, text = { Text("Le programme, les votes et les résultats de cette session seront effacés.") },
        confirmButton = { TextButton(onClick = { state.reset(); reset = false; settings = false }) { Text("Recommencer") } }, dismissButton = { TextButton(onClick = { reset = false }) { Text("Conserver") } })
    verdict?.let { id -> AlertDialog(onDismissRequest = { verdict = null }, containerColor = Color(0xFF141419), title = { Text("Valider ${state.person(id)?.name} ?") }, text = { Text("Le résultat sera inscrit au programme et la suite sera préparée.") },
        confirmButton = { TextButton(onClick = { state.verdict(id); verdict = null }) { Text("Valider", color = WaveMixerTheme.capsuleAccentSoft) } }, dismissButton = { TextButton(onClick = { verdict = null }) { Text("Annuler") } }) }
    if (simulation) ModalBottomSheet(onDismissRequest = { simulation = false }, containerColor = Color(0xFF111216)) {
        Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Bulletins locaux de démonstration", color = cageInk)
            Text("Choisis un compte de test. Un nouveau choix remplace son bulletin.", color = cageMuted, fontSize = 12.sp)
            Row(Modifier.horizontalScroll(rememberScrollState())) { (1..5).forEach { n -> TextButton(onClick = { voter = "public-$n"; voterJury = false }) { Text("Public $n", color = if (voter == "public-$n") WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            Row(Modifier.horizontalScroll(rememberScrollState())) { state.guests.jury.forEach { juror -> TextButton(onClick = { voter = juror.id; voterJury = true }) { Text(juror.name, color = if (voter == juror.id) WaveMixerTheme.capsuleAccentSoft else cageMuted) } } }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                CageAction("Vote A", Modifier.weight(1f), state.voteOpen) { state.ballot(voter, "A", voterJury) }
                if (!state.isSolo) CageAction("Vote B", Modifier.weight(1f), state.voteOpen) { state.ballot(voter, "B", voterJury) }
            }
        }
    }
}

@Composable
private fun CageCard(content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxWidth().hifiBlackSurface(13.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp), content = content)
}
@Composable
private fun CagePerson(guest: WaveGuest?, emphasized: Boolean = false) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        guest?.let { Image(painterResource(it.portrait), null, Modifier.size(32.dp).clip(CircleShape), contentScale = androidx.compose.ui.layout.ContentScale.Crop) }
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
