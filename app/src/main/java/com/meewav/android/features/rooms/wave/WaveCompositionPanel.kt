package com.meewav.android.features.rooms.wave

import android.content.Intent
import android.os.SystemClock
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.animation.animateContentSize
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
import kotlin.math.max

private val soft = WaveMixerTheme.capsuleAccentSoft
private val muted = Color(0xFF9897A5)
private val foreground = Color(0xFFEAE8F0)
private val primary = WaveMixerTheme.primaryCta
private val danger = Color(0xFFC88B90)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveCompositionPanel(state: WaveCompositionState, sheetHeight: Dp) {
    var section by rememberSaveable { mutableIntStateOf(0) }
    var revealed by remember { mutableStateOf<String?>(null) }
    var rejectId by remember { mutableStateOf<String?>(null) }
    var filter by remember { mutableStateOf(WaveProposalStatus.PENDING) }
    var detail by remember { mutableStateOf<String?>(null) }
    var settings by remember { mutableStateOf(false) }
    var importMenu by remember { mutableStateOf(false) }
    var filterMenu by remember { mutableStateOf(false) }
    var duration by remember { mutableIntStateOf(30) }
    var durationMenu by remember { mutableStateOf(false) }
    var selectedVote by remember { mutableStateOf<String?>(null) }
    var replacement by remember { mutableStateOf<String?>(null) }
    var replacementMenu by remember { mutableStateOf(false) }
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
        state.importSelection(uris)
        if (uris.isNotEmpty()) { filter = WaveProposalStatus.PENDING; section = 0 }
    }
    Column(Modifier.fillMaxSize()) {
        WaveMasterPlayer(state, onImport = { importMenu = true }, onSettings = { settings = true })
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
        state.notice?.let { message ->
            Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(message, color = soft, fontSize = 11.sp, modifier = Modifier.weight(1f))
                ToolIcon(Icons.Default.Close, "Fermer le message") { state.notice = null }
            }
        }
        state.snapshot.error?.let { Text(it, color = danger, fontSize = 11.sp) }
        when (section) {
            2 -> {
                val composition = state.clips.filter { it.inComposition }
                if (composition.isEmpty()) EmptyWorkspace("Ta composition commence ici", "Prends une boucle dans Propositions ou importe ton audio.", Modifier.weight(1f))
                else LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(7.dp), contentPadding = PaddingValues(bottom = 8.dp)) {
                    items(composition, key = { it.id }) { clip ->
                        WaveSwipeActions(clip.id, revealed, { revealed = it }, modifier = Modifier.animateItem(), actions = { close ->
                            SwipeAction("Mute", Icons.Default.VolumeOff, clip.mute) { state.mute(clip.id); close() }
                            SwipeAction("Solo", Icons.Default.Headphones, clip.solo) { state.solo(clip.id); close() }
                            SwipeAction("Retirer", Icons.Default.Close) { state.remove(clip.id); close() }
                        }) {
                            WaveLoopCard(clip, state, composition = true, onDetail = { detail = clip.id }, onAction = { state.launch(clip.id) })
                        }
                    }
                }
            }
            0 -> {
                Row(Modifier.fillMaxWidth().height(48.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box {
                        TextButton(onClick = { filterMenu = true }, contentPadding = PaddingValues(horizontal = 4.dp)) {
                            Text("${filter.label}  ${state.clips.count { it.status == filter }}", fontSize = 11.sp, color = foreground)
                            Icon(Icons.Default.ExpandMore, null, modifier = Modifier.size(17.dp), tint = muted)
                        }
                        DropdownMenu(expanded = filterMenu, onDismissRequest = { filterMenu = false }, containerColor = Color(0xFF17181E)) {
                            listOf(WaveProposalStatus.PENDING, WaveProposalStatus.ACCEPTED, WaveProposalStatus.ARCHIVED).forEach {
                                DropdownMenuItem(text = { Text(it.label, color = foreground) }, onClick = { filter = it; filterMenu = false })
                            }
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    TextButton(onClick = state::toggleIntake, contentPadding = PaddingValues(horizontal = 4.dp)) {
                        Text("● ${if (state.open) "Ouvert" else "Fermé"}", fontSize = 11.sp, color = if (state.open) Color(0xFF86B69B) else danger)
                    }
                    ToolIcon(Icons.Default.Add, "Importer une proposition", enabled = !state.importing) { importMenu = true }
                }
                if (state.importing) LinearProgressIndicator(Modifier.fillMaxWidth(), color = soft, trackColor = Color(0xFF23242B))
                val proposals = state.clips.filter { it.status == filter }
                if (proposals.isEmpty()) EmptyWorkspace("Aucune proposition ici", "Les boucles classées apparaîtront dans cette liste.", Modifier.weight(1f))
                else LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(bottom = 10.dp)) {
                    items(proposals, key = { it.id }) { clip ->
                        if (clip.packId != null && proposals.firstOrNull { it.packId == clip.packId }?.id == clip.id) {
                            Row(Modifier.fillMaxWidth().padding(top = 6.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                                Column(Modifier.weight(1f)) {
                                    Text(clip.packTitle ?: "Composition", color = foreground, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text("${state.clips.count { it.packId == clip.packId }} éléments", color = muted, fontSize = 9.sp)
                                }
                                ToolIcon(if (state.snapshot.cue == "pack:${clip.packId}") Icons.Default.Stop else Icons.Default.Headphones,
                                    "Écouter le pack complet", enabled = state.preparingPack != clip.packId) { state.previewPack(clip.packId) }
                                ToolIcon(Icons.Default.LibraryAdd, "Prendre toute la composition", enabled = state.adoptingPack == null) { state.takePack(clip.packId) }
                            }
                        }
                        WaveSwipeActions(clip.id, revealed, { revealed = it }, modifier = Modifier.animateItem(), actions = { close ->
                            SwipeAction("De côté", Icons.Default.Archive) { state.archive(clip.id, "Mise de côté"); close() }
                            SwipeAction("Passer", Icons.Default.Close) { rejectId = clip.id; close() }
                            SwipeAction("Vote", Icons.Default.HowToVote) { state.queueVote(clip.id); close() }
                        }) {
                            WaveLoopCard(clip, state, composition = false, onDetail = { detail = clip.id }, onAction = {
                                if (filter == WaveProposalStatus.ARCHIVED) state.pending(clip.id) else state.add(clip.id)
                            })
                        }
                    }
                }
            }
            else -> {
                val candidates = state.clips.filter { it.status == WaveProposalStatus.VOTE }
                val selected = candidates.find { it.id == (state.vote?.clipId ?: selectedVote) } ?: candidates.firstOrNull()
                Text("Simulation locale · aucun vote public envoyé", color = muted, fontSize = 10.sp, modifier = Modifier.padding(vertical = 8.dp))
                state.lastVerdict?.let { Text(it, color = soft, fontSize = 11.sp, modifier = Modifier.padding(bottom = 8.dp)) }
                if (candidates.isEmpty()) EmptyWorkspace("Aucune boucle au vote", "Ouvre une proposition et choisis « Mettre au vote ».", Modifier.weight(1f))
                else LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(candidates, key = { it.id }) { clip ->
                        Row(Modifier.fillMaxWidth().hifiBlackSurface(13.dp)
                            .border(if (selected?.id == clip.id) 1.dp else 0.dp, if (selected?.id == clip.id) soft.copy(alpha = .5f) else Color.Transparent, RoundedCornerShape(12.dp))
                            .clickable(enabled = state.vote == null) { selectedVote = clip.id; replacement = null }.padding(10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                            WaveArtistPortrait(clip.artist)
                            Column(Modifier.weight(1f)) {
                                Text(clip.title, color = foreground, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text(clip.artist, color = muted, fontSize = 10.sp)
                                WaveRoleChip(clip.category)
                            }
                            WaveRoundPlay(state.snapshot.cue == clip.id, clip.id in state.preparing,
                                if (state.snapshot.cue == clip.id) state.snapshot.cueProgress else 0f, "Écouter ${clip.title}") { state.preview(clip.id) }
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
                        }
                    } ?: Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Box {
                            TextButton(onClick = { durationMenu = true }) { Text("${duration}s ▾", color = muted) }
                            DropdownMenu(durationMenu, { durationMenu = false }, containerColor = Color(0xFF17181E)) {
                                listOf(30, 45, 60).forEach { DropdownMenuItem(text = { Text("$it secondes", color = foreground) }, onClick = { duration = it; durationMenu = false }) }
                            }
                        }
                        Box(Modifier.weight(1f)) {
                            TextButton(onClick = { replacementMenu = true }) { Text(if (replacement == null) "Ajout au Beat ▾" else "Remplacement ▾", fontSize = 11.sp, color = muted) }
                            DropdownMenu(replacementMenu, { replacementMenu = false }, containerColor = Color(0xFF17181E)) {
                                DropdownMenuItem(text = { Text("Ajouter au Beat", color = foreground) }, onClick = { replacement = null; replacementMenu = false })
                                state.clips.filter { it.inComposition && it.category == clip.category }.forEach { target ->
                                    DropdownMenuItem(text = { Text("Remplacer ${target.title}", color = foreground) }, onClick = { replacement = target.id; replacementMenu = false })
                                }
                            }
                        }
                        ToolIcon(Icons.Default.Close, "Retirer du vote") { state.pending(clip.id) }
                    }
                    Button(onClick = { if (state.vote != null) state.finishVote() else state.startVote(clip.id, duration, replacement) },
                        modifier = Modifier.fillMaxWidth().height(42.dp), colors = ButtonDefaults.buttonColors(containerColor = primary, contentColor = Color.White)) {
                        Text(if (state.vote != null) "Clôturer et appliquer" else "Lancer la simulation", fontSize = 12.sp)
                    }
                }
            }
        }
        Row(Modifier.fillMaxWidth().height(24.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(if (state.snapshot.cue != null) "Écoute privée · composition atténuée" else "Atelier privé · non diffusé", color = muted, fontSize = 9.sp, modifier = Modifier.weight(1f))
            if (state.snapshot.cue != null) Text("Arrêter", color = soft, fontSize = 10.sp, modifier = Modifier.clickable { state.stopPreview() }.padding(4.dp))
        }
    }
    val selected = state.clips.find { it.id == detail }
    if (selected != null) {
        var reasonOpen by remember(selected.id) { mutableStateOf(false) }
        var reason by remember(selected.id) { mutableStateOf("") }
        WorkspaceSheet(sheetHeight, onDismiss = { detail = null; state.stopPreview() }) {
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(selected.title, color = foreground, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                Text("${selected.artist} · ${selected.musical}", color = muted, fontSize = 12.sp)
                selected.packId?.let { packId ->
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text(selected.packTitle ?: "Composition", color = muted, fontSize = 11.sp, modifier = Modifier.weight(1f))
                        ToolIcon(Icons.Default.Headphones, "Écouter la composition entière") { state.previewPack(packId) }
                        ToolIcon(Icons.Default.LibraryAdd, "Prendre tous les éléments", enabled = state.adoptingPack == null) { state.takePack(packId) }
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ToolIcon(if (state.snapshot.cue == selected.id) Icons.Default.Stop else Icons.Default.PlayArrow, "Écoute privée") { state.preview(selected.id) }
                    ClipWaveform(state.prepared[selected.id]?.peaks.orEmpty(), if (state.snapshot.cue == selected.id) state.snapshot.cueProgress else 0f, Modifier.weight(1f).height(50.dp), state.snapshot.cue == selected.id)
                }
                state.errors[selected.id]?.let { Text(it, color = danger, fontSize = 11.sp) }
                if (selected.id in state.preparing) LinearProgressIndicator(Modifier.fillMaxWidth(), color = soft, trackColor = Color(0xFF23242B))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    WaveClipKind.entries.forEach { kind -> CompactAction(kind.label, selected.kind == kind) { state.kind(selected.id, kind) } }
                }
                var categoriesOpen by remember { mutableStateOf(false) }
                Box {
                    TextButton(onClick = { categoriesOpen = true }) { Text("${selected.category} ▾", color = soft) }
                    DropdownMenu(categoriesOpen, { categoriesOpen = false }, containerColor = Color(0xFF17181E)) {
                        state.categories.forEach { category -> DropdownMenuItem(text = { Text(category, color = foreground) }, onClick = { state.category(selected.id, category); categoriesOpen = false }) }
                    }
                }
                if (selected.inComposition) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        CompactAction(if (selected.repeats == -1) "Boucle ∞" else "${selected.repeats}×", false) { state.repeat(selected.id) }
                        CompactAction("SOLO", selected.solo) { state.solo(selected.id) }
                        CompactAction("MUTE", selected.mute) { state.mute(selected.id) }
                    }
                    Text("Volume de la piste", color = muted, fontSize = 11.sp)
                    Slider(selected.gain, { state.gain(selected.id, it) }, colors = SliderDefaults.colors(thumbColor = soft, activeTrackColor = primary))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        CompactAction("Monter", false) { state.move(selected.id, -1) }
                        CompactAction("Descendre", false) { state.move(selected.id, 1) }
                        CompactAction("Retirer", false) { state.remove(selected.id); detail = null }
                    }
                } else {
                    Button(onClick = { state.add(selected.id); detail = null; state.stopPreview(); section = 2 }, modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(containerColor = primary, contentColor = Color.White)) { Text("Prendre dans la composition") }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { state.queueVote(selected.id); detail = null; selectedVote = selected.id; section = 1 }) { Text("Mettre au vote", color = soft) }
                        TextButton(onClick = { reasonOpen = !reasonOpen }) { Text("Mettre de côté / Refuser", color = danger, fontSize = 11.sp) }
                    }
                }
                if (reasonOpen) {
                    OutlinedTextField(reason, { reason = it }, label = { Text("Note privée") }, modifier = Modifier.fillMaxWidth(), maxLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = foreground, unfocusedTextColor = foreground, focusedBorderColor = soft))
                    TextButton(onClick = { state.archive(selected.id, reason.ifBlank { "Mise de côté" }); detail = null }) { Text("Classer dans les archives", color = danger) }
                }
                if (selected.note.isNotBlank()) Text(selected.note, color = muted, fontSize = 12.sp)
                Spacer(Modifier.height(12.dp))
            }
        }
    }
    rejectId?.let { id ->
        AlertDialog(onDismissRequest = { rejectId = null }, containerColor = Color(0xFF17181E),
            title = { Text("Passer cette proposition ?", color = foreground) },
            text = { Text("Elle restera disponible dans les archives privées.", color = muted) },
            confirmButton = { TextButton(onClick = { state.archive(id, "Proposition passée"); rejectId = null }) { Text("Passer", color = danger) } },
            dismissButton = { TextButton(onClick = { rejectId = null }) { Text("Annuler", color = soft) } })
    }
    if (importMenu) {
        WorkspaceSheet(sheetHeight.coerceAtMost(260.dp), { importMenu = false }) {
            Text("Ajouter à Propositions", color = foreground, fontSize = 18.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp))
            listOf("Un ou plusieurs sons" to Icons.Default.MusicNote, "Un pack ZIP" to Icons.Default.LibraryMusic, "Un dossier de pistes" to Icons.Default.Folder).forEachIndexed { index, (label, icon) ->
                Row(Modifier.fillMaxWidth().clickable {
                    importMenu = false
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
    if (settings) {
        var bpm by remember { mutableStateOf(state.bpm.toString()) }
        var key by remember { mutableStateOf(state.key) }
        WorkspaceSheet(sheetHeight, { settings = false }) {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Grille musicale", color = foreground, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
                Text("Le tempo règle les départs à la mesure. Il ne modifie pas la vitesse ni la tonalité des fichiers.", color = muted, fontSize = 12.sp)
                OutlinedTextField(bpm, { bpm = it.filter(Char::isDigit).take(3) }, label = { Text("BPM · 40 à 240") }, singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = foreground, unfocusedTextColor = foreground, focusedBorderColor = soft))
                OutlinedTextField(key, { key = it.take(20) }, label = { Text("Tonalité") }, singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = foreground, unfocusedTextColor = foreground, focusedBorderColor = soft))
                Button(onClick = { state.rules(bpm.toInt(), key); settings = false }, enabled = !state.snapshot.running && bpm.toIntOrNull() in 40..240,
                    colors = ButtonDefaults.buttonColors(containerColor = primary, contentColor = Color.White)) { Text("Appliquer") }
                if (state.snapshot.running) Text("Arrête l’horloge pour modifier la grille.", color = soft, fontSize = 12.sp)
            }
        }
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
