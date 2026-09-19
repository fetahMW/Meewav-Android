package com.meewav.android.features.rooms.wave

import android.content.Intent
import android.os.SystemClock
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.semantics.clearAndSetSemantics
import kotlin.math.max

private val soft = WaveMixerTheme.capsuleAccentSoft
private val muted = Color(0xFF9897A5)
private val foreground = Color(0xFFEAE8F0)
private val primary = WaveMixerTheme.primaryCta
private val danger = Color(0xFFC88B90)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
internal fun WaveCompositionPanel(state: WaveCompositionState, sheetHeight: Dp, onProfile: (String) -> Unit) {
    var section by rememberSaveable { mutableIntStateOf(0) }
    var revealed by remember { mutableStateOf<String?>(null) }
    var filter by remember { mutableStateOf(WaveProposalStatus.PENDING) }
    var messageArtist by remember { mutableStateOf<String?>(null) }
    var settings by remember { mutableStateOf(false) }
    var importMenu by remember { mutableStateOf(false) }
    var importDestination by remember { mutableStateOf(WaveImportDestination.PROPOSALS) }
    var filterMenu by remember { mutableStateOf(false) }
    var duration by remember { mutableIntStateOf(30) }
    var durationMenu by remember { mutableStateOf(false) }
    var selectedVote by remember { mutableStateOf<String?>(null) }


    var duelId by remember { mutableStateOf<String?>(null) }
    var duelTarget by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val folderImporter = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        if (uri != null) {
            runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            state.importFolder(uri); filter = WaveProposalStatus.PENDING; section = 0
        }
    }
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        uris.forEach { uri ->
            runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
        }
        state.importSelection(uris, importDestination)
        if (uris.isNotEmpty() && importDestination != WaveImportDestination.BASE) {
            filter = WaveProposalStatus.PENDING
            section = if (importDestination == WaveImportDestination.VOTE) 1 else 0
        }
    }
    LaunchedEffect(section) { state.navigatePage(section); settings = false; revealed = null }
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().height(42.dp), verticalAlignment = Alignment.CenterVertically) {
            listOf("Propositions", "Vote", "Composition").forEachIndexed { index, label ->
                Column(Modifier.weight(1f).fillMaxHeight().clickable {
                    section = index; revealed = null; state.stopPreview()
                }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    Text(label, color = if (section == index) foreground else muted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(6.dp))
                    Box(Modifier.width(34.dp).height(2.dp).background(if (section == index) Brush.horizontalGradient(listOf(Color.Transparent, soft, Color.Transparent)) else Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent))))
                }
            }
        }
        WaveMasterPlayer(state, onImport = { destination ->
            importDestination = destination
            importer.launch(arrayOf("audio/*"))
        }, onSettings = { settings = true })
        state.notice?.let { message ->
            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(message, color = soft, fontSize = 11.sp, modifier = Modifier.weight(1f))
                ToolIcon(Icons.Default.Close, "Fermer le message") { state.notice = null }
            }
        }
        state.snapshot.error?.let { Text(it, color = danger, fontSize = 11.sp) }
        Box(Modifier.weight(1f).fillMaxWidth()) {
        Column(Modifier.fillMaxSize().then(if (settings) Modifier.clearAndSetSemantics { } else Modifier)) {
        when (section) {
            2 -> {
                val composition = state.clips.filter { it.inComposition }
                if (composition.isEmpty()) EmptyWorkspace("Ta composition commence ici", "Prends une boucle dans Propositions ou importe ton audio.", Modifier.weight(1f))
                else LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp), contentPadding = PaddingValues(bottom = 8.dp)) {
                    items(composition, key = { it.id }) { clip ->
                            WaveLoopCard(clip, state, composition = true, onProfile = { onProfile(clip.artist) })

                    }
                }
            }
            0 -> {
                Row(Modifier.fillMaxWidth().height(48.dp), verticalAlignment = Alignment.CenterVertically) {
                    WaveIntakeChip(state.intakeOpen, state::toggleIntake)
                    Text("← Supprimer · Vote →", color = muted, fontSize = 10.sp, maxLines = 2,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                        modifier = Modifier.weight(1f).padding(horizontal = 4.dp))
                    ToolIcon(Icons.Default.Tune, "Filtrer les boucles") { filterMenu = !filterMenu }
                    ToolIcon(Icons.Default.Add, "Importer une proposition", enabled = !state.importing) { importMenu = true }
                }
                AnimatedVisibility(filterMenu) {
                    Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        (state.categories + listOf("Tout", "Aucun")).chunked(3).forEach { row ->
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                row.forEach { category ->
                                    val active = when (category) {
                                        "Tout" -> state.acceptedCategories.containsAll(state.categories)
                                        "Aucun" -> state.acceptedCategories.isEmpty()
                                        else -> category in state.acceptedCategories
                                    }
                                    Box(Modifier.weight(1f).height(44.dp).clickable {
                                        val next = when (category) {
                                            "Tout" -> state.categories.toSet()
                                            "Aucun" -> emptySet()
                                            else -> if (active) state.acceptedCategories - category else state.acceptedCategories + category
                                        }
                                        state.submissionRules(next, state.requestedBars, state.editorialDirection)
                                    }, contentAlignment = Alignment.Center) {
                                        WaveRoleChip(category, expanded = true, active = active)
                                    }
                                }
                            }
                        }
                    }
                }
                if (state.importing) LinearProgressIndicator(Modifier.fillMaxWidth(), color = soft, trackColor = Color(0xFF23242B))
                val proposals = state.proposals(WaveProposalStatus.PENDING).filter { it.category in state.acceptedCategories }
                if (proposals.isEmpty()) EmptyWorkspace("Aucune proposition ici", "Les boucles classées apparaîtront dans cette liste.", Modifier.weight(1f))
                else LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(7.dp), contentPadding = PaddingValues(bottom = 10.dp)) {
                    items(proposals, key = { it.id }) { clip ->
                        if (clip.packId != null && proposals.firstOrNull { it.packId == clip.packId }?.id == clip.id) {
                            Row(Modifier.fillMaxWidth().padding(top = 2.dp, bottom = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(clip.packTitle ?: "Composition", color = foreground, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text("${state.clips.count { it.packId == clip.packId }} éléments", color = muted, fontSize = 9.sp)
                                }
                                ToolIcon(if (state.snapshot.cue == "pack:${clip.packId}") Icons.Default.Stop else Icons.Default.Headphones,
                                    "Écouter le pack complet", enabled = state.preparingPack != clip.packId) { state.previewPack(clip.packId) }
                                ToolIcon(Icons.Default.LibraryAdd, "Proposer les pistes au vote", enabled = state.adoptingPack == null) { state.takePack(clip.packId) }
                            }
                        }
                        WaveProposalSwipe(clip.id, revealed, { revealed = it }, onAccept = { state.queueVote(clip.id) },
                            onReject = { state.archive(clip.id, it) }) {
                            WaveLoopCard(clip, state, composition = false, onMessage = { messageArtist = clip.artist }, onProfile = { onProfile(clip.artist) })
                        }
                    }
                }
            }
            else -> {
                val candidates = state.clips.filter { it.status == WaveProposalStatus.VOTE }
                val selected = candidates.find { it.id == (state.vote?.clipId ?: selectedVote) }
                Text("Simulation locale · aucun vote public envoyé", color = muted, fontSize = 10.sp, modifier = Modifier.padding(vertical = 8.dp))
                state.lastVerdict?.let { Text(it, color = soft, fontSize = 11.sp, modifier = Modifier.padding(bottom = 8.dp)) }
                if (candidates.isEmpty()) EmptyWorkspace("Aucune boucle au vote", "Ouvre une proposition et choisis « Mettre au vote ».", Modifier.weight(1f))
                else LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(candidates, key = { it.id }) { clip ->
                        Column(Modifier.fillMaxWidth().hifiBlackSurface(13.dp)
                            .border(if (selected?.id == clip.id) 1.dp else 0.dp, if (selected?.id == clip.id) soft.copy(alpha = .5f) else Color.Transparent, RoundedCornerShape(12.dp))
                            .clickable(enabled = state.vote == null) { selectedVote = if (selectedVote == clip.id) null else clip.id }.padding(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                            Box(Modifier.clickable { onProfile(clip.artist) }) { WaveArtistPortrait(clip.artist) }
                            Column(Modifier.weight(1f)) {
                                Text(clip.title, color = foreground, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(clip.artist, color = muted, fontSize = 10.sp)
                            }
                            WaveRoleChip(clip.category)
                            TextButton(onClick = { state.startVote(clip.id, duration, null) }, enabled = state.vote == null && clip.id !in state.preparing, contentPadding = PaddingValues(horizontal = 6.dp), modifier = Modifier.height(36.dp)) { Text("Vote", color = soft, fontSize = 11.sp) }
                            WaveRoundPlay((state.snapshot.cue == clip.id && !state.snapshot.cuePaused) || (state.snapshot.candidate == clip.id && state.snapshot.running), clip.id in state.preparing,
                                if (state.snapshot.cue == clip.id) state.snapshot.cueProgress else if (state.snapshot.candidate == clip.id) state.snapshot.candidateProgress else 0f,
                                "Écouter ${clip.title}", queued = state.snapshot.pendingCandidate == clip.id) { state.preview(clip.id) }
                            }
                            AnimatedVisibility(selected?.id == clip.id) {
                                WaveVoteControls(clip, state, duration, onDuration = { duration = it },
                                    onLaunch = { state.startVote(clip.id, duration, null) }, onMessage = { messageArtist = clip.artist },
                                    onDuel = { duelId = clip.id; duelTarget = null })
                            }
                        }
                    }
                }
                selected?.let { clip ->
                    state.vote?.let { poll ->
                        val seconds = state.voteSecondsRemaining
                        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${seconds}s", color = soft, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                            TextButton(onClick = { state.demoBallot(true) }) { Text("Pour  ${poll.yes}", color = Color(0xFF86B69B)) }
                            TextButton(onClick = { state.demoBallot(false) }) { Text("Contre  ${poll.no}", color = danger) }
                            ToolIcon(Icons.Default.Check, "Clôturer la simulation", onClick = state::finishVote)
                        }
                    } ?: Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        ToolIcon(Icons.Default.Close, "Retirer du vote") { state.pending(clip.id) }
                    }
                }
            }
        }
        }
        if (settings) {
            Box(Modifier.matchParentSize().background(Color.Black.copy(alpha = .55f)).clickable { settings = false })
            Column(Modifier.align(Alignment.TopCenter).fillMaxWidth().hifiBlackSurface(14.dp)) {
                WaveRulesPanel(state) { settings = false }
            }
        }
        }
        Row(Modifier.fillMaxWidth().height(24.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(if (state.snapshot.cue != null) "Écoute privée · composition atténuée" else if (state.publicRoute) "Sortie publique · diffusion non raccordée" else "Atelier privé · non diffusé", color = muted, fontSize = 9.sp, modifier = Modifier.weight(1f))
            if (state.snapshot.cue != null) Text("Arrêter", color = soft, fontSize = 10.sp, modifier = Modifier.clickable { state.stopPreview() }.padding(4.dp))
        }
    }
    messageArtist?.let { artist ->
        var draft by remember(artist) { mutableStateOf("") }
        androidx.compose.ui.window.Dialog(onDismissRequest = { messageArtist = null },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
            Surface(Modifier.fillMaxSize().systemBarsPadding(), color = Color(0xFF08090D)) {
            Column(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                TextButton(onClick = { messageArtist = null }) { Text("‹ Retour à la Wave", color = soft) }
                Text(artist, color = foreground, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                Text("Message privé · Démonstration locale", color = muted, fontSize = 10.sp)
                LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.privateMessages[artist].orEmpty()) { message ->
                        Text(message, color = foreground, fontSize = 13.sp, modifier = Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(12.dp))
                    }
                }
                Row(Modifier.imePadding().padding(bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(draft, { draft = it.take(2000) }, placeholder = { Text("Message…") }, modifier = Modifier.weight(1f), maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = foreground, unfocusedTextColor = foreground, focusedBorderColor = soft))
                    ToolIcon(Icons.Default.Send, "Envoyer", enabled = draft.isNotBlank()) { state.message(artist, draft); draft = "" }
                }
            }
            }
        }
    }
    if (importMenu) {
        WorkspaceSheet(sheetHeight.coerceAtMost(260.dp), { importMenu = false }) {
            Text("Ajouter à Propositions", color = foreground, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp))
            listOf("Un ou plusieurs sons" to Icons.Default.MusicNote, "Un pack ZIP" to Icons.Default.LibraryMusic, "Un dossier de pistes" to Icons.Default.Folder).forEachIndexed { index, (label, icon) ->
                Row(Modifier.fillMaxWidth().clickable {
                    importMenu = false
                    importDestination = WaveImportDestination.PROPOSALS
                    when (index) {
                        0 -> importer.launch(arrayOf("audio/*"))
                        1 -> importer.launch(arrayOf("application/zip", "application/x-zip-compressed"))
                        else -> folderImporter.launch(null)
                    }
                }.padding(horizontal = 20.dp, vertical = 13.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                    Icon(icon, null, tint = soft, modifier = Modifier.size(21.dp))
                    Text(label, color = foreground, fontSize = 13.sp)
                }
            }
        }
    }

    if (state.followVote) WorkspaceSheet(sheetHeight.coerceAtMost(320.dp), { state.followVote = false }) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Suivi du vote", color = foreground, fontSize = 18.sp)
            val round = state.vote
            if (round != null) {
                val proposed = state.clips.find { it.id == round.clipId }
                val incumbent = state.clips.find { it.id == round.replacementId }
                Text(proposed?.title ?: "Proposition", color = foreground)
                if (incumbent != null) Text("Face à ${incumbent.title} · ${incumbent.artist}", color = muted)
                Text("${state.voteSecondsRemaining} s · ${round.yes} pour · ${round.no} contre", color = soft)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { state.demoBallot(true) }) { Text(if (incumbent != null) "Remplacer" else "Pour") }
                    OutlinedButton(onClick = { state.demoBallot(false) }) { Text(if (incumbent != null) "Conserver" else "Contre") }
                }
                Text("60 % d’approbation · un bulletin par participant", color = muted, fontSize = 12.sp)
            } else Text(state.lastVerdict ?: "Vote terminé", color = soft)
            TextButton(onClick = { state.followVote = false }) { Text("Fermer le suivi", color = soft) }
        }
    }
    duelId?.let { id ->
        val proposed = state.clips.find { it.id == id }
        val choices = state.clips.filter { it.inComposition && !it.isBase && it.id != id }
        AlertDialog(onDismissRequest = { duelId = null }, containerColor = Color(0xFF111217),
            title = { Text("Duel de remplacement", color = foreground) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text("${proposed?.title ?: "Cette proposition"} face à une boucle de Composition. La boucle actuelle reste en place jusqu’au résultat.", color = muted)
                    if (choices.isEmpty()) Text("Aucune boucle validée à défier pour le moment.", color = soft)
                    else LazyColumn(Modifier.heightIn(max = 280.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        items(choices, key = { it.id }) { target ->
                            Row(Modifier.fillMaxWidth().hifiBlackSurface(10.dp).clickable { duelTarget = target.id }.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                                RadioButton(duelTarget == target.id, { duelTarget = target.id }, colors = RadioButtonDefaults.colors(selectedColor = soft))
                                Column(Modifier.weight(1f)) {
                                    Text(target.title, color = foreground, maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 12.sp)
                                    Text(target.artist, color = muted, fontSize = 10.sp)
                                }
                                Box(Modifier.width(76.dp), contentAlignment = Alignment.CenterStart) { WaveRoleChip(target.category) }
                            }
                        }
                    }
                    Text("Vote local de démonstration · $duration secondes", color = muted, fontSize = 11.sp)
                }
            },
            confirmButton = { TextButton(onClick = {
                duelTarget?.let { state.startVote(id, duration, it, demonstration = false) }; duelId = null
            }, enabled = proposed != null && choices.any { it.id == duelTarget } && state.vote == null) { Text("Lancer le duel", color = soft) } },
            dismissButton = { TextButton(onClick = { duelId = null }) { Text("Annuler", color = muted) } })
    }
}

