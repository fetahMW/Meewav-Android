package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.outlined.DeleteOutline
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
    var messageRecipients by remember { mutableStateOf<List<WaveGuest>>(emptyList()) }
    var draft by remember { mutableStateOf("") }
    val ids = guests.map { it.id }.toSet()
    val enabled = guests.isNotEmpty()
    Column(Modifier.fillMaxWidth().padding(top = 6.dp).hifiBlackSurface(14.dp).padding(horizontal = 6.dp)) {
        Row(Modifier.fillMaxWidth().height(32.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(if (enabled) "${guests.size} sélectionné(s)" else "Sélectionne un invité", modifier = Modifier.weight(1f).padding(start = 8.dp),
                color = Color.White.copy(alpha = .5f), fontSize = 10.sp)
            if (enabled) TextButton(onClick = onClear, contentPadding = PaddingValues(horizontal = 8.dp, vertical = 0.dp)) {
                Text("Annuler", fontSize = 10.sp, color = Color.White.copy(alpha = .6f))
            }
        }
        Row(Modifier.fillMaxWidth().padding(bottom = 4.dp)) {
            GuestAction("Message", WaveIcons.Envelope, enabled, Modifier.weight(1f)) { messageRecipients = guests; draft = "" }
            GuestAction("Aperçu", WaveIcons.Eye, guests.size == 1, Modifier.weight(1f)) { state.previewId = guests.single().id }
            if (page == 0) {
                GuestAction("Scène", Icons.Filled.ArrowUpward, enabled && guests.all { it.connected } && state.onStage.size + guests.size <= 3, Modifier.weight(1f)) {
                    state.move(ids, WaveGuestLocation.STAGE); onClear()
                }
                GuestAction("Demandes", Icons.Filled.ArrowDownward, enabled, Modifier.weight(1f)) {
                    state.move(ids, WaveGuestLocation.REQUESTED); onClear()
                }
            } else GuestAction("Coulisses", if (page == 1) Icons.Filled.ArrowUpward else Icons.Filled.ArrowDownward, enabled, Modifier.weight(1f)) {
                state.move(ids, WaveGuestLocation.BACKSTAGE); onClear()
            }
            GuestAction(if (page == 1) "Refuser" else "Retirer", Icons.Outlined.DeleteOutline, enabled, Modifier.weight(1f)) {
                if (page == 1) state.refuseRequests(ids) else state.remove(ids)
                onClear()
            }
        }
    }
    if (messageRecipients.isNotEmpty()) ModalBottomSheet(onDismissRequest = { messageRecipients = emptyList() },
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true), containerColor = Color(0xFF101114), contentColor = Color.White) {
        Column(Modifier.fillMaxWidth().imePadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(if (messageRecipients.size == 1) messageRecipients.first().name else "${messageRecipients.size} invités",
                    modifier = Modifier.weight(1f), fontSize = 16.sp)
                IconButton(onClick = { messageRecipients = emptyList() }) { Icon(WaveIcons.Close, "Fermer") }
            }
            Text("Message privé · Démonstration locale", fontSize = 11.sp, color = Color.White.copy(alpha = .5f))
            if (messageRecipients.size == 1) LazyColumn(Modifier.fillMaxWidth().heightIn(max = 150.dp)) {
                items(state.privateDemoMessages[messageRecipients.first().id].orEmpty()) {
                    Text(it, modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                        .background(Color(0xFF262032), RoundedCornerShape(10.dp)).padding(10.dp), fontSize = 13.sp)
                }
            }
            OutlinedTextField(value = draft, onValueChange = { draft = it.take(1000) }, placeholder = { Text("Écrire aux invités…") },
                modifier = Modifier.fillMaxWidth(), maxLines = 4, colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = WaveMixerTheme.capsuleAccentSoft))
            Button(onClick = { state.addPrivateDemoMessage(messageRecipients.map { it.id }.toSet(), draft); draft = "" },
                enabled = draft.isNotBlank(), modifier = Modifier.align(Alignment.End),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF453677))) {
                Icon(WaveIcons.Send, null, modifier = Modifier.size(16.dp)); Spacer(Modifier.width(8.dp)); Text("Envoyer")
            }
        }
    }
}

@Composable
private fun GuestAction(label: String, icon: ImageVector, enabled: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Column(modifier.height(48.dp).clickable(enabled = enabled, onClick = onClick), horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center) {
        val color = if (enabled) WaveMixerTheme.capsuleAccentSoft else Color.White.copy(alpha = .25f)
        Icon(icon, label, tint = color, modifier = Modifier.size(18.dp))
        Spacer(Modifier.height(4.dp))
        Text(label, fontSize = 9.sp, color = color, maxLines = 1)
    }
}
