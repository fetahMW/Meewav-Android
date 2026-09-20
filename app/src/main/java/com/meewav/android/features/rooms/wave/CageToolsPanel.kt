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
    var fundraiserOpen by remember { mutableStateOf(false) }
    var replacementId by remember { mutableStateOf<String?>(null) }
    var voter by remember { mutableStateOf("public-1") }
    var voterJury by remember { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().padding(top = 2.dp)) {
        Row(Modifier.fillMaxWidth().height(44.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            listOf("Compétition", "Direct", "Participants").forEachIndexed { index, label ->
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
                    if (!state.locked && state.roster.size > 1) item { CageAction("Mélanger l’ordre") { state.shuffle() } }
                    if (!state.locked) item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        CageAction("Charger", Modifier.weight(1f)) {
                            val entries = store.list(); library = (0 until entries.length()).map { entries.getJSONObject(it) }; libraryOpen = true
                        }
                        CageAction(if (saving) "Enregistrement…" else "Enregistrer", Modifier.weight(1f), !saving) {
                            saving = true
                            val snapshot = state.program().json()
                            scope.launch {
                                runCatching { kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) { store.save(org.json.JSONObject().put("id", state.templateId).put("configuration", snapshot)) } }
                                    .onSuccess { state.templateId = it.getString("id"); state.notice = "Programme enregistré dans Mes Cages." }
                                    .onFailure { state.notice = "Enregistrement impossible. Réessaie." }
                                saving = false
                            }
                        }
                    } }
                    item { CageFundraiserSummary(state.fundraiser) { fundraiserOpen = true } }
                    if (state.matches.isNotEmpty() && state.format == CageFormat.TOURNAMENT) item { CageBracket(state) }
                    else if (state.matches.isNotEmpty()) {
                        if (state.format == CageFormat.LEAGUE) item { CageCard {
                            Text("Classement · 3 points par victoire", color = cageInk, fontSize = 12.sp)
                            state.roster.sortedByDescending { id -> state.matches.count { it.winner == id && it.b != null } }.forEachIndexed { index, id ->
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text((index + 1).toString(), color = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.width(24.dp), fontSize = 12.sp)
                                    CageArtistCompact(state, id, Modifier.weight(1f))
                                    Text((state.matches.count { it.winner == id && it.b != null } * 3).toString() + " pts", color = cageInk, fontSize = 12.sp)
                                }
                            }
                        } }
                        if (state.format == CageFormat.CHALLENGER) item { CageCard {
                            Text("Le gagnant reste · prochain challenger", color = cageMuted, fontSize = 11.sp)
                            val next = if (state.active?.completed == true) state.matches.firstOrNull { !it.completed }?.b else state.roster.getOrNull(state.matches.size + 1)
                            if (next != null) CageArtistCompact(state, next) else Text(if (state.finished) "Tous les challengers sont passés" else "Dernier duel programmé", color = cageInk, fontSize = 12.sp)
                        } }
                        items(state.matches, key = { "match-" + it.id }) { match -> CageDuelCard(state, match) }
                    }
                    if (state.finished) item { CageAction("Podium et résultats") { state.resultsOpen = true } }
                }
                1 -> {
                    val match = state.active ?: state.matches.firstOrNull { !it.completed }
                    if (match == null) item { CageCard { Text("Prépare le programme dans Compétition. Le prochain duel apparaîtra ici.", color = cageMuted, fontSize = 12.sp) } }
                    else {
                        item { CageDuelCard(state, match) }
                        if (state.phase == "Appel") items(state.readinessIssues(), key = { "issue-" + it.first }) { issue ->
                            CageParticipantCard(state, issue.first) { replacementId = it }
                        }
                        if (state.active != null && !match.completed) item { CageCard {
                            val voting = state.voteOpen || state.voteClosed || state.phase == "Prêt au vote"
                            state.voteTick
                            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(if (voting) "Vote · " + state.voteMode else if (state.awaitingCountdown) "Compte à rebours" else state.phase, color = cageInk, fontSize = 13.sp)
                                    Text(if (voting) state.publicBallots.size.toString() + " bulletins public · " + state.juryBallots.size + " jury" else "Passage " + (state.step + 1) + "/" + state.steps.size + " · " + state.person(if (state.speaker.contains("A")) match.a else match.b)?.name, color = cageMuted, fontSize = 11.sp)
                                }
                                val seconds = if (state.voteOpen) state.voteRemaining else (state.remainingMs + 999) / 1000
                                Text(if (state.voteClosed) "Terminé" else "%02d:%02d".format(seconds / 60, seconds % 60), fontSize = 28.sp, fontFamily = FontFamily.Monospace, color = WaveMixerTheme.capsuleAccentSoft)
                            }
                            if (voting) {
                                Text(if (state.revealed) "A : " + state.score("A").toInt() + " %   ·   B : " + state.score("B").toInt() + " %" else "Résultats masqués jusqu’à la clôture", color = cageMuted, fontSize = 11.sp)
                                if (state.revealed) LinearProgressIndicator(progress = { (state.score("A") / 100f).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth(), color = WaveMixerTheme.capsuleAccentSoft, trackColor = Color(0xFF4A2B38))
                            }
                        } }
                        if (state.active != null && !match.completed) item { Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (state.clockRunning || state.awaitingCountdown) CageAction(if (state.awaitingCountdown) "Annuler le départ" else "Pause", Modifier.weight(1f)) { state.pause() }
                            CageAction("Incident", Modifier.weight(1f), !state.voteOpen && !state.voteClosed) { incident = true }
                        } }
                        if (state.voteOpen && (!state.simulatesPublicVote || state.voteMode != "Public")) item {
                            CageAction(if (state.simulatesPublicVote || state.voteMode == "Jury") "Bulletins du jury" else "Bulletins de démonstration") {
                                voterJury = state.simulatesPublicVote || state.voteMode == "Jury"
                                voter = if (voterJury) state.guests.jury.firstOrNull()?.id.orEmpty() else "public-1"
                                simulation = true
                            }
                        }
                        state.incident?.let { reason -> item { Text(reason, color = Color(0xFFC88B90), fontSize = 12.sp) } }
                    }
                    item { CageFundraiserSummary(state.fundraiser) { fundraiserOpen = true } }
                }
                2 -> {
                    if (!state.locked) item { CageAction("Choisir dans Invités") { manageParticipants() } }
                    if (state.roster.isEmpty()) item { Text("Les artistes retenus pour ce programme apparaîtront ici.", color = cageMuted, fontSize = 12.sp) }
                    items(state.roster, key = { "person-" + it }) { id -> CageParticipantCard(state, id) { replacementId = it } }
                }
            }
        }
        Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(8.dp)) {
            Text(state.active?.let { listOfNotNull(state.person(it.a)?.name, state.person(it.b)?.name).joinToString(" · ") } ?: "${state.roster.size} artistes", color = cageMuted, fontSize = 10.sp, maxLines = 1, modifier = Modifier.padding(bottom = 4.dp))
            Text(state.commandHint, color = cageMuted, fontSize = 11.sp, modifier = Modifier.padding(bottom = 6.dp))
            CageAction(state.commandLabel, enabled = state.commandEnabled, primary = true) { state.advance() }
        }
    }
    if (fundraiserOpen) CageFundraiserSheet(state.fundraiser) { fundraiserOpen = false }
    replacementId?.let { original ->
        ModalBottomSheet(onDismissRequest = { replacementId = null }, containerColor = Color(0xFF111216), contentColor = cageInk) {
            Column(Modifier.padding(16.dp)) {
                Text("Remplacer " + state.person(original)?.name, fontSize = 17.sp)
                Text("Artistes prêts en coulisses, hors programme", color = cageMuted, fontSize = 11.sp)
                val candidates = state.guests.guests.filter { it.id !in state.roster && it.location == WaveGuestLocation.BACKSTAGE && it.canParticipate && it.connected }
                LazyColumn(Modifier.heightIn(max = 360.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (candidates.isEmpty()) item { Text("Aucun remplaçant disponible", color = cageMuted, modifier = Modifier.padding(vertical = 16.dp)) }
                    items(candidates, key = { it.id }) { candidate -> Row(Modifier.fillMaxWidth().padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                        CageArtistCompact(state, candidate.id, Modifier.weight(1f), beforeProfile = { replacementId = null })
                        TextButton(onClick = { state.replaceParticipant(original, candidate.id); replacementId = null }) { Text("Choisir", color = WaveMixerTheme.capsuleAccentSoft) }
                    } }
                }
            }
        }
    }
    if (settings) CageSettingsSheet(state, onDismiss = { settings = false }, onReset = { settings = false; reset = true })
    if (state.resultsOpen && state.finished) CageResultsSheet(state)
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
internal fun CageSettingSelect(label: String, value: String, options: Map<String, String>, enabled: Boolean, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        Row(Modifier.fillMaxWidth().hifiBlackSurface(10.dp).clickable(enabled = enabled) { expanded = true }.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(label, color = cageMuted, fontSize = 10.sp)
                Text(options[value].orEmpty(), color = cageInk.copy(alpha = if (enabled) 1f else .5f), fontSize = 12.sp)
            }
            Icon(if (enabled) Icons.Default.ExpandMore else Icons.Default.Lock, null, tint = if (enabled) WaveMixerTheme.capsuleAccentSoft else cageMuted.copy(alpha = .5f), modifier = Modifier.size(if (enabled) 20.dp else 15.dp))
        }
        DropdownMenu(expanded && enabled, { expanded = false }, containerColor = Color(0xFF151519), shape = RoundedCornerShape(12.dp), modifier = Modifier.heightIn(max = 360.dp)) {
            options.forEach { (key, text) -> DropdownMenuItem(text = { Text(text, color = if (key == value) WaveMixerTheme.capsuleAccentSoft else cageInk) }, onClick = { onSelect(key); expanded = false }) }
        }
    }
}
@Composable
private fun CageCard(content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxWidth().hifiBlackSurface(13.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp), content = content)
}
@Composable
internal fun CageAction(label: String, modifier: Modifier = Modifier.fillMaxWidth(), enabled: Boolean = true, primary: Boolean = false, onClick: () -> Unit) {
    Box(modifier.heightIn(min = 42.dp).hifiBlackSurface(9.dp).then(if (primary) Modifier.background(WaveMixerTheme.primaryCta.copy(alpha = .28f), RoundedCornerShape(9.dp)) else Modifier)
        .clickable(enabled = enabled, onClick = onClick).padding(horizontal = 8.dp, vertical = 9.dp), contentAlignment = Alignment.Center) {
        Text(label, color = (if (primary) WaveMixerTheme.capsuleAccentSoft else cageInk).copy(alpha = if (enabled) 1f else .35f), fontSize = 11.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
    }
}
