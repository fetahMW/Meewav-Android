package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
internal fun NoiseReductionPanel(modifier: Modifier = Modifier, cleanVoice: Boolean = false, onCleanVoice: (() -> Unit)? = null, onCalibrateNoise: (() -> Unit)? = null, proEffects: Int = 0, onProEffects: ((Int) -> Unit)? = null) {
    var calibrating by remember { mutableStateOf(false) }
    LaunchedEffect(calibrating) { if (calibrating) { kotlinx.coroutines.delay(1200); calibrating = false } }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        if (onCleanVoice != null) {
            Row(Modifier.fillMaxWidth().weight(1f).satinControl(12.dp).padding(horizontal = 10.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(if (calibrating) "Mesure…" else "Souffle", color = WaveMixerTheme.pearl, fontSize = 12.sp, maxLines = 1, modifier = Modifier.weight(1f))
                if (onCalibrateNoise != null) {
                    Box(Modifier.size(32.dp).clickable(enabled = !calibrating) {
                        calibrating = true; onCalibrateNoise()
                    }, contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.GraphicEq, "Mesurer le souffle", tint = WaveMixerTheme.fxAccent, modifier = Modifier.size(18.dp))
                    }
                }
                PowerButton(cleanVoice, onCleanVoice)
            }
        }
        if (onProEffects != null) {
            listOf(Triple(64, "Delay", "Écho · 240 ms"), Triple(128, "Saturation", "Chaleur douce"), Triple(256, "Limiteur", "Contrôle des crêtes")).forEach { (flag, title, detail) ->
                Row(Modifier.fillMaxWidth().weight(1f).satinControl(12.dp).padding(horizontal = 10.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(title, color = WaveMixerTheme.pearl, fontSize = 12.sp, maxLines = 1)
                        Text(detail, color = WaveMixerTheme.fxAccent, fontSize = 9.sp, maxLines = 1)
                    }
                    PowerButton(proEffects and flag != 0, { onProEffects(proEffects xor flag) })
                }
            }
        }
    }
}