@Composable
private fun ClipWaveform(peaks: List<Float>, progress: Float, modifier: Modifier, active: Boolean = false) {
    Canvas(modifier) {
        if (peaks.isEmpty()) { drawLine(Color(0xFF373740), Offset(0f, size.height / 2), Offset(size.width, size.height / 2), 1f); return@Canvas }
        val step = size.width / peaks.size
        peaks.forEachIndexed { index, peak ->
            val amplitude = max(1f, peak * size.height * .44f)
            drawLine(if (active && index.toFloat() / peaks.size <= progress) soft else Color(0xFF616071),
                Offset(index * step, size.height / 2 - amplitude), Offset(index * step, size.height / 2 + amplitude), max(1f, step * .4f), StrokeCap.Round)
        }
        repeat(9) { bar -> drawLine(Color.White.copy(alpha = .10f), Offset(size.width * bar / 8, 0f), Offset(size.width * bar / 8, size.height), 1f) }
    }
}

@Composable
private fun ToolIcon(icon: ImageVector, label: String, active: Boolean = false, enabled: Boolean = true, onClick: () -> Unit) {
    WaveControl(icon, label, active, enabled, onClick)
}

@Composable
private fun CompactAction(label: String, active: Boolean, onClick: () -> Unit) {
    Box(Modifier.height(32.dp).clip(RoundedCornerShape(8.dp)).background(if (active) primary.copy(alpha = .38f) else Color(0xFF15161B))
        .border(.5.dp, if (active) soft.copy(alpha = .5f) else Color(0xFF34343F), RoundedCornerShape(8.dp)).waveTactileClick(onClick).padding(horizontal = 10.dp), contentAlignment = Alignment.Center) {
        Text(label, color = if (active) soft else foreground, fontSize = 10.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun EmptyWorkspace(title: String, description: String, modifier: Modifier) {
    Column(modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.GraphicEq, null, tint = soft, modifier = Modifier.size(28.dp)); Spacer(Modifier.height(12.dp))
        Text(title, color = foreground, fontSize = 15.sp); Spacer(Modifier.height(8.dp))
        Text(description, color = muted, fontSize = 12.sp)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun WorkspaceSheet(height: Dp, onDismiss: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF08090D), contentColor = foreground, dragHandle = null, shape = RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp)) {
        Column(Modifier.fillMaxWidth().height(height).border(.75.dp, Color(0xFF4D465E), RoundedCornerShape(topStart = 26.dp, topEnd = 26.dp))
            .background(Brush.verticalGradient(listOf(Color(0xFF22232B), Color(0xFF08090D)), endY = 220f))) {
            Box(Modifier.fillMaxWidth().height(42.dp), contentAlignment = Alignment.Center) {
                Box(Modifier.size(42.dp, 4.dp).clip(RoundedCornerShape(4.dp)).background(muted.copy(alpha = .6f)))
                IconButton(onClick = onDismiss, modifier = Modifier.align(Alignment.CenterEnd)) { Icon(Icons.Default.Close, "Fermer", tint = soft.copy(alpha = .72f)) }
            }
            content()
        }
    }
}
