package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.boundsInRoot
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import kotlin.math.roundToInt

@Composable
internal fun Modifier.guestDrag(state: WaveGuestState, guest: WaveGuest, enabled: Boolean = true): Modifier {
    var origin by remember { mutableStateOf(Offset.Zero) }
    val haptic = LocalHapticFeedback.current
    return onGloballyPositioned { origin = it.boundsInRoot().topLeft }
        .pointerInput(guest.id, enabled) {
            if (!enabled) return@pointerInput
            detectDragGestures(
                onDragStart = { state.beginDrag(guest.id, origin + it); haptic.performHapticFeedback(HapticFeedbackType.LongPress) },
                onDragCancel = { state.cancelDrag() },
                onDragEnd = { state.finishDrag() },
            ) { change, delta ->
                change.consume()
                val wasTargeted = state.canDrop
                state.moveDrag(delta)
                if (!wasTargeted && state.canDrop) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
            }
        }
}

/** Ghost belongs to the screen root, so it is never clipped by the lower panel. */
@Composable
internal fun WaveGuestDragOverlay(state: WaveGuestState) {
    val guest = state.dragged ?: return
    val radius = with(LocalDensity.current) { 34.dp.toPx() }
    Image(painterResource(guest.portrait), guest.name,
        modifier = Modifier.offset { IntOffset((state.dragPoint.x - radius).roundToInt(), (state.dragPoint.y - radius).roundToInt()) }
            .size(68.dp).clip(CircleShape)
            .border(2.dp, if (state.canDrop) WaveMixerTheme.capsuleAccentSoft else Color.White.copy(alpha = .4f), CircleShape),
        contentScale = ContentScale.Crop)
}

