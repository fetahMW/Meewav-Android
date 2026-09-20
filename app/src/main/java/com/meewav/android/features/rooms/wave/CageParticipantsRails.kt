package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
internal fun CageParticipantsRails(state: CageToolsState, modifier: Modifier, onReplace: (String) -> Unit) {
    if (state.roster.isEmpty()) {
        Box(modifier, contentAlignment = Alignment.Center) {
            Text("Les artistes retenus apparaîtront ici", color = Color(0xFF9995A4), fontSize = 12.sp)
        }
        return
    }
    LazyHorizontalGrid(rows = GridCells.Fixed(2), modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(bottom = 8.dp)) {
        items(state.roster, key = { it }) { id ->
            state.person(id)?.let { guest ->
                var menu by remember { mutableStateOf(false) }
                Column(Modifier.width(112.dp).fillMaxHeight().hifiBlackSurface(12.dp).clip(RoundedCornerShape(12.dp))
                    .clickable { state.openProfile(id) }.padding(8.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.weight(1f).fillMaxWidth()) {
                        Image(painterResource(guest.portrait), "Pré-profil de " + guest.name,
                            Modifier.fillMaxSize().clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                        CageVictoryBadge(guest.cageVictories, Modifier.align(Alignment.BottomStart).padding(3.dp))
                        IconButton(onClick = { state.guests.messageRecipientIds = setOf(id) },
                            modifier = Modifier.align(Alignment.BottomEnd).size(40.dp).background(Color(0xD9101014), RoundedCornerShape(10.dp))) {
                            Icon(WaveIcons.Chat, "Message à " + guest.name, Modifier.size(22.dp), tint = WaveMixerTheme.capsuleAccentSoft)
                        }
                        if (!state.locked || state.canReplaceParticipant(id) || !guest.connected || !guest.canParticipate) Box(Modifier.align(Alignment.TopEnd)) {
                            IconButton(onClick = { menu = true }, modifier = Modifier.size(32.dp).background(Color(0xD9101014), RoundedCornerShape(8.dp))) {
                                Icon(WaveIcons.More, "Actions pour " + guest.name, Modifier.size(18.dp), tint = WaveMixerTheme.capsuleAccentSoft)
                            }
                            DropdownMenu(menu, { menu = false }, containerColor = Color(0xFF141419), shape = RoundedCornerShape(12.dp)) {
                                if (!state.locked) DropdownMenuItem(text = { Text("Retirer du programme", color = Color(0xFFC88B90)) }, onClick = { menu = false; state.removeParticipants(setOf(id)) })
                                else if (state.canReplaceParticipant(id)) DropdownMenuItem(text = { Text("Remplacer", color = Color.White) }, onClick = { menu = false; onReplace(id) })
                                if (com.meewav.android.BuildConfig.DEBUG && (!guest.connected || !guest.canParticipate)) DropdownMenuItem(text = { Text("Simuler son arrivée", color = Color.White) }, onClick = {
                                    menu = false; state.guests.demoInvitationResponse(id, true); state.guests.demoReconnect(id); state.guests.move(setOf(id), WaveGuestLocation.BACKSTAGE)
                                })
                            }
                        }
                    }
                    Text(guest.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(if (!guest.canParticipate) "Invitation en attente" else if (!guest.connected) "Connexion perdue" else guest.location.label,
                        color = if (!guest.canParticipate || !guest.connected) Color(0xFFC88B90) else Color.White.copy(alpha = .5f), fontSize = 8.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}
