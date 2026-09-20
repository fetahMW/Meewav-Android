package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CageResultsSheet(state: CageToolsState) {
    ModalBottomSheet(onDismissRequest = { state.resultsOpen = false },
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF101014)) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Résultats", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                IconButton(onClick = { state.resultsOpen = false }) { Icon(Icons.Default.Close, "Fermer les résultats", tint = Color.White) }
            }
            CageResultsCard(state, Modifier.weight(1f, fill = false))
            Button(onClick = { state.resultsOnStage = !state.resultsOnStage; state.resultsOpen = false }, enabled = state.finished,
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp).heightIn(min = 48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = WaveMixerTheme.capsuleAccentSoft, contentColor = Color(0xFF101014))) {
                Text(if (state.resultsOnStage) "Retirer de l’affichage public" else "Afficher au public")
            }
            Text(if (state.resultsOnStage) "Podium affiché sur la scène simulée." else "Affichage local sur la scène simulée, sans diffusion réseau.",
                color = Color(0xFFBBB7C6), fontSize = 11.sp, modifier = Modifier.padding(vertical = 12.dp))
        }
    }
}

@Composable
internal fun CageResultsCard(state: CageToolsState, modifier: Modifier = Modifier, compact: Boolean = false) {
    val ranking = state.finalRanking
    Column(modifier.fillMaxWidth().hifiBlackSurface(20.dp).verticalScroll(rememberScrollState()).padding(if (compact) 10.dp else 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(if (compact) 8.dp else 16.dp)) {
        Text("PALMARÈS · ${state.format.title.uppercase()}", color = WaveMixerTheme.capsuleAccentSoft,
            fontSize = if (compact) 10.sp else 11.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 1.sp, textAlign = TextAlign.Center)
        Text(state.title, color = Color.White, fontSize = if (compact) 13.sp else 18.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center)
        if (ranking.isEmpty()) {
            Text("Le classement sera disponible à la fin du programme.", color = Color(0xFFBBB7C6), textAlign = TextAlign.Center)
        } else {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Bottom, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                listOf(2, 1, 3).forEach { place ->
                    CagePodiumPlace(state.person(ranking.getOrNull(place - 1)), place, compact, Modifier.weight(1f))
                }
            }
            Text(if (state.format in listOf(CageFormat.CHALLENGER, CageFormat.TOURNAMENT)) "Dernier vainqueur, puis ordre inverse des éliminations."
                else "Nombre de victoires · à égalité, ordre du programme.",
                color = Color(0xFFBBB7C6), fontSize = 10.sp, textAlign = TextAlign.Center)
            if (ranking.size > 3) {
                HorizontalDivider(color = Color.White.copy(alpha = .12f))
                Text("LA SUITE DU CLASSEMENT", color = Color(0xFFBBB7C6), fontSize = 10.sp, letterSpacing = 1.sp, modifier = Modifier.align(Alignment.Start))
                ranking.drop(3).forEachIndexed { index, id ->
                    val guest = state.person(id)
                    Row(Modifier.fillMaxWidth().hifiBlackSurface(10.dp).padding(10.dp), verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("${index + 4}e", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.width(32.dp))
                        guest?.let { Image(painterResource(it.portrait), null, Modifier.size(36.dp).clip(CircleShape), contentScale = ContentScale.Crop) }
                        Column(Modifier.weight(1f)) {
                            Text(guest?.name ?: "Artiste indisponible", color = Color.White, fontSize = 13.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(guest?.role.orEmpty(), color = Color(0xFFBBB7C6), fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                        }
                        val wins = state.matches.count { it.winner == id && it.b != null }
                        Text("$wins V", color = Color(0xFFBBB7C6), fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun CagePodiumPlace(guest: WaveGuest?, place: Int, compact: Boolean, modifier: Modifier) {
    val accent = WaveMixerTheme.capsuleAccentSoft
    val stepHeight = when (place) { 1 -> if (compact) 60.dp else 100.dp; 2 -> if (compact) 42.dp else 72.dp; else -> if (compact) 28.dp else 48.dp }
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(if (place == 1) "VAINQUEUR" else "${place}ᵉ PLACE", color = if (place == 1) accent else Color(0xFFBBB7C6), fontSize = if (compact) 8.sp else 9.sp, fontWeight = FontWeight.SemiBold)
        Box(Modifier.size(if (compact) 42.dp else if (place == 1) 78.dp else 64.dp).border(if (place == 1) 2.dp else 1.dp, accent.copy(alpha = if (place == 1) 1f else .4f), CircleShape).padding(4.dp).clip(CircleShape).background(Color(0xFF25232C)), contentAlignment = Alignment.Center) {
            if (guest != null) Image(painterResource(guest.portrait), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            else Text("—", color = Color(0xFFBBB7C6))
        }
        Text(guest?.name ?: "Non attribuée", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = if (compact) 10.sp else 12.sp,
            maxLines = 1, overflow = TextOverflow.Ellipsis, textAlign = TextAlign.Center)
        Box(Modifier.fillMaxWidth().height(stepHeight).background(Brush.verticalGradient(listOf(accent.copy(alpha = if (place == 1) .45f else .2f), Color(0xFF17151F))), RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp))
            .border(.75.dp, accent.copy(alpha = .4f), RoundedCornerShape(topStart = 8.dp, topEnd = 8.dp)), contentAlignment = Alignment.Center) {
            Text("$place", color = if (place == 1) accent else Color.White, fontSize = if (compact) 22.sp else 32.sp, fontWeight = FontWeight.Bold)
        }
    }
}
