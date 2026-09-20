package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Local presentation only. No balance, payment or payout is inferred from demo contributions. */
internal class CageFundraiserState {
    var title by mutableStateOf("Soutenez les artistes")
    var beneficiary by mutableStateOf("Les artistes de la Cage")
    var targetEuros by mutableIntStateOf(500)
    var status by mutableStateOf("Brouillon"); private set
    var visible by mutableStateOf(false)
    var collectedEuros by mutableIntStateOf(0); private set
    var contributions by mutableIntStateOf(0); private set
    val valid get() = title.isNotBlank() && beneficiary.isNotBlank() && targetEuros in 1..1_000_000
    fun open() { if (valid) { status = "Ouverte"; visible = true } }
    fun close() { status = "Clôturée" }
    fun simulate(amount: Int) { if (status == "Ouverte" && amount in 1..1000 && collectedEuros <= 10_000_000 - amount) { collectedEuros += amount; contributions++ } }
}

@Composable
internal fun CageFundraiserSummary(state: CageFundraiserState, onOpen: () -> Unit) {
    Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).clickable(onClick = onOpen).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text("Cagnotte · " + state.status, color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp)
            Text(if (state.status == "Brouillon") "Donnez un objectif à la soirée" else state.title, color = Color(0xFFAAA6B4), fontSize = 11.sp, maxLines = 1)
        }
        Text(if (state.status == "Brouillon") "Configurer" else "${state.collectedEuros} €", color = Color.White, fontSize = 14.sp)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun CageFundraiserSheet(state: CageFundraiserState, onDismiss: () -> Unit) {
    var target by remember { mutableStateOf(state.targetEuros.toString()) }
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = Color(0xFF111216), contentColor = Color.White) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).imePadding().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Cagnotte", modifier = Modifier.weight(1f), fontSize = 18.sp)
                IconButton(onClick = onDismiss) { Icon(WaveIcons.Close, "Fermer", tint = WaveMixerTheme.capsuleAccentSoft) }
            }
            Text("Démonstration locale · aucun paiement réel", color = Color(0xFFAAA6B4), fontSize = 11.sp)
            val colors = OutlinedTextFieldDefaults.colors(focusedTextColor = Color.White, unfocusedTextColor = Color.White, focusedBorderColor = WaveMixerTheme.capsuleAccentSoft, unfocusedLabelColor = Color(0xFFAAA6B4))
            OutlinedTextField(state.title, { state.title = it.take(80) }, label = { Text("Objectif") }, singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(state.beneficiary, { state.beneficiary = it.take(80) }, label = { Text("Bénéficiaire") }, singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(target, { target = it.filter(Char::isDigit).take(7); state.targetEuros = target.toIntOrNull() ?: 0 }, label = { Text("Montant cible (€)") }, singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth(),
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Number), isError = state.targetEuros !in 1..1_000_000)
            Text("${state.collectedEuros} € / ${state.targetEuros} € · ${state.contributions} contributions de démo", fontSize = 13.sp)
            LinearProgressIndicator(progress = { (state.collectedEuros.toFloat() / state.targetEuros.coerceAtLeast(1)).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth(), color = WaveMixerTheme.capsuleAccentSoft, trackColor = Color(0xFF24222C))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Afficher sur le retour vidéo", modifier = Modifier.weight(1f), fontSize = 12.sp)
                Switch(state.visible, { state.visible = it }, enabled = state.status != "Brouillon", colors = SwitchDefaults.colors(checkedTrackColor = WaveMixerTheme.primaryCta, checkedThumbColor = Color.White))
            }
            CageAction(if (state.status == "Ouverte") "Clôturer la cagnotte" else if (state.status == "Clôturée") "Rouvrir la cagnotte" else "Ouvrir la cagnotte", enabled = state.valid, primary = true) {
                if (state.status == "Ouverte") state.close() else state.open()
            }
            if (com.meewav.android.BuildConfig.DEBUG && state.status == "Ouverte") {
                Text("Simuler une contribution du public", color = Color(0xFFAAA6B4), fontSize = 11.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf(5, 10, 20).forEach { amount -> CageAction("+ $amount €", Modifier.weight(1f)) { state.simulate(amount) } } }
            }
        }
    }
}
