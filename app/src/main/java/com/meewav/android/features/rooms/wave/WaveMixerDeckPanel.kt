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
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.max

@OptIn(ExperimentalFoundationApi::class)
@Composable
internal fun WaveMixerDeckPanel(state: WaveMixerDeckState, expanded: Boolean, onExpand: () -> Unit, onPlay: () -> Unit, modifier: Modifier) {
    val context = LocalContext.current
    var target by remember { mutableStateOf("main") }
    var revealed by remember { mutableStateOf<String?>(null) }
    var packMenu by remember { mutableStateOf(false) }
    var page by androidx.compose.runtime.saveable.rememberSaveable { mutableIntStateOf(0) }
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) {
        runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }; state.import(if (target == "new") state.add() else target, uri)
    } }
    val zip = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri -> if (uri != null) state.importPack(uri, false) }
    val folder = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri -> if (uri != null) {
        runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }; state.importPack(uri, true)
    } }
    LaunchedEffect(expanded) { revealed = null; if(page !in 0..2)page=0 }
    Column(modifier.hifiBlackSurface(14.dp).padding(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (!expanded || page == 0 || page == 2) Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            Text(if (state.public) "Public" else "Privé", color = Color(0xFFCBC7D5), fontSize = 11.sp,
                modifier = Modifier.hardwareSurface(6.dp, true, .085f).clickable(enabled = state.allowPublic) { state.route() }.padding(8.dp))
            WaveControl(Icons.Default.FileDownload, "Importer la piste principale") { target = state.lanes.first().id; importer.launch(arrayOf("audio/*")) }
            WaveControl(Icons.Default.SkipPrevious, "Précédent", enabled = false) {}
            WaveRoundPlay(state.snapshot.running || state.tools.pendingStart, state.lanes.any { it.loading }, 0f, "Lecture du mixeur", onClick = onPlay)
            WaveControl(Icons.Default.SkipNext, "Suivant", enabled = false) {}
            WaveControl(Icons.Default.Repeat, "Répéter", state.repeat, onClick = state::toggleLoop)
            WaveControl(if (expanded) Icons.Default.ExpandMore else Icons.Default.Layers, "Déplier ou replier les pistes", expanded, onClick = onExpand)
        }
        if(expanded && page!=0)Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){
            SceneIcon(WaveIcons.ChevronLeft,"Retour aux pistes"){page=0}
            Text(if(page==1)"Pads"else"Chronomètre",Modifier.weight(1f),color=WaveMixerTheme.pearl,fontSize=12.sp)
        }
        if (expanded && page == 1) WaveMixerPads(state.tools, Modifier.weight(1f).fillMaxWidth())
        else if (expanded && page == 2) WaveMixerChrono(state, Modifier.weight(1f).fillMaxWidth())
        else if (expanded) LazyColumn(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(state.lanes, key = { it.id }) { lane ->
                WaveSwipeActions(lane.id, revealed, { revealed = it }, actions = { close ->
                    SwipeAction("Mute", Icons.Default.VolumeOff, lane.muted) { state.mute(lane.id); close() }
                    SwipeAction("Solo", Icons.Default.Headphones, lane.solo) { state.solo(lane.id); close() }
                    SwipeAction("Retirer", Icons.Default.Close) { state.remove(lane.id); close() }
                }) { WaveDeckLaneView(lane, state, { target = lane.id; importer.launch(arrayOf("audio/*")) }) }
            }
            item(key="add-audio") {
                Box(Modifier.fillMaxWidth()) {
                    Box(Modifier.fillMaxWidth().height(64.dp).drawBehind {
                        val inset=.6.dp.toPx()
                        drawRoundRect(color=WaveMixerTheme.capsuleAccentSoft.copy(alpha=.42f),topLeft=Offset(inset,inset),size=androidx.compose.ui.geometry.Size(size.width-2*inset,size.height-2*inset),cornerRadius=CornerRadius(10.dp.toPx()),style=Stroke(width=1.dp.toPx(),pathEffect=PathEffect.dashPathEffect(floatArrayOf(5.dp.toPx(),5.dp.toPx()))))
                    }.combinedClickable(onClickLabel="Importer un son",onLongClickLabel="Importer un dossier ou une archive",onClick={target="new";importer.launch(arrayOf("audio/*"))},onLongClick={packMenu=true}),contentAlignment=Alignment.Center) {
                        Icon(Icons.Default.Add,"Importer un son",tint=WaveMixerTheme.capsuleAccentSoft,modifier=Modifier.size(22.dp))
                    }
                    DropdownMenu(packMenu,{packMenu=false},containerColor=Color(0xFF101114),tonalElevation=0.dp){
                        DropdownMenuItem(text={Text("Dossier",color=Color.White)},onClick={packMenu=false;folder.launch(null)})
                        DropdownMenuItem(text={Text("Archive ZIP",color=Color.White)},onClick={packMenu=false;zip.launch(arrayOf("application/zip"))})
                    }
                }
            }
        } else state.lanes.firstOrNull()?.let { lane -> WaveDeckLaneView(lane, state, { target = lane.id; importer.launch(arrayOf("audio/*")) }) }
        if (expanded) Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Box(Modifier.weight(1f)) { MixerPageButton("Pads", Icons.Default.Apps, page == 1) { page = 1 } }
            Box(Modifier.weight(1f)) { MixerPageButton("Chronomètre", Icons.Default.Timer, page == 2) { page = 2 } }
        }
        state.error?.let { Text(it, color = Color(0xFFC88B90), fontSize = 10.sp) }
    }
}

@Composable
private fun MixerPageButton(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, selected: Boolean, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().height(46.dp).hifiBlackSurface(10.dp).clickable(onClick = onClick),
        horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
        val tint = if (selected) WaveMixerTheme.capsuleAccentSoft else Color(0xFFABA7B4)
        Icon(icon, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(17.dp))
        Spacer(Modifier.width(5.dp))
        Text(label, color = tint, fontSize = 11.sp, maxLines = 1)
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
