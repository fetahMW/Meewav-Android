package com.meewav.android.features.rooms.wave

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.max

@Composable
internal fun WaveMixerDeckPanel(state: WaveMixerDeckState, expanded: Boolean, onExpand: () -> Unit, onPlay: () -> Unit, modifier: Modifier) {
    val context = LocalContext.current
    var target by remember { mutableStateOf("main") }
    var revealed by remember { mutableStateOf<String?>(null) }
    var packMenu by remember { mutableStateOf(false) }
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) {
        runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }; state.import(target, uri)
    } }
    val zip = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) state.importPack(uri, false) }
    val folder = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri -> if (uri != null) {
        runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }; state.importPack(uri, true)
    } }
    LaunchedEffect(expanded) { revealed = null }
    Column(modifier.hifiBlackSurface(14.dp).padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Text(if (state.public) "Public" else "Privé", color = Color(0xFFCBC7D5), fontSize = 11.sp,
                modifier = Modifier.hardwareSurface(6.dp, true, .085f).clickable { state.route() }.padding(8.dp))
            WaveControl(Icons.Default.FileDownload, "Importer la piste principale") { target = state.lanes.first().id; importer.launch(arrayOf("audio/*")) }
            WaveControl(Icons.Default.SkipPrevious, "Précédent", enabled = false) {}
            WaveRoundPlay(state.snapshot.running, state.lanes.any { it.loading }, 0f, "Lecture du mixeur", onClick = onPlay)
            WaveControl(Icons.Default.SkipNext, "Suivant", enabled = false) {}
            WaveControl(Icons.Default.Repeat, "Répéter", state.repeat, onClick = state::toggleLoop)
            WaveControl(if (expanded) Icons.Default.ExpandMore else Icons.Default.Layers, "Déplier ou replier les pistes", expanded, onClick = onExpand)
        }
        if (expanded) LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.lanes, key = { it.id }) { lane ->
                WaveSwipeActions(lane.id, revealed, { revealed = it }, actions = { close ->
                    SwipeAction("Mute", Icons.Default.VolumeOff, lane.muted) { state.mute(lane.id); close() }
                    SwipeAction("Solo", Icons.Default.Headphones, lane.solo) { state.solo(lane.id); close() }
                    SwipeAction("Retirer", Icons.Default.Close) { state.remove(lane.id); close() }
                }) { WaveDeckLaneView(lane, state, { target = lane.id; importer.launch(arrayOf("audio/*")) }) }
            }
        } else state.lanes.firstOrNull()?.let { lane -> WaveDeckLaneView(lane, state, { target = lane.id; importer.launch(arrayOf("audio/*")) }) }
        if (expanded) Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton({ target = state.add(); importer.launch(arrayOf("audio/*")) }, modifier = Modifier.weight(1f)) { Text("+ Piste", fontSize = 11.sp) }
            Box(Modifier.weight(1f)) {
                OutlinedButton({ packMenu = true }, modifier = Modifier.fillMaxWidth()) { Text("Dossier / ZIP", fontSize = 11.sp) }
                DropdownMenu(packMenu, { packMenu = false }) {
                    DropdownMenuItem(text = { Text("Dossier") }, onClick = { packMenu = false; folder.launch(null) })
                    DropdownMenuItem(text = { Text("Archive ZIP") }, onClick = { packMenu = false; zip.launch(arrayOf("application/zip")) })
                }
            }
        }
        state.error?.let { Text(it, color = Color(0xFFC88B90), fontSize = 10.sp) }
    }
}

@Composable
private fun WaveDeckLaneView(lane: WaveDeckLane, state: WaveMixerDeckState, onImport: () -> Unit) {
    Column(Modifier.fillMaxWidth().height(82.dp).hifiBlackSurface(10.dp).padding(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(lane.name, color = Color(0xFFD4D0DA), fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f).clickable(onClick = onImport))
            Text(lane.musical, color = WaveMixerTheme.capsuleAccentSoft, fontSize = 9.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.width(84.dp))
            val seconds = state.snapshot.frame / 48000
            val duration = (lane.pcm?.frames ?: 0) / 48000
            Text("%d:%02d / %d:%02d".format(seconds / 60, seconds % 60, duration / 60, duration % 60),
                color = Color(0xFFAAA7B3), fontSize = 9.sp, fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                maxLines = 1, modifier = Modifier.width(84.dp))
        }
        if (lane.loading) LinearProgressIndicator(Modifier.fillMaxWidth().padding(top = 14.dp), color = WaveMixerTheme.capsuleAccentSoft)
        else Canvas(Modifier.fillMaxWidth().weight(1f).pointerInput(lane.id, lane.pcm) {
            detectTapGestures { if (lane.pcm == null) onImport() else state.seek(it.x / size.width) }
        }.pointerInput(lane.id, lane.pcm) {
            if (lane.pcm != null) detectHorizontalDragGestures { change, _ -> change.consume(); state.seek(change.position.x / size.width) }
        }) {
            val peaks = lane.pcm?.peaks.orEmpty()
            val progress = state.snapshot.frame.toFloat() / state.duration.coerceAtLeast(1)
            peaks.forEachIndexed { index, peak ->
                val x = size.width * index / peaks.size
                val h = max(1f, peak * size.height * .4f)
                drawLine(if (index.toFloat() / peaks.size < progress) WaveMixerTheme.faderViolet else Color(0xFF686670), Offset(x, size.height / 2 - h), Offset(x, size.height / 2 + h), 2f)
            }
        }
    }
}
