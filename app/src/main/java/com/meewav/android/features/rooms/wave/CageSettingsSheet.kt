package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CageSettingsSheet(state: CageToolsState, onDismiss: () -> Unit, onReset: () -> Unit) {
    var title by remember { mutableStateOf(state.title) }
    var journal by remember { mutableStateOf(false) }
    val focus = LocalFocusManager.current
    val ink = Color(0xFFE3DFEB)
    val muted = Color(0xFF9995A4)
    val close = { if (title.isNotBlank()) state.title = title.trim(); focus.clearFocus(); onDismiss() }
    ModalBottomSheet(onDismissRequest = close, sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF101014), contentColor = ink, dragHandle = null,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(.92f).imePadding()) {
            Row(Modifier.fillMaxWidth().padding(start = 16.dp, end = 6.dp, top = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Tune, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(20.dp))
                Text("Réglages de la Cage", modifier = Modifier.weight(1f).padding(start = 9.dp), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                IconButton(onClick = close) { Icon(WaveIcons.Close, "Fermer les réglages", tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(20.dp)) }
            }
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 14.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                CageSettingsSection("Programme", Icons.Default.Event) {
                    OutlinedTextField(value = title, onValueChange = { title = it.take(100) }, label = { Text("Nom du programme") },
                        placeholder = { Text("Ex. : Paris vs Marseille") }, singleLine = true,
                        modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), isError = title.isBlank(),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done), keyboardActions = KeyboardActions(onDone = { focus.clearFocus() }),
                        colors = OutlinedTextFieldDefaults.colors(focusedTextColor = ink, unfocusedTextColor = ink, cursorColor = WaveMixerTheme.capsuleAccentSoft,
                            focusedBorderColor = WaveMixerTheme.capsuleAccentSoft.copy(alpha = .6f), unfocusedBorderColor = Color.White.copy(alpha = .12f),
                            focusedLabelColor = WaveMixerTheme.capsuleAccentSoft, unfocusedLabelColor = muted, unfocusedPlaceholderColor = muted,
                            focusedContainerColor = Color(0xFF0C0C10), unfocusedContainerColor = Color(0xFF0C0C10)))
                    if (title.isBlank()) Text("Saisis un nom pour le programme.", fontSize = 11.sp, color = Color(0xFFC88B90))
                    CageSettingSelect("Format", state.format.route, CageFormat.entries.associate { it.route to it.title }, !state.locked) { route -> state.chooseFormat(CageFormat.entries.first { it.route == route }) }
                    CageSettingSelect("Capacité · ${state.roster.size} inscrits", state.capacity.toString(),
                        (listOf(2, 4, 8, 12, 16, 24, 32, 64) + state.capacity).distinct().sorted().filter { it >= state.roster.size }.associate { it.toString() to "$it participants" }, !state.locked) { state.changeCapacity(it.toInt()) }
                    if (state.locked) Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Default.Lock, null, tint = muted, modifier = Modifier.size(13.dp))
                        Text("Règles confirmées · le nom reste modifiable", color = muted, fontSize = 10.sp)
                    }
                }
                CageSettingsSection("Passages", Icons.Default.Timer) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(Modifier.weight(1f)) { CageSettingSelect("Durée", state.passageSeconds.toString(),
                            (listOf(30, 60, 90, 120, 180, 240, 300) + state.passageSeconds).distinct().sorted().associate { it.toString() to if (it % 60 == 0) "${it / 60} min" else "$it s" }, !state.locked) { state.configure(it.toInt(), state.rounds, state.performance) } }
                        Box(Modifier.weight(1f)) { CageSettingSelect("Rounds", state.rounds.toString(), (listOf(1, 2, 3, 5) + state.rounds).distinct().sorted().associate { it.toString() to "$it round${if (it > 1) "s" else ""}" }, !state.locked) { state.configure(state.passageSeconds, it.toInt(), state.performance) } }
                    }
                    CageSettingSelect("Tour de parole", state.performance, listOf("Successif", "Alterné", "Simultané").associateWith { it }, !state.locked) { state.configure(state.passageSeconds, state.rounds, it) }
                    CageSettingSelect("Égalité", state.tieBreak, linkedMapOf("sudden-death" to "Manche décisive", "replay" to "Rejouer la rencontre"), !state.locked) { state.preparationRules(tie = it) }
                    state.simulationPassageSeconds?.let { Text("Simulation : $it s · durée du programme conservée", color = muted, fontSize = 10.sp) }
                }
                CageSettingsSection("Vote", Icons.Default.HowToVote) {
                    val enabled = !state.voteOpen && !state.voteClosed
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Box(Modifier.weight(1f)) { CageSettingSelect("Décision", state.voteMode, listOf("Public", "Jury", "Hybride").associateWith { it }, enabled) { state.voteConfig(it, state.voteSeconds) } }
                        Box(Modifier.weight(1f)) { CageSettingSelect("Durée", state.voteSeconds.toString(), (listOf(30, 45, 60, 90) + state.voteSeconds).distinct().sorted().associate { it.toString() to "$it s" }, enabled) { state.voteConfig(state.voteMode, it.toInt()) } }
                    }
                    if (state.simulatesPublicVote) Text("Public simulé : ${state.simulationVoteSeconds} s", color = muted, fontSize = 10.sp)
                }
                CageSettingsSection("Session", Icons.Default.History) {
                    Row(Modifier.fillMaxWidth().clickable { journal = !journal }.padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("Journal", modifier = Modifier.weight(1f), color = ink, fontSize = 12.sp)
                        Icon(if (journal) Icons.Default.ExpandLess else Icons.Default.ExpandMore, "Afficher le journal", tint = WaveMixerTheme.capsuleAccentSoft)
                    }
                    if (journal) state.history.takeLast(8).reversed().forEach { Text(it, color = muted, fontSize = 11.sp) }
                    CageAction("Recommencer la préparation", onClick = onReset)
                    Text("Atelier local · sans synchronisation serveur", color = muted, fontSize = 10.sp)
                }
            }
            Box(Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 8.dp)) {
                CageAction("Terminer", enabled = title.isNotBlank(), primary = true, onClick = close)
            }
        }
    }
}

@Composable
private fun CageSettingsSection(title: String, icon: ImageVector, content: @Composable ColumnScope.() -> Unit) {
    Column(Modifier.fillMaxWidth().hifiBlackSurface(16.dp).padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            Icon(icon, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(17.dp))
            Text(title, color = Color(0xFFE3DFEB), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
        }
        content()
    }
}
