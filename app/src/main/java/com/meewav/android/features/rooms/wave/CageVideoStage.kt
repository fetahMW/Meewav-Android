package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.zIndex
import kotlin.math.roundToInt
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R

/** Host continuity is independent of the competition roster and its microphone gate. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CageVideoStage(state: CageToolsState, interactive: Boolean, audible: Boolean = true,
    onFullscreen: (() -> Unit)? = null, fullscreen: Boolean = false, hostVolume: Float = .72f) {
    var director by remember { mutableStateOf(false) }
    // Per-screen presentation preference, never a room command broadcast to other viewers.
    var hostX by rememberSaveable(fullscreen) { mutableFloatStateOf(1f) }
    var hostY by rememberSaveable(fullscreen) { mutableFloatStateOf(0f) }
    val host = remember { WaveGuest("cage-host", "HOST", "Host", R.drawable.wave_chat_artist_0,
        WaveGuestLocation.STAGE, demoVideo = "cage-demo/host.mp4", sourceAspectRatio = 16f / 9f) }
    val podium = state.resultsOnStage && state.finished
    val mode = state.videoMode
    val pair = state.active?.let { listOfNotNull(it.a, it.b) }.orEmpty()
    // Battle intermission keeps the winner beside the host until the next duo actually mounts.
    val feeds = when {
        podium -> emptyList()
        state.active?.completed == true && state.format == CageFormat.CHALLENGER ->
            state.guests.onStage.filter { it.id == state.active?.winner }
        state.active?.completed == true -> emptyList()
        else -> state.guests.onStage.let { stage -> if (pair.isNotEmpty()) stage.filter { it.id in pair }.sortedBy { pair.indexOf(it.id) } else stage.take(2) }
    }
    val focused = feeds.find { it.id == state.guests.mixerGuestId } ?: feeds.firstOrNull()
    val shown = if (mode == "Solo" && !fullscreen && feeds.size > 1) listOfNotNull(focused) else feeds
    val hostInset = feeds.size >= 2 || podium
    val hostBesideGuest = feeds.size == 1 && !podium
    Column(Modifier.fillMaxSize().background(Color.Black)
        .onGloballyPositioned { if (interactive) state.guests.stageBounds = it.boundsInRoot() }) {
        if (!fullscreen) Row(Modifier.fillMaxWidth().background(Color(0xFF0B0B0E)).padding(horizontal = 8.dp, vertical = 3.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("LA CAGE", color = Color(0xFFFF5B73), fontSize = 9.sp)
            Spacer(Modifier.weight(1f))
            state.voteTick
            val seconds = if (state.voteOpen) state.voteRemaining else (state.remainingMs + 999) / 1000
            Text(if (state.active == null) "Le host vous accueille" else if (state.active?.completed == true) if (hostBesideGuest) "Le host et le gagnant" else "Le host reprend la parole" else
                (if (state.voteOpen) "Vote" else if (state.awaitingCountdown) "Compte à rebours" else state.phase) + " · %02d:%02d".format(seconds / 60, seconds % 60), color = Color.White, fontSize = 10.sp)
        }
        BoxWithConstraints(Modifier.weight(1f).fillMaxWidth().clipToBounds()) {
            val portrait = maxHeight > maxWidth
            @Composable fun Feed(guest: WaveGuest, modifier: Modifier) {
                val inMatch = state.active?.completed == false && guest.id in pair
                val live = if (inMatch) state.microphoneOpen(guest.id) else guest.mic && guest.connected
                val gain = if (!audible) 0f else if (inMatch) state.microphoneGain(guest.id) else if (live) state.guests.guestGain(guest.id) else 0f
                Box(modifier.padding(1.dp).clickable { state.guests.mixerGuestId = guest.id }) {
                    if (guest.connected && guest.camera) WaveGuestVideo(guest, Modifier.fillMaxSize(), gain, fillFrame = fullscreen)
                    else Text(guest.name + " · Signal indisponible", color = Color.White, modifier = Modifier.align(Alignment.Center))
                    if (live || state.guests.mixerGuestId == guest.id) Box(Modifier.fillMaxSize().border(1.dp, if (live) Color(0xFFFF5B73) else WaveMixerTheme.capsuleAccentSoft))
                    CageVictoryBadge(guest.cageVictories, Modifier.align(Alignment.TopStart).padding(8.dp))
                    Text(guest.name + if (live) " · Micro ouvert" else " · Micro fermé", color = Color.White, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.align(Alignment.BottomStart).fillMaxWidth().background(Color.Black.copy(alpha = .7f)).padding(5.dp))
                }
            }
            if (podium) CageResultsCard(state, Modifier.fillMaxSize().padding(top = if (fullscreen) 84.dp else 62.dp), compact = !fullscreen)
            else if (shown.isNotEmpty()) {
                if (portrait) Column(Modifier.fillMaxSize()) {
                    if (hostBesideGuest) Spacer(Modifier.weight(1f))
                    shown.forEach { guest -> key(guest.id) { Feed(guest, Modifier.fillMaxWidth().weight(if (!fullscreen && mode == "Focus" && guest.id == focused?.id) 2f else 1f)) } }
                } else Row(Modifier.fillMaxSize()) {
                    if (hostBesideGuest) Spacer(Modifier.weight(1f))
                    shown.forEach { guest -> key(guest.id) { Feed(guest, Modifier.fillMaxHeight().weight(if (!fullscreen && mode == "Focus" && guest.id == focused?.id) 2f else 1f)) } }
                }
            }
            // One stable host slot: switching between main view, split and thumbnail does not restart the clip.
            val density = LocalDensity.current
            val insetWidth = minOf(if (fullscreen) 112.dp else 82.dp, maxWidth, maxHeight * (16f / 9f))
            val insetHeight = insetWidth * (9f / 16f)
            val insetMarginX = minOf(8.dp, ((maxWidth - insetWidth) / 2).coerceAtLeast(0.dp))
            val insetMarginY = minOf(8.dp, ((maxHeight - insetHeight) / 2).coerceAtLeast(0.dp))
            val travelX = with(density) { (maxWidth - insetWidth - insetMarginX * 2).coerceAtLeast(0.dp).toPx() }
            val travelY = with(density) { (maxHeight - insetHeight - insetMarginY * 2).coerceAtLeast(0.dp).toPx() }
            val marginX = with(density) { insetMarginX.toPx() }
            val marginY = with(density) { insetMarginY.toPx() }
            val hostModifier = when {
                hostInset -> Modifier.align(Alignment.TopStart).zIndex(2f)
                    .offset { IntOffset((marginX + hostX * travelX).roundToInt(), (marginY + hostY * travelY).roundToInt()) }
                    .size(insetWidth, insetHeight)
                    .pointerInput(travelX, travelY) {
                        detectDragGestures { change, delta ->
                            change.consume()
                            if (travelX > 0f) hostX = (hostX + delta.x / travelX).coerceIn(0f, 1f)
                            if (travelY > 0f) hostY = (hostY + delta.y / travelY).coerceIn(0f, 1f)
                        }
                    }
                hostBesideGuest && portrait -> Modifier.align(Alignment.TopStart).fillMaxWidth().height(maxHeight / 2)
                hostBesideGuest -> Modifier.align(Alignment.TopStart).width(maxWidth / 2).fillMaxHeight()
                else -> Modifier.fillMaxSize()
            }
            Box(hostModifier.clip(RoundedCornerShape(if (hostInset) 10.dp else 0.dp)).background(Color.Black)
                .then(if (hostInset) Modifier.border(.75.dp, WaveMixerTheme.capsuleAccentSoft.copy(alpha = .6f), RoundedCornerShape(10.dp)) else Modifier)
                .clickable { state.guests.mixerGuestId = null }) {
                WaveGuestVideo(host, Modifier.fillMaxSize(), if (audible) hostVolume else 0f)
                Text("HOST", color = WaveMixerTheme.capsuleAccentSoft, fontSize = if (hostInset) 8.sp else 10.sp,
                    modifier = Modifier.align(Alignment.BottomStart).background(Color.Black.copy(alpha = .65f)).padding(horizontal = 6.dp, vertical = 2.dp))
            }
            if (state.fundraiser.visible && state.fundraiser.status != "Brouillon") {
                Text("Cagnotte démo · " + state.fundraiser.collectedEuros + " € / " + state.fundraiser.targetEuros + " €",
                    color = WaveMixerTheme.capsuleAccentSoft, fontSize = if (fullscreen) 11.sp else 9.sp,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp).background(Color.Black.copy(alpha = .8f), CircleShape).padding(horizontal = 10.dp, vertical = 5.dp))
            }
            if (shown.size == 2) Text("VS", color = Color.White, fontSize = 11.sp, modifier = Modifier.align(Alignment.Center).background(Color.Black, CircleShape).padding(5.dp))
            if (fullscreen && feeds.size >= 2) {
                state.voteTick
                val seconds = if (state.voteOpen) state.voteRemaining else (state.remainingMs + 999) / 1000
                Text((if (state.voteOpen) "Vote" else state.phase) + " · " + seconds + "s", color = Color.White, fontSize = 11.sp,
                    modifier = Modifier.align(Alignment.TopStart).padding(8.dp).background(Color.Black.copy(alpha = .65f), CircleShape).padding(horizontal = 10.dp, vertical = 5.dp))
            }
            if (state.incident != null || state.phase == "Pause") Text(if (state.incident != null) "Interruption · " + state.incident else "Match en pause", color = Color.White,
                modifier = Modifier.align(Alignment.Center).background(Color.Black.copy(alpha = .85f)).padding(10.dp))
        }
        if (!fullscreen) Row(Modifier.fillMaxWidth().height(32.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { director = true }, modifier = Modifier.size(32.dp)) { Icon(WaveIcons.More, "Régie vidéo Cage", tint = Color.White) }
            if (podium && interactive) TextButton(onClick = { state.resultsOnStage = false }, contentPadding = PaddingValues(horizontal = 4.dp)) { Text("Masquer le podium", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 10.sp) }
            Text(if (state.active?.completed == true) "Verdict · " + state.person(state.active?.winner)?.name else if (state.voteOpen) "Vote ouvert · résultats masqués" else state.format.title + " · " + mode,
                color = Color.White.copy(alpha = .7f), fontSize = 9.sp, maxLines = 1, modifier = Modifier.weight(1f))
            if (onFullscreen != null) IconButton(onClick = onFullscreen, modifier = Modifier.size(32.dp)) { Icon(WaveIcons.Expand, "Plein écran", tint = Color.White, modifier = Modifier.size(17.dp)) }
        }
    }
    if (director) ModalBottomSheet(onDismissRequest = { director = false }, containerColor = Color(0xFF111216)) {
        Column(Modifier.padding(16.dp)) {
            Text("Régie vidéo · La Cage", color = Color.White)
            listOf("Face à face", "Focus", "Solo").forEach { choice -> TextButton(onClick = { state.videoMode = choice; director = false }) { Text(choice, color = if (mode == choice) WaveMixerTheme.capsuleAccentSoft else Color.White) } }
            Text("Le host revient entre les matchs et reste en miniature pendant les duels.", color = Color.Gray, fontSize = 12.sp)
            Row {
                TextButton(onClick = { state.guests.mixerGuestId = null }) { Text("Host", fontSize = 11.sp) }
                feeds.forEach { guest -> TextButton(onClick = { state.guests.mixerGuestId = guest.id }) { Text(guest.name, fontSize = 11.sp) } }
            }
        }
    }
}
