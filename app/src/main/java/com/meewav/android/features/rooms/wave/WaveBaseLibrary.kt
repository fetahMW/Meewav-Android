package com.meewav.android.features.rooms.wave

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
@OptIn(ExperimentalMaterial3Api::class)
internal fun WaveBaseLibrary(state: WaveCompositionState, onImport: () -> Unit, onClose: () -> Unit) {
    val versions = state.clips.filter { it.isBase && it.status != WaveProposalStatus.VOTE }.asReversed()
    val pager = rememberPagerState { versions.size }
    var sharingId by remember { mutableStateOf<String?>(null) }
    var returning by remember { mutableStateOf<WaveDawExport?>(null) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val importReturn = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) {
        runCatching { context.contentResolver.takePersistableUriPermission(uri, android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION) }
        returning?.let { state.reviewDaw(uri, it) }
    } }
    val saveBase = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("audio/wav")) { uri -> if (uri != null) state.export(uri, focusedBase = sharingId) }
    val saveMix = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("audio/wav")) { uri -> if (uri != null) state.export(uri) }
    val saveArchive = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/zip")) { uri -> if (uri != null) state.export(uri, archive = true) }
    Column(Modifier.fillMaxWidth().heightIn(max = 220.dp).verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (versions.isEmpty()) TextButton(onClick = onImport) { Text("Importer une base", color = WaveMixerTheme.capsuleAccentSoft) }
        else HorizontalPager(pager, contentPadding = PaddingValues(horizontal = 18.dp), pageSpacing = 4.dp, modifier = Modifier.height(68.dp)) { index ->
            val base = versions[index]
            Column(Modifier.fillMaxSize().hifiBlackSurface(10.dp).clickable(enabled = state.vote == null && state.preparing.isEmpty()) {
                state.activateReference(base.id); onClose()
            }.padding(10.dp), verticalArrangement = Arrangement.Center) {
                Text(base.title, color = Color(0xFFEAE8F0), fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(if (base.id == state.referenceId) "Base active" else "${base.artist} · ${base.musical}", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 10.sp, maxLines = 1)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = { versions.getOrNull(pager.currentPage)?.let { sharingId = it.id; saveBase.launch("${it.title}.wav") } },
                enabled = versions.isNotEmpty() && state.exportProgress == null, modifier = Modifier.weight(1f).height(40.dp)) { Text("Partager", fontSize = 11.sp) }
            OutlinedButton(onClick = { saveMix.launch("Meewav-arrangement.wav") }, enabled = state.referenceReady && state.exportProgress == null,
                modifier = Modifier.weight(1f).height(40.dp)) { Text("Exporter", fontSize = 11.sp) }
        }
        state.exportProgress?.let { progress ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                LinearProgressIndicator(progress = { progress }, modifier = Modifier.weight(1f), color = WaveMixerTheme.capsuleAccentSoft)
                Text("${(progress * 100).toInt()} %", color = Color.White, fontSize = 10.sp, modifier = Modifier.padding(horizontal = 6.dp))
                TextButton(onClick = state::cancelExport) { Text("Annuler") }
            }
        }
        state.clips.filter { !it.isBase && !it.inComposition && it.status == WaveProposalStatus.ACCEPTED }.forEach { clip ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("${clip.artist} · ${clip.title}", color = Color(0xFFB9B6C2), fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                TextButton(onClick = { state.add(clip.id); state.selectMix(clip.id) }) { Text("+ Restaurer") }
            }
        }
        Row {
            TextButton(onClick = onImport, modifier = Modifier.weight(1f)) { Text("Nouvelle base", fontSize = 11.sp) }
            TextButton(onClick = { saveArchive.launch("Meewav-pistes-et-credits.zip") }, enabled = state.referenceReady && state.exportProgress == null,
                modifier = Modifier.weight(1f)) { Text("Archive DAW", fontSize = 11.sp) }
        }
        state.dawExports.asReversed().forEach { archive ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("${archive.title} · ${archive.sources.size} pistes", color = Color(0xFFB9B6C2), fontSize = 10.sp, maxLines = 1,
                    overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                TextButton(onClick = { returning = archive; importReturn.launch(arrayOf("audio/*")) }) { Text("Réimport", fontSize = 10.sp) }
                TextButton(onClick = {
                    val intent = android.content.Intent(android.content.Intent.ACTION_SEND).setType("application/zip")
                        .putExtra(android.content.Intent.EXTRA_STREAM, android.net.Uri.parse(archive.uri)).addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    runCatching { context.startActivity(android.content.Intent.createChooser(intent, "Archive DAW")) }
                }) { Text("Partager", fontSize = 10.sp) }
            }
        }
    }
    state.dawDraft?.let { draft ->
        var credits by remember(draft) { mutableStateOf(draft.export.sources.associateWith { "Conservée" }) }
        var propose by remember(draft) { mutableStateOf(false) }
        val sheet = rememberModalBottomSheetState(skipPartiallyExpanded = true, confirmValueChange = { !state.dawImporting })
        ModalBottomSheet(onDismissRequest = state::cancelDaw, sheetState = sheet, containerColor = Color(0xFF101116)) {
            Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Retour DAW · contributions", color = Color.White)
                draft.export.sources.forEach { id ->
                    val clip = state.clips.find { it.id == id }
                    Text("${clip?.artist ?: "Artiste"} · ${clip?.title ?: id}", color = Color(0xFFD4D0DA), fontSize = 12.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        listOf("Conservée", "Retravaillée", "Retirée").forEach { value -> FilterChip(credits[id] == value,
                            { credits = credits + (id to value) }, enabled = !state.dawImporting, label = { Text(value, fontSize = 10.sp) }) }
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(propose, { propose = it }, enabled = !state.dawImporting)
                    Text("Proposer cette version au vote", color = Color.White, fontSize = 12.sp)
                }
                state.dawError?.let { Text(it, color = Color(0xFFC88B90)) }
                if (state.dawImporting) LinearProgressIndicator(Modifier.fillMaxWidth())
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(state::cancelDaw, enabled = !state.dawImporting, modifier = Modifier.weight(1f)) { Text("Annuler") }
                    Button({ state.acceptDaw(credits, propose) }, enabled = !state.dawImporting,
                        colors = ButtonDefaults.buttonColors(containerColor = WaveMixerTheme.primaryCta), modifier = Modifier.weight(1f)) { Text("Valider") }
                }
            }
        }
    }
}
