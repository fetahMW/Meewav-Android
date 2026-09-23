package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
internal fun NoiseReductionPanel(modifier: Modifier = Modifier, cleanVoice: Boolean = false, onCleanVoice: (() -> Unit)? = null, onCalibrateNoise: (() -> Unit)? = null, proEffects: Int = 0, onProEffects: ((Int) -> Unit)? = null) {
    var calibrating by remember { mutableStateOf(false) }
    LaunchedEffect(calibrating) { if (calibrating) { kotlinx.coroutines.delay(1200); calibrating = false } }
    Column(modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (onCleanVoice != null) {
            Row(Modifier.fillMaxWidth().satinControl(12.dp).padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Souffle", color = WaveMixerTheme.pearl, fontSize = 12.sp)
                    Text("Sans tampon ajouté", color = WaveMixerTheme.fxAccent, fontSize = 10.sp)
                }
                PowerButton(cleanVoice, onCleanVoice)
            }
        }
        if (onCalibrateNoise != null) Text(if (calibrating) "Garde le silence…" else "Mesurer le souffle · 1 s",
            color = WaveMixerTheme.fxAccent, fontSize = 11.sp,
            modifier = Modifier.fillMaxWidth().clickable(enabled = !calibrating) { calibrating = true; onCalibrateNoise() }.padding(vertical = 8.dp))
        if (onProEffects != null) {
            listOf(Triple(64, "Delay", "Écho · 240 ms"), Triple(128, "Saturation", "Chaleur douce"), Triple(256, "Limiteur", "Contrôle des crêtes")).forEach { (flag, title, detail) ->
                Row(Modifier.fillMaxWidth().satinControl(12.dp).padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(title, color = WaveMixerTheme.pearl, fontSize = 12.sp)
                        Text(detail, color = WaveMixerTheme.fxAccent, fontSize = 10.sp)
                    }
                    PowerButton(proEffects and flag != 0, { onProEffects(proEffects xor flag) })
                }
            }
        }
    }
}
