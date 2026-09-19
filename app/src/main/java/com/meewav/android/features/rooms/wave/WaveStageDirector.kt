package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal enum class WaveComposition(val label: String) {
    ENSEMBLE("Ensemble"), FOCUS("Mise en avant"), SOLO("Solo")
}

/** Normalized media frames adapted from the web Ensemble / Focus / Solo recipes.
 * Media must fit inside these frames, never stretch to fill them.
 */
internal fun waveStageFrames(ids: List<String>, portraitIds: Set<String>, mode: WaveComposition,
                             primaryId: String, tallViewport: Boolean): Map<String, Rect> {
    val primary = primaryId.takeIf { it in ids } ?: ids.firstOrNull() ?: return emptyMap()
    val ordered = listOf(primary) + ids.filter { it != primary }
    fun rect(x: Float, y: Float, w: Float, h: Float) = Rect(x, y, x + w, y + h)
    if (mode == WaveComposition.SOLO || ids.size == 1) return mapOf(primary to rect(0f, 0f, 1f, 1f))
    // Mobile portrait duo: two full-width halves, independent of source orientation.
    // Focus selects who is on top; Solo deliberately keeps a single participant.
    if (ids.size == 2 && tallViewport) {
        val duo = if (mode == WaveComposition.FOCUS) ordered else ids
        return duo.mapIndexed { i, id -> id to rect(0f, i * .5f, 1f, .5f) }.toMap()
    }
    if (mode == WaveComposition.FOCUS) {
        return ordered.mapIndexed { i, id -> id to if (tallViewport) {
            if (i == 0) rect(0f, 0f, 1f, .72f)
            else rect((i - 1f) / (ids.size - 1), .72f, 1f / (ids.size - 1), .28f)
        } else {
            if (i == 0) rect(0f, 0f, .7f, 1f)
            else rect(.7f, (i - 1f) / (ids.size - 1), .3f, 1f / (ids.size - 1))
        } }.toMap()
    }
    val vertical = ids.filter { it in portraitIds }
    val wide = ids.filter { it !in portraitIds }
    if (vertical.size == ids.size && (!tallViewport || ids.size == 2)) {
        return ids.mapIndexed { i, id -> id to rect(i.toFloat() / ids.size, 0f, 1f / ids.size, 1f) }.toMap()
    }
    if (vertical.isNotEmpty() && wide.isNotEmpty() && !tallViewport) {
        // Web mixed recipes: 70/30 with one Short; half-width for multiple Shorts.
        val split = if (vertical.size == 1) .7f else .5f
        val result = wide.mapIndexed { i, id -> id to rect(0f, i.toFloat() / wide.size, split, 1f / wide.size) }.toMap().toMutableMap()
        vertical.forEachIndexed { i, id -> result[id] = rect(split + (1f - split) * i / vertical.size, 0f, (1f - split) / vertical.size, 1f) }
        return result
    }
    if (ids.size == 2) return ids.mapIndexed { i, id -> id to rect(i * .5f, 0f, .5f, 1f) }.toMap()
    return ids.mapIndexed { i, id -> id to rect(if (ids.size == 3 && i == 2) .25f else (i % 2) * .5f, (i / 2) * .5f, .5f, .5f) }.toMap()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveDirectorSheet(state: WaveGuestState, onDismiss: () -> Unit, onFullscreen: () -> Unit) {
    ModalBottomSheet(onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = Color(0xFF101114), contentColor = Color.White) {
        Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()).padding(horizontal = 18.dp).padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Réalisation vidéo", fontSize = 18.sp, modifier = Modifier.weight(1f))
                IconButton(onClick = onDismiss) { Icon(WaveIcons.Close, "Fermer") }
            }
            Text("Composition", color = Color.White.copy(alpha = .55f), fontSize = 12.sp)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                WaveComposition.entries.forEach { mode ->
                    Box(Modifier.weight(1f).height(48.dp).hifiBlackSurface(12.dp).clip(RoundedCornerShape(12.dp))
                        .clickable { state.composition = mode }, contentAlignment = Alignment.Center) {
                        Text(mode.label, fontSize = 11.sp, color = if (state.composition == mode) WaveMixerTheme.capsuleAccentSoft else Color.White.copy(alpha = .6f))
                    }
                }
            }
            Text("Personne mise en avant", color = Color.White.copy(alpha = .55f), fontSize = 12.sp)
            val people = listOf("host" to "Luma · Host") + state.onStage.map { it.id to it.name }
            people.forEach { (id, name) ->
                Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).clip(RoundedCornerShape(12.dp))
                    .clickable { state.primaryId = id }.padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    RadioButton(selected = state.resolvedPrimaryId == id, onClick = { state.primaryId = id },
                        colors = RadioButtonDefaults.colors(selectedColor = WaveMixerTheme.capsuleAccentSoft))
                    Text(name, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    Text(if (id == "host" || (state.onStage.find { it.id == id }?.sourceAspectRatio ?: 1f) >= 1f) "16:9" else "Short",
                        fontSize = 10.sp, color = Color.White.copy(alpha = .4f))
                }
            }
            TextButton(onClick = { onDismiss(); onFullscreen() }, modifier = Modifier.fillMaxWidth()) {
                Icon(WaveIcons.Expand, null, modifier = Modifier.size(18.dp), tint = WaveMixerTheme.capsuleAccentSoft)
                Spacer(Modifier.width(8.dp))
                Text("Plein écran", color = WaveMixerTheme.capsuleAccentSoft)
            }
            Text("Aperçu local · les caméras distantes ne sont pas connectées.", fontSize = 11.sp, color = Color.White.copy(alpha = .4f))
        }
    }
}
