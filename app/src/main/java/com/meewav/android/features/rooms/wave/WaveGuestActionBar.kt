package com.meewav.android.features.rooms.wave

import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.util.UUID
import android.content.Intent
import android.net.Uri
import com.meewav.android.features.messaging.MessagingActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveGuestActionBar(state: WaveGuestState, guests: List<WaveGuest>, page: Int, onClear: () -> Unit) {
    val ids = guests.map { it.id }.toSet()
    val enabled = guests.isNotEmpty()
    Column(Modifier.fillMaxWidth().padding(top = 6.dp).hifiBlackSurface(14.dp).padding(horizontal = 6.dp, vertical = 4.dp)) {
        Row(Modifier.fillMaxWidth()) {
            GuestAction("Message", WaveIcons.Envelope, enabled, Modifier.weight(1f)) { state.classroomQuickMessage = false; state.messageRecipientIds = ids }
            GuestAction("Aperçu", WaveIcons.Eye, guests.size == 1, Modifier.weight(1f)) { state.previewId = guests.single().id }
            if (page == 0) {
                GuestAction("Scène", Icons.Filled.ArrowUpward, enabled && guests.all { it.connected && it.canParticipate } && state.onStage.size + guests.size <= 3, Modifier.weight(1f)) {
                    state.move(ids, WaveGuestLocation.STAGE); onClear()
                }
            } else GuestAction("Coulisses", if (page == 1) Icons.Filled.ArrowUpward else Icons.Filled.ArrowDownward, enabled && guests.all { it.canParticipate }, Modifier.weight(1f)) {
                state.move(ids, WaveGuestLocation.BACKSTAGE); onClear()
            }
            if (page != 3) GuestAction("Jury", Icons.Filled.ArrowUpward,
                enabled && guests.all { it.canParticipate } && state.jury.size + guests.size <= 6, Modifier.weight(1f)) {
                state.move(ids, WaveGuestLocation.JURY); onClear()
            }
            GuestAction(if (page == 1) "Refuser" else "Retirer", WaveIcons.Close, enabled, Modifier.weight(1f), tint = Color(0xFFE99A9E)) {
                if (page == 1) state.refuseRequests(ids) else state.remove(ids)
                onClear()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveGuestMessageSheet(state: WaveGuestState, liveRoomId: String? = null) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var busy by remember { mutableStateOf(false) }
    var failure by remember { mutableStateOf<String?>(null) }
    var requestId by remember { mutableStateOf(UUID.randomUUID().toString()) }
    val quick = state.classroomQuickMessage
    LaunchedEffect(state.messageRecipientIds, quick) {
        if (!quick && state.messageRecipientIds.size == 1) {
            val id = state.messageRecipientIds.first()
            val real = runCatching { UUID.fromString(id) }.isSuccess && liveRoomId != null
            val route = Uri.Builder().path("/messages").appendQueryParameter("space", "messages")
                .appendQueryParameter("intent", "message").appendQueryParameter("source", "rooms")
                .appendQueryParameter("mode", if (real) "real" else "demo")
                .appendQueryParameter(if (real) "profileId" else "mockArtistId", id).build().toString()
            context.startActivity(Intent(context, MessagingActivity::class.java).putExtra("route", route).putExtra("preview", !real))
            state.messageRecipientIds = emptySet()
        }
    }
    val messageRecipients = state.guests.filter { it.id in state.messageRecipientIds }
    var draft by remember { mutableStateOf("") }
    LaunchedEffect(state.messageRecipientIds) { if (state.messageRecipientIds.isEmpty()) state.classroomQuickMessage = false; draft = ""; failure = null; requestId = UUID.randomUUID().toString() }
    if (messageRecipients.isNotEmpty()) ModalBottomSheet(onDismissRequest = { state.messageRecipientIds = emptySet(); state.classroomQuickMessage = false },
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = Color(0xFF101114), contentColor = Color.White) {
        Column(Modifier.fillMaxWidth().imePadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (messageRecipients.size == 1) messageRecipients.first().name else "${messageRecipients.size} invités",
                    modifier = Modifier.weight(1f), fontSize = 16.sp)
                IconButton(onClick = { state.messageRecipientIds = emptySet() }) { Icon(WaveIcons.Close, "Fermer") }
            }
            Text(if (quick && liveRoomId != null) "Message rapide dans la Classe" else "Message privé · Démonstration locale", fontSize = 11.sp, color = Color.White.copy(alpha = .5f))
            if (messageRecipients.size == 1) LazyColumn(Modifier.fillMaxWidth().heightIn(max = 150.dp)) {
                items(state.privateDemoMessages[messageRecipients.first().id].orEmpty()) {
                    Text(it, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                        .background(Color(0xFF262032), RoundedCornerShape(10.dp)).padding(10.dp), fontSize = 13.sp)
                }
            }
            OutlinedTextField(value = draft, onValueChange = { draft = it.take(if (quick) 280 else 1000); requestId = UUID.randomUUID().toString() }, placeholder = { Text("Écrire aux invités…") },
                modifier = Modifier.fillMaxWidth(), maxLines = 4, colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = WaveMixerTheme.capsuleAccentSoft))
            failure?.let { Text(it, color = Color(0xFFFFA0A0), fontSize = 12.sp) }
            Button(onClick = {
                if (quick && liveRoomId != null && messageRecipients.size == 1) {
                    busy = true; failure = null
                    val body = draft.trim()
                    scope.launch {
                        try {
                            LogeRemoteRepository(context, liveRoomId).rpc("rooms_classe_send_private_message_v1", JSONObject()
                                .put("p_room_id", liveRoomId).put("p_peer_id", messageRecipients.first().id)
                                .put("p_body", body).put("p_client_request_id", requestId))
                            draft = ""; requestId = UUID.randomUUID().toString()
                            state.messageRecipientIds = emptySet(); state.classroomQuickMessage = false
                        } catch (_: Exception) { failure = "Le message n’a pas été envoyé. Réessaie." }
                        finally { busy = false }
                    }
                } else if (liveRoomId != null) { failure = "Sélectionne un seul destinataire pour envoyer un message." } else { state.addPrivateDemoMessage(messageRecipients.map { it.id }.toSet(), draft); draft = "" }
            },
                enabled = draft.isNotBlank() && !busy, modifier = Modifier.align(Alignment.End),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF453677))) {
                Icon(WaveIcons.Send, null, modifier = Modifier.size(16.dp)); Spacer(Modifier.width(8.dp)); Text("Envoyer")
            }
        }
    }
}

@Composable
private fun GuestAction(label: String, icon: ImageVector, enabled: Boolean, modifier: Modifier, tint: Color = WaveMixerTheme.capsuleAccentSoft, onClick: () -> Unit) {
    Column(modifier.height(48.dp).clickable(enabled = enabled, onClick = onClick), horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center) {
        val color = if (enabled) tint else Color.White.copy(alpha = .25f)
        Icon(icon, label, tint = color, modifier = Modifier.size(18.dp))
        Spacer(Modifier.height(4.dp))
        Text(label, fontSize = 9.sp, color = color, maxLines = 1)
    }
}
