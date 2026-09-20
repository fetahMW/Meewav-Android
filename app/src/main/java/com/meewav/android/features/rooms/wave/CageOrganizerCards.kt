package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R

internal fun CageToolsState.openProfile(id: String) { guests.previewId = null; guests.profilePreviewId = id }

@Composable
internal fun CageArtistCompact(state: CageToolsState, id: String?, modifier: Modifier = Modifier, winner: Boolean = false, beforeProfile: () -> Unit = {}, duelSide: Int = 0) {
    val person = state.person(id)
    if (duelSide != 0) {
        val champion = person != null && state.finished && state.format in listOf(CageFormat.TOURNAMENT, CageFormat.CHALLENGER) && state.matches.lastOrNull()?.winner == person.id
        val portrait: @Composable () -> Unit = {
            Box(Modifier.size(48.dp)) {
                Box(Modifier.fillMaxSize().clip(CircleShape).background(Color(0xFF222129))
                    .clickable(enabled = person != null) { person?.let { beforeProfile(); state.openProfile(it.id) } }, contentAlignment = Alignment.Center) {
                    if (person != null) Image(painterResource(person.portrait), "Pré-profil de " + person.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                    else Text("?", color = Color.Gray)
                }
                if (winner || champion) Icon(Icons.Default.EmojiEvents, if (champion) "Champion" else "Vainqueur", Modifier.align(Alignment.BottomEnd).size(15.dp).background(Color(0xFF17140F), CircleShape), tint = Color(0xFFE4C47F))
            }
        }
        val message: @Composable () -> Unit = {
            IconButton(onClick = { person?.let { state.guests.messageRecipientIds = setOf(it.id) } }, enabled = person != null,
                modifier = Modifier.size(48.dp).hifiBlackSurface(10.dp)) {
                Icon(WaveIcons.Envelope, "Message à " + (person?.name ?: "artiste"), Modifier.size(22.dp), tint = WaveMixerTheme.capsuleAccentSoft.copy(alpha = if (person != null) 1f else .25f))
            }
        }
        Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                if (duelSide < 0) { message(); portrait() } else { portrait(); message() }
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                Text(person?.name ?: "À déterminer", modifier = Modifier.weight(1f, fill = false), color = if (winner) WaveMixerTheme.capsuleAccentSoft else Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (person != null) {
                    val badges = listOf(R.drawable.wave_grade_1, R.drawable.wave_grade_2, R.drawable.wave_grade_3, R.drawable.wave_grade_4, R.drawable.wave_grade_5, R.drawable.wave_grade_6)
                    Spacer(Modifier.width(3.dp))
                    Image(painterResource(badges[(person.gradeLevel - 1).coerceIn(0, 5)]), "Grade " + person.gradeLevel, Modifier.size(22.dp))
                }
            }
        }
        return
    }
    val portrait: @Composable () -> Unit = {
        Box(Modifier.size(38.dp).clip(CircleShape).background(Color(0xFF222129)).clickable(enabled = person != null) { person?.let { beforeProfile(); state.openProfile(it.id) } }, contentAlignment = Alignment.Center) {
            if (person != null) Image(painterResource(person.portrait), "Pré-profil de " + person.name, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            else Text("?", color = Color.Gray)
        }
    }
    Row(modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        if (duelSide >= 0) portrait()
        Column(Modifier.weight(1f), horizontalAlignment = if (duelSide > 0) Alignment.End else Alignment.Start) {
            Text(person?.name ?: "À déterminer", color = if (winner) WaveMixerTheme.capsuleAccentSoft else Color.White, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = if (duelSide > 0) TextAlign.End else TextAlign.Start)
            Row(verticalAlignment = Alignment.CenterVertically) {
                person?.let {
                    val badges = listOf(R.drawable.wave_grade_1, R.drawable.wave_grade_2, R.drawable.wave_grade_3, R.drawable.wave_grade_4, R.drawable.wave_grade_5, R.drawable.wave_grade_6)
                    Image(painterResource(badges[(it.gradeLevel - 1).coerceIn(0, 5)]), "Grade " + it.gradeLevel, Modifier.size(22.dp))
                }
                person?.let { artist ->
                    val champion = state.finished && state.format in listOf(CageFormat.TOURNAMENT, CageFormat.CHALLENGER) && state.matches.lastOrNull()?.winner == artist.id
                    val role = artist.role.lowercase()
                    val symbol = when {
                        winner || champion -> Icons.Default.EmojiEvents
                        "rapp" in role || "chant" in role -> Icons.Default.Mic
                        "produc" in role || "beat" in role || "dj" in role -> Icons.Default.GraphicEq
                        "auteur" in role || "autrice" in role -> Icons.Default.Edit
                        else -> Icons.Default.MusicNote
                    }
                    Spacer(Modifier.width(4.dp))
                    Icon(symbol, if (champion) "Champion" else if (winner) "Vainqueur du duel" else artist.role,
                        modifier = Modifier.size(15.dp), tint = if (winner || champion) Color(0xFFE4C47F) else WaveMixerTheme.capsuleAccentSoft.copy(alpha = .8f))
                }
            }
        }
        if (duelSide < 0) portrait()
    }
}

@Composable
internal fun CageDuelCard(state: CageToolsState, match: CageMatch, showStatus: Boolean = true) {
    Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(10.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
        if (showStatus) Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Match " + (match.id + 1), color = Color(0xFFAAA6B4), fontSize = 10.sp, modifier = Modifier.weight(1f))
            Text(if (match.completed) if (match.b == null) "Qualifié d’office" else "Terminé" else if (state.activeId == match.id) "En cours" else "À venir", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 10.sp)
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            CageArtistCompact(state, match.a, Modifier.weight(1f), match.winner == match.a, duelSide = -1)
            Text(if (match.b == null) "—" else "VS", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            CageArtistCompact(state, match.b, Modifier.weight(1f), match.b != null && match.winner == match.b, duelSide = 1)
        }

    }
}

@Composable
internal fun CageBracket(state: CageToolsState) {
    val rounds = if (state.matches.isEmpty()) 1 else {
        var size = 2; var count = 1
        while (size < state.roster.size) { size *= 2; count++ }; count
    }
    val scroll = rememberLazyListState()
    LaunchedEffect(state.currentRound) { scroll.animateScrollToItem((state.currentRound - 1).coerceIn(0, rounds - 1)) }
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val width = maxWidth - 20.dp
        LazyRow(state = scroll, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            items((1..rounds).toList(), key = { it }) { round ->
                Column(Modifier.width(width), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                    Text(if (round == rounds) "Finale" else if (round == rounds - 1) "Demi-finales →" else "Tour $round →", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    val matches = state.matches.filter { it.round == round }
                    if (matches.isNotEmpty()) matches.forEach { CageDuelCard(state, it) }
                    else repeat(1 shl (rounds - round)) { index ->
                        Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Rencontre " + (index + 1), color = Color(0xFFAAA6B4), fontSize = 10.sp)
                            Text("Qualifié " + (index * 2 + 1) + "   VS   Qualifié " + (index * 2 + 2), color = Color.White, fontSize = 12.sp)
                            Text("Issus du tour précédent", color = Color(0xFFAAA6B4), fontSize = 10.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun CageParticipantCard(state: CageToolsState, id: String, onReplace: (String) -> Unit) {
    val person = state.person(id) ?: return
    Column(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            CageArtistCompact(state, id, Modifier.weight(1f))
            IconButton(onClick = { state.guests.messageRecipientIds = setOf(id) }) { Icon(WaveIcons.Envelope, "Message à " + person.name, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(19.dp)) }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(if (!person.canParticipate) "Invitation en attente" else if (!person.connected) "Connexion interrompue" else person.location.label, color = Color(0xFFAAA6B4), fontSize = 10.sp, modifier = Modifier.weight(1f))
            if (!state.locked) TextButton(onClick = { state.removeParticipants(setOf(id)) }) { Text("Retirer", color = Color(0xFFC88B90), fontSize = 10.sp) }
            else if (state.canReplaceParticipant(id)) TextButton(onClick = { onReplace(id) }) { Text("Remplacer", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 10.sp) }
        }
        if (com.meewav.android.BuildConfig.DEBUG && (!person.canParticipate || !person.connected)) CageAction("Simuler son arrivée") {
            state.guests.demoInvitationResponse(id, true); state.guests.demoReconnect(id); state.guests.move(setOf(id), WaveGuestLocation.BACKSTAGE); state.notice = null
        }
    }
}