/** Same iOS layout rule: host alone, duo, host plus two, then a 2x2 stage. */
@Composable
internal fun WaveGuestStage(state: WaveGuestState, interactive: Boolean, host: @Composable () -> Unit) {
    val stage = state.onStage
    BoxWithConstraints(Modifier.fillMaxSize().onGloballyPositioned { state.stageBounds = it.boundsInRoot() }) {
        val cellWidth = if (stage.isEmpty()) maxWidth else (maxWidth - 2.dp) / 2
        val hostHeight = if (stage.size < 3) maxHeight else (maxHeight - 2.dp) / 2
        // The host stays at the same composition position as guests enter and leave.
        Box(Modifier.width(cellWidth).height(hostHeight).align(Alignment.TopStart)) { host() }
        stage.forEachIndexed { index, guest ->
            key(guest.id) {
                val guestHeight = if (stage.size == 1) maxHeight else (maxHeight - 2.dp) / 2
                val x = if (stage.size == 3 && index == 1) 0.dp else cellWidth + 2.dp
                val y = if ((stage.size == 2 && index == 1) || (stage.size == 3 && index > 0)) guestHeight + 2.dp else 0.dp
                GuestStageTile(state, guest, interactive, Modifier.offset(x, y).width(cellWidth).height(guestHeight))
            }
        }
        if (state.overStage && state.dragged?.location == WaveGuestLocation.BACKSTAGE) {
            Box(Modifier.fillMaxSize().background(WaveMixerTheme.capsuleAccent.copy(alpha = .15f))
                .border(2.dp, WaveMixerTheme.capsuleAccentSoft)) {
                Text(if (state.canDrop) "Relâcher pour monter" else "Scène complète · 3 invités maximum",
                    modifier = Modifier.align(Alignment.BottomCenter).background(Color.Black.copy(alpha = .8f)).padding(10.dp),
                    color = Color.White, fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun GuestStageTile(state: WaveGuestState, guest: WaveGuest, interactive: Boolean, modifier: Modifier) {
    Box(modifier.clip(RoundedCornerShape(7.dp)).background(Color(0xFF111216))
        .guestDrag(state, guest, interactive)
        .clickable(enabled = interactive) { state.previewId = guest.id }
        .alpha(if (state.dragId == guest.id) .35f else 1f)) {
        if (guest.camera) Image(painterResource(guest.portrait), null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        else Icon(WaveIcons.CameraOff, "Caméra coupée", tint = Color.White.copy(alpha = .55f), modifier = Modifier.align(Alignment.Center).size(26.dp))
        Text("Aperçu démo", color = Color.White.copy(alpha = .65f), fontSize = 8.sp,
            modifier = Modifier.align(Alignment.TopStart).background(Color.Black.copy(alpha = .65f)).padding(4.dp))
        Row(Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(Color.Black.copy(alpha = .72f)).padding(7.dp),
            verticalAlignment = Alignment.CenterVertically) {
            Text(guest.name, modifier = Modifier.weight(1f), color = Color.White, fontSize = 11.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Icon(if (guest.mic) WaveIcons.Mic else WaveIcons.MicOff, if (guest.mic) "Micro actif" else "Micro coupé",
                tint = if (guest.mic) Color.White else Color(0xFFE99A9E), modifier = Modifier.size(14.dp))
        }
    }
}

@OptIn(ExperimentalFoundationApi::class, ExperimentalMaterial3Api::class)
@Composable
internal fun WaveGuestsPanel(state: WaveGuestState, modifier: Modifier = Modifier) {
    var page by remember { mutableIntStateOf(0) }
    var inviteOpen by remember { mutableStateOf(false) }
    val shown = state.guests.filter { when (page) {
        0 -> it.location == WaveGuestLocation.BACKSTAGE
        1 -> it.location == WaveGuestLocation.INVITED || it.location == WaveGuestLocation.REQUESTED
        else -> it.location == WaveGuestLocation.STAGE
    } }
    val selectedGuests = shown.filter { it.id in state.selected }
    DisposableEffect(Unit) { onDispose { state.cancelDrag(); state.backstageBounds = androidx.compose.ui.geometry.Rect.Zero } }
    Column(modifier.padding(top = 10.dp, bottom = 8.dp)) {
        Row(Modifier.fillMaxWidth().hifiBlackSurface(14.dp).padding(3.dp), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            listOf("Coulisses", "Invitations", "Scène").forEachIndexed { index, title ->
                val count = state.guests.count { when(index) {
                    0 -> it.location == WaveGuestLocation.BACKSTAGE
                    1 -> it.location == WaveGuestLocation.INVITED || it.location == WaveGuestLocation.REQUESTED
                    else -> it.location == WaveGuestLocation.STAGE
                } }
                Box(Modifier.weight(1f).height(42.dp).clip(RoundedCornerShape(11.dp))
                    .then(if (index == page) Modifier.activeCapsule(11.dp) else Modifier)
                    .clickable { page = index; state.selected = emptySet() }, contentAlignment = Alignment.Center) {
                    Text("$title · $count", fontSize = 11.sp, color = Color.White.copy(alpha = if (page == index) 1f else .55f))
                }
            }
        }
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(if (page == 0) "Glisse un invité vers la vidéo" else if (page == 2) "3 invités maximum sur scène" else "Invitations et demandes du public",
                modifier = Modifier.weight(1f), color = Color.White.copy(alpha = .48f), fontSize = 11.sp)
            TextButton(onClick = { inviteOpen = true }) { Text("+ Inviter", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp) }
        }
        Box(Modifier.weight(1f).fillMaxWidth()
            .onGloballyPositioned { state.backstageBounds = it.boundsInRoot() }
            .then(if (state.overBackstage && state.dragged?.location == WaveGuestLocation.STAGE)
                Modifier.border(1.dp, WaveMixerTheme.capsuleAccentSoft, RoundedCornerShape(14.dp)) else Modifier)) {
            if (shown.isEmpty()) Column(Modifier.align(Alignment.Center), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(WaveIcons.Group, null, tint = Color.White.copy(alpha = .3f), modifier = Modifier.size(30.dp))
                Text(if (page == 2) "Personne sur scène" else "Aucun invité ici", color = Color.White.copy(alpha = .6f), fontSize = 13.sp)
            }
            LazyVerticalGrid(columns = GridCells.Fixed(3), modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(bottom = 8.dp)) {
                items(shown, key = { it.id }) { guest ->
                    Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).clip(RoundedCornerShape(12.dp))
                        .border(if (guest.id in state.selected) 1.dp else 0.dp, if (guest.id in state.selected) WaveMixerTheme.capsuleAccentSoft else Color.Transparent, RoundedCornerShape(12.dp))
                        .guestDrag(state, guest, state.selected.isEmpty() && guest.location in listOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE))
                        .combinedClickable(
                            onClick = { if (state.selected.isNotEmpty()) state.selected = if (guest.id in state.selected) state.selected - guest.id else state.selected + guest.id else state.previewId = guest.id },
                            onLongClick = { state.selected = state.selected + guest.id },
                        ).padding(8.dp).alpha(if (state.dragId == guest.id) .3f else 1f),
                        horizontalAlignment = Alignment.CenterHorizontally) {
                        Image(painterResource(guest.portrait), guest.name, modifier = Modifier.fillMaxWidth().aspectRatio(1.35f).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                        Text(guest.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        Text(if (guest.appeared && guest.location == WaveGuestLocation.BACKSTAGE) "Déjà passé" else guest.location.label,
                            color = Color.White.copy(alpha = .45f), fontSize = 8.sp, maxLines = 1)
                    }
                }
            }
        }
        if (selectedGuests.isNotEmpty()) Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = { state.selected = emptySet() }) { Text("Annuler", color = Color.White.copy(alpha = .6f)) }
            Spacer(Modifier.weight(1f))
            val allRequests = selectedGuests.all { it.location == WaveGuestLocation.REQUESTED }
            val sameLocation = selectedGuests.map { it.location }.distinct().size == 1
            val target = if (allRequests) WaveGuestLocation.INVITED else if (page == 0) WaveGuestLocation.STAGE else WaveGuestLocation.BACKSTAGE
            Button(onClick = { state.move(state.selected, target) }, enabled = sameLocation,
                colors = ButtonDefaults.buttonColors(containerColor = WaveMixerTheme.capsuleAccent)) {
                Text(if (!sameLocation) "Sélection mixte" else if (allRequests) "Accepter" else if (page == 0) "Monter (${selectedGuests.size})" else "En coulisses", fontSize = 11.sp)
            }
        }
        Text(state.notice ?: "Invités de démonstration · toucher pour l’aperçu", color = Color.White.copy(alpha = .45f), fontSize = 10.sp,
            modifier = Modifier.padding(top = 5.dp), maxLines = 2)
    }
    val preview = state.guests.find { it.id == state.previewId }
    if (preview != null) GuestPreviewSheet(state, preview)
    if (inviteOpen) {
        ModalBottomSheet(onDismissRequest = { inviteOpen = false }, containerColor = Color(0xFF101114), contentColor = Color.White) {
            Column(Modifier.fillMaxWidth().heightIn(max = 500.dp).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("Inviter un artiste", modifier = Modifier.weight(1f), fontSize = 18.sp)
                    IconButton(onClick = { inviteOpen = false }) { Icon(WaveIcons.Close, "Fermer") }
                }
                val catalog = state.availableInvites
                if (catalog.isEmpty()) Text("Tous les artistes de cette démo sont déjà invités.")
                catalog.forEach { guest ->
                    Row(Modifier.fillMaxWidth().hifiBlackSurface(14.dp).clickable { state.invite(guest); page = 1; inviteOpen = false }.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Image(painterResource(guest.portrait), null, modifier = Modifier.size(40.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                        Text(guest.name, modifier = Modifier.weight(1f))
                        Icon(WaveIcons.Add, "Inviter", tint = WaveMixerTheme.capsuleAccentSoft)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun GuestPreviewSheet(state: WaveGuestState, guest: WaveGuest) {
    var removeRequested by remember(guest.id) { mutableStateOf(false) }
    ModalBottomSheet(onDismissRequest = { state.previewId = null }, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF101114), contentColor = Color.White) {
        Column(Modifier.fillMaxWidth().heightIn(max = 550.dp).verticalScroll(rememberScrollState()).padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) { Text(guest.name, fontSize = 20.sp, fontWeight = FontWeight.SemiBold); Text(guest.location.label, color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp) }
                IconButton(onClick = { state.previewId = null }) { Icon(WaveIcons.Close, "Fermer l’aperçu") }
            }
            Box(Modifier.fillMaxWidth().height(180.dp).clip(RoundedCornerShape(16.dp)).background(Color.Black), contentAlignment = Alignment.Center) {
                if (guest.camera) Image(painterResource(guest.portrait), null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                else Icon(WaveIcons.CameraOff, "Caméra coupée", tint = Color.White.copy(alpha = .5f))
                Text("Aperçu de démonstration", modifier = Modifier.align(Alignment.BottomCenter).background(Color.Black.copy(alpha = .75f)).padding(6.dp), fontSize = 10.sp)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                GuestControl(if (guest.mic) "Micro actif" else "Micro coupé", Modifier.weight(1f), { state.toggleMic(guest.id) }) { Icon(if (guest.mic) WaveIcons.Mic else WaveIcons.MicOff, null, modifier = Modifier.size(18.dp)) }
                GuestControl(if (guest.camera) "Caméra active" else "Caméra coupée", Modifier.weight(1f), { state.toggleCamera(guest.id) }) { Icon(if (guest.camera) Icons.Filled.Videocam else WaveIcons.CameraOff, null, modifier = Modifier.size(18.dp)) }
            }
            val target = when (guest.location) {
                WaveGuestLocation.REQUESTED -> WaveGuestLocation.INVITED
                WaveGuestLocation.INVITED, WaveGuestLocation.STAGE -> WaveGuestLocation.BACKSTAGE
                WaveGuestLocation.BACKSTAGE -> WaveGuestLocation.STAGE
            }
            Button(onClick = { state.move(setOf(guest.id), target); if (state.guests.find { it.id == guest.id }?.location == target) state.previewId = null },
                enabled = target != WaveGuestLocation.STAGE || state.onStage.size < 3,
                modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = WaveMixerTheme.capsuleAccent)) {
                Text(when (guest.location) {
                    WaveGuestLocation.REQUESTED -> "Accepter la candidature"
                    WaveGuestLocation.INVITED -> "Passer en coulisses"
                    WaveGuestLocation.STAGE -> "Redescendre en coulisses"
                    else -> if (state.onStage.size == 3) "Scène complète" else "Faire monter sur scène"
                })
            }
            if (guest.location == WaveGuestLocation.BACKSTAGE) TextButton(onClick = { state.move(setOf(guest.id), WaveGuestLocation.INVITED); state.previewId = null }) { Text("Renvoyer en préparation", color = Color.White.copy(alpha = .6f)) }
            TextButton(onClick = { removeRequested = true }) { Text(if (guest.location == WaveGuestLocation.REQUESTED) "Refuser la candidature" else "Retirer l’invité", color = Color(0xFFE99A9E)) }
        }
    }
    if (removeRequested) AlertDialog(onDismissRequest = { removeRequested = false }, containerColor = Color(0xFF18191E),
        title = { Text("Retirer ${guest.name} ?", color = Color.White) },
        confirmButton = { TextButton(onClick = { state.remove(setOf(guest.id)); removeRequested = false }) { Text("Retirer", color = Color(0xFFE99A9E)) } },
        dismissButton = { TextButton(onClick = { removeRequested = false }) { Text("Annuler", color = Color.White) } })
}

@Composable
private fun GuestControl(label: String, modifier: Modifier, onClick: () -> Unit, icon: @Composable () -> Unit) {
    Row(modifier.hifiBlackSurface(12.dp).clip(RoundedCornerShape(12.dp)).clickable(onClick = onClick).padding(12.dp),
        verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        icon(); Text(label, fontSize = 11.sp)
    }
}
