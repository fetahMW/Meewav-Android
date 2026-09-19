package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Transactional draft: closing never mutates the active musical grid or intake. */
@Composable
internal fun WaveRulesPanel(state: WaveCompositionState, onClose: () -> Unit) {
    var page by remember { mutableIntStateOf(0) }
    var tempo by remember { mutableStateOf(state.bpm.toString()) }
    var root by remember { mutableStateOf(state.key.substringBefore(' ')) }
    var scale by remember { mutableStateOf(if (state.key.contains("MAJ")) "Majeur" else "Mineur") }
    var direction by remember { mutableStateOf(state.editorialDirection) }
    var bars by remember { mutableIntStateOf(state.requestedBars) }
    var categories by remember { mutableStateOf(state.acceptedCategories) }
    val parsed = tempo.replace(',', '.').toDoubleOrNull()
    val foreground = Color(0xFFEAE8F0)
    val colors = OutlinedTextFieldDefaults.colors(focusedTextColor = foreground, unfocusedTextColor = foreground,
        focusedBorderColor = WaveMixerTheme.capsuleAccentSoft, unfocusedBorderColor = Color(0xFF41414B))
    Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row { listOf("Filtres", "Règles").forEachIndexed { index, label ->
            TextButton(onClick = { page = index }, modifier = Modifier.weight(1f)) { Text(label, color = if (index == page) WaveMixerTheme.capsuleAccentSoft else foreground) }
        } }
        if (page == 0) {
            Text("Catégories acceptées", color = foreground, fontSize = 16.sp)
            state.categories.chunked(2).forEach { row -> Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                row.forEach { category -> FilterChip(categories.contains(category), {
                    categories = if (category in categories) categories - category else categories + category
                }, label = { WaveRoleChip(category) }, modifier = Modifier.weight(1f)) }
            } }
            Text("Sans catégorie, les nouvelles demandes sont fermées. Les propositions reçues restent disponibles.", color = Color(0xFF9897A5), fontSize = 12.sp)
        } else {
            OutlinedTextField(tempo, { value -> if (value.length <= 6 && value.all { it.isDigit() || it == ',' || it == '.' }) tempo = value },
                label = { Text("BPM · 40 à 260") }, singleLine = true, colors = colors, modifier = Modifier.fillMaxWidth())
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf(4, 8, 16).forEach { value -> FilterChip(bars == value, { bars = value }, label = { Text("$value mesures") }) }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                WaveRuleMenu("Clé", root, listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"), scale != "Chromatique", { root = it }, Modifier.weight(1f))
                WaveRuleMenu("Gamme", scale, listOf("Mineur", "Majeur", "Chromatique"), true, { scale = it }, Modifier.weight(1f))
            }
            OutlinedTextField(direction, { direction = it.take(50) }, label = { Text("Direction artistique") },
                supportingText = { Text("${direction.length}/50") }, maxLines = 2, colors = colors, modifier = Modifier.fillMaxWidth())
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedButton(onClick = onClose, modifier = Modifier.weight(1f)) { Text("Annuler", color = foreground) }
            Button(onClick = {
                state.rules(parsed!!, if (scale == "Chromatique") "Chromatique" else "$root ${if (scale == "Mineur") "MIN" else "MAJ"}")
                state.submissionRules(categories, bars, direction); onClose()
            }, enabled = !state.playing && parsed != null && parsed in 40.0..260.0 && (page == 0 || direction.isNotBlank()),
                colors = ButtonDefaults.buttonColors(containerColor = WaveMixerTheme.primaryCta), modifier = Modifier.weight(1f)) { Text("Enregistrer") }
        }
    }
}

@Composable
private fun WaveRuleMenu(label: String, value: String, options: List<String>, enabled: Boolean, onSelect: (String) -> Unit, modifier: Modifier) {
    var open by remember { mutableStateOf(false) }
    Box(modifier) {
        OutlinedButton({ open = true }, enabled = enabled, modifier = Modifier.fillMaxWidth()) { Text("$label · $value ▾", color = Color(0xFFCDC9D5)) }
        DropdownMenu(open, { open = false }, containerColor = Color(0xFF17181E)) {
            options.forEach { item -> DropdownMenuItem(text = { Text(item, color = Color.White) }, onClick = { onSelect(item); open = false }) }
        }
    }
}
