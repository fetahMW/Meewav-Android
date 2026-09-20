package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Cage PROGRAM follows the actual stage, not the host plus an arbitrary guest grid. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CageVideoStage(state: CageToolsState, interactive: Boolean, audible: Boolean = true,
    onFullscreen: (() -> Unit)? = null, fullscreen: Boolean = false, fallback: @Composable () -> Unit) {
    var director by remember { mutableStateOf(false) }
    val mode = state.videoMode
    val pair = state.active?.let { listOfNotNull(it.a, it.b) }.orEmpty()
    val stage = state.guests.onStage
    val feeds = if (pair.isNotEmpty()) stage.filter { it.id in pair }.sortedBy { pair.indexOf(it.id) } else stage.take(2)
    val focused = feeds.find { it.id == state.guests.mixerGuestId } ?: feeds.firstOrNull()
    BoxWithConstraints(Modifier.fillMaxSize().background(Color.Black)
        .onGloballyPositioned { if (interactive) state.guests.stageBounds = it.boundsInRoot() }) {
        val shown = if (mode == "Solo" && !fullscreen) listOfNotNull(focused) else feeds
        val portrait = maxHeight > maxWidth
        @Composable fun Feed(id: String, modifier: Modifier) {
            val guest = feeds.first { it.id == id }
            val live = state.microphoneOpen(id)
            Box(modifier.padding(1.dp).clickable { state.guests.mixerGuestId = id }) {
                if (guest.connected && guest.camera) WaveGuestVideo(guest, Modifier.fillMaxSize(), if (audible) state.microphoneGain(id) else 0f, fillFrame = fullscreen)
                else Text("${guest.name} · Signal indisponible", color = Color.White, modifier = Modifier.align(Alignment.Center))
                if (live || state.guests.mixerGuestId == id) Box(Modifier.fillMaxSize().border(1.dp, if (live) Color(0xFFFF5B73) else WaveMixerTheme.capsuleAccentSoft))
                CageVictoryBadge(guest.cageVictories, Modifier.align(Alignment.TopStart).padding(8.dp))
                Text(guest.name + if (state.active?.winner == id) " · Vainqueur" else if (live) " · Micro ouvert" else " · Micro fermé",
                    color = Color.White, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth().background(Color.Black.copy(alpha = .7f)).padding(5.dp))
            }
        }
        Column(Modifier.fillMaxSize()) {
            if (!fullscreen) Row(Modifier.fillMaxWidth().background(Color(0xFF0B0B0E)).padding(horizontal = 8.dp, vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("LA CAGE", color = Color(0xFFFF5B73), fontSize = 9.sp)
                Spacer(Modifier.weight(1f))
                state.voteTick
                val seconds = if (state.voteOpen) state.voteRemaining else (state.remainingMs + 999) / 1000
                Text(if (state.active == null) "Préparation" else "${if (state.voteOpen) "Vote" else state.phase} · %02d:%02d".format(seconds / 60, seconds % 60), color = Color.White, fontSize = 10.sp)
            }
            Box(Modifier.weight(1f)) {
                if (shown.isEmpty()) fallback()
                else if (portrait) Column(Modifier.fillMaxSize()) { shown.forEach { guest -> key(guest.id) { Feed(guest.id, Modifier.fillMaxWidth().weight(if (!fullscreen && mode == "Focus" && guest.id == focused?.id) 2f else 1f)) } } }
                else Row(Modifier.fillMaxSize()) { shown.forEach { guest -> key(guest.id) { Feed(guest.id, Modifier.fillMaxHeight().weight(if (!fullscreen && mode == "Focus" && guest.id == focused?.id) 2f else 1f)) } } }
                if (fullscreen) {
                    state.voteTick
                    val seconds = if (state.voteOpen) state.voteRemaining else (state.remainingMs + 999) / 1000
                    Text("${if (state.voteOpen) "Vote" else state.phase} · ${seconds}s", color = Color.White, fontSize = 11.sp,
                        modifier = Modifier.align(Alignment.TopCenter).padding(8.dp).background(Color.Black.copy(alpha = .65f), CircleShape).padding(horizontal = 10.dp, vertical = 5.dp))
                }
                if (shown.size == 2) Text("VS", color = Color.White, fontSize = 11.sp, modifier = Modifier.align(Alignment.Center).background(Color.Black, CircleShape).padding(5.dp))
                if (state.incident != null || state.phase == "Pause") Text(if (state.incident != null) "Interruption · ${state.incident}" else "Match en pause", color = Color.White,
                    modifier = Modifier.align(Alignment.Center).background(Color.Black.copy(alpha = .85f)).padding(10.dp))
            }
            if (!fullscreen) Row(Modifier.fillMaxWidth().height(32.dp), verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { director = true }, modifier = Modifier.size(32.dp)) { Icon(WaveIcons.More, "Régie vidéo Cage", tint = Color.White) }
                Text(if (state.active?.completed == true) "Verdict · ${state.person(state.active?.winner)?.name}" else if (state.voteOpen) "Vote ouvert · résultats masqués" else if (state.revealed) "A ${state.score("A").toInt()} % · B ${state.score("B").toInt()} %" else "${state.format.title} · $mode", color = Color.White.copy(alpha = .7f), fontSize = 9.sp, maxLines = 1, modifier = Modifier.weight(1f))
                if (onFullscreen != null) IconButton(onClick = onFullscreen, modifier = Modifier.size(32.dp)) { Icon(WaveIcons.Expand, "Plein écran", tint = Color.White, modifier = Modifier.size(17.dp)) }
            }
        }
    }
    if (director) ModalBottomSheet(onDismissRequest = { director = false }, containerColor = Color(0xFF111216)) {
        Column(Modifier.padding(16.dp)) {
            Text("Régie vidéo · La Cage", color = Color.White)
            listOf("Face à face", "Focus", "Solo").forEach { choice -> TextButton(onClick = { state.videoMode = choice; director = false }) { Text(choice, color = if (mode == choice) WaveMixerTheme.capsuleAccentSoft else Color.White) } }
            Text("Touche un artiste dans le retour pour le sélectionner et régler son volume dans le mixeur.", color = Color.Gray, fontSize = 12.sp)
            Row { feeds.forEach { guest -> TextButton(onClick = { state.guests.mixerGuestId = guest.id }) { Text(guest.name, fontSize = 11.sp) } } }
        }
    }
}
