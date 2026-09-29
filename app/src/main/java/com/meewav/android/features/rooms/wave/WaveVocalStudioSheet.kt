package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt

private val vocalMuted = Color(0xFFAAA6B4)
private val vocalAccent = WaveMixerTheme.capsuleAccentSoft

@Composable
internal fun WavePluginEntry(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(modifier.consoleTabSurface(selected = false)
        .clip(RoundedCornerShape(12.dp))
        .clickable(role = Role.Button, onClickLabel = "Ouvrir les plugins", onClick = onClick)
        .padding(horizontal = 10.dp), verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally)) {
        Icon(Icons.Default.Extension, null, tint = vocalAccent, modifier = Modifier.size(14.dp))
        Text("Plugin", color = WaveMixerTheme.pearl, fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveVocalStudioSheet(
    autotuneOnly: Boolean, onDismiss: () -> Unit,
    tuneOn: Boolean, onTune: () -> Unit,
    tuneKey: String, scale: String, onKey: (String) -> Unit, onScale: (String) -> Unit,
    correction: WaveTuneSettings, onCorrection: (WaveTuneSettings) -> Unit,
    reverbOn: Boolean, onReverb: () -> Unit, reverbMix: Float, onReverbMix: (Float) -> Unit,
    cleanVoice: Boolean, onCleanVoice: () -> Unit, onCalibrate: () -> Unit,
    effects: Int, onEffects: (Int) -> Unit,
    nativeEffects: Boolean = true,
    fullCorrection: Boolean = true,
) {
    var page by remember { mutableIntStateOf(0) }
    var engines by remember { mutableStateOf(false) }
    ModalBottomSheet(onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        containerColor = Color(0xFF111214), contentColor = WaveMixerTheme.pearl,
        dragHandle = null, scrimColor = Color.Black.copy(alpha = .6f)) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(.92f).navigationBarsPadding()
            .hifiBlackSurface(24.dp).padding(horizontal = 16.dp)) {
            Box(Modifier.align(Alignment.CenterHorizontally).padding(top = 9.dp)
                .size(34.dp, 3.dp).background(Color(0xFF5E5B66), RoundedCornerShape(2.dp)))
            Row(Modifier.fillMaxWidth().height(62.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.GraphicEq, null, tint = vocalAccent, modifier = Modifier.size(25.dp))
                Column(Modifier.weight(1f).padding(start = 10.dp)) {
                    Text(if (autotuneOnly) "Autotune Pro" else "Studio vocal", fontSize = 21.sp, fontWeight = FontWeight.Bold)
                    Text(if (autotuneOnly) "Façonne ta signature vocale" else "Ta voix. Tes réglages.", color = vocalMuted, fontSize = 12.sp)
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(44.dp).satinControl(12.dp)) {
                    Icon(Icons.Default.Close, "Fermer", modifier = Modifier.size(20.dp))
                }
            }
            if (!autotuneOnly) Row(Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                (if (nativeEffects) listOf("Correction", "Effets", "Souffle") else listOf("Correction", "Effets")).forEachIndexed { index, label ->
                    VocalChoice(label, page == index, Modifier.weight(1f)) { page = index }
                }
            }
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(bottom = 20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)) {
                if (autotuneOnly || page == 0) {
                    Row(Modifier.fillMaxWidth().satinControl(14.dp).padding(horizontal = 12.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f).clickable(role = Role.Button, onClick = { engines = !engines })) {
                            Text("MOTEUR", fontSize = 9.sp, color = vocalMuted, letterSpacing = 1.sp)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("MeeWav", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                Icon(if (engines) Icons.Default.ExpandLess else Icons.Default.ExpandMore, "Afficher les moteurs", tint = vocalAccent)
                            }
                        }
                        Switch(tuneOn, { onTune() }, modifier = Modifier.semantics { contentDescription = "Activer l’Autotune" },
                            colors = vocalSwitchColors())
                    }
                    if (engines) Column(Modifier.fillMaxWidth().satinControl(12.dp, selected = true).padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text("MeeWav · moteur intégré", color = vocalAccent, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Text("Actuellement disponible sur cet appareil.", color = vocalMuted, fontSize = 12.sp)
                        Text("Antares et les plugins VST nécessitent un hôte compatible sur ordinateur. Ils ne sont pas disponibles dans cette version Android.",
                            color = vocalMuted, fontSize = 12.sp)
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        VocalSelect("Tonalité", tuneKey, listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"), onKey, Modifier.weight(.4f))
                        VocalSelect("Gamme", scale, listOf("Chromatique", "Majeur", "Mineur"), onScale, Modifier.weight(.6f))
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        waveTunePresets.forEach { (name, preset) ->
                            VocalChoice(name, correction == preset, Modifier.weight(1f)) { onCorrection(preset) }
                        }
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        VocalFader("Retune", "Vitesse", correction.speed, { onCorrection(correction.copy(speed = it)) }, Modifier.weight(1f))
                        VocalFader("Humanisation", "Naturel", correction.humanize, { onCorrection(correction.copy(humanize = it)) }, Modifier.weight(1f))
                        VocalFader("Intensité", "Correction", correction.amount, { onCorrection(correction.copy(amount = it)) }, Modifier.weight(1f))
                        if (fullCorrection) VocalFader("Lissage", "Transition", correction.smooth, { onCorrection(correction.copy(smooth = it)) }, Modifier.weight(1f))
                    }
                    if (fullCorrection) Row(Modifier.fillMaxWidth().satinControl(14.dp).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Column(Modifier.weight(1f)) {
                            Text("Transposition", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                            Text("Demi-tons", fontSize = 11.sp, color = vocalMuted)
                        }
                        IconButton(onClick = { onCorrection(correction.copy(shift = correction.shift - 1f)) }, enabled = correction.shift > -12f) {
                            Icon(Icons.Default.Remove, "Baisser d’un demi-ton", tint = vocalAccent)
                        }
                        Text("%+d".format(correction.shift.roundToInt()), Modifier.width(34.dp), textAlign = TextAlign.Center, fontWeight = FontWeight.Bold)
                        IconButton(onClick = { onCorrection(correction.copy(shift = correction.shift + 1f)) }, enabled = correction.shift < 12f) {
                            Icon(Icons.Default.Add, "Monter d’un demi-ton", tint = vocalAccent)
                        }
                    }
                    TextButton(onClick = { onCorrection(WaveTuneSettings()) }, modifier = Modifier.align(Alignment.End)) {
                        Icon(Icons.Default.RestartAlt, null, tint = vocalAccent, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp)); Text("Réinitialiser les réglages", color = vocalAccent, fontSize = 12.sp)
                    }
                } else if (page == 1) {
                    FxCard("Réverb", WaveIcons.Reverb, reverbOn, onReverb, Modifier.fillMaxWidth().height(100.dp)) {
                        ReverbSlider(reverbMix, reverbOn, onReverbMix)
                    }
                    if (nativeEffects) NoiseReductionPanel(Modifier.fillMaxWidth().height(204.dp), proEffects = effects, onProEffects = onEffects)
                } else {
                    Text("Réduction du souffle", fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                    Text("Pour la mesure, reste silencieux un instant avec ton micro habituel.", color = vocalMuted, fontSize = 13.sp)
                    NoiseReductionPanel(Modifier.fillMaxWidth().height(64.dp), cleanVoice, onCleanVoice, onCalibrate)
                }
            }
        }
    }
}

@Composable
private fun VocalFader(label: String, detail: String, value: Float, onChange: (Float) -> Unit, modifier: Modifier) {
    Column(modifier.satinControl(14.dp).padding(horizontal = 6.dp, vertical = 12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, Modifier.height(30.dp), fontSize = 11.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.Center, maxLines = 2)
        Text("${(value * 100).roundToInt()} %", color = vocalAccent, fontSize = 13.sp, fontWeight = FontWeight.Bold)
        WaveFader(value, onChange, muted = false, modifier = Modifier.padding(vertical = 18.dp).width(48.dp).height(130.dp)
            .semantics {
                contentDescription = "$label, $detail"
                progressBarRangeInfo = ProgressBarRangeInfo(value, 0f..1f)
                setProgress { onChange(it.coerceIn(0f, 1f)); true }
            })
        Text(detail, color = vocalMuted, fontSize = 10.sp, maxLines = 1)
    }
}

@Composable
private fun VocalChoice(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(modifier.height(40.dp).consoleTabSurface(selected).clip(RoundedCornerShape(12.dp))
        .clickable(role = Role.Tab, onClick = onClick).semantics { this.selected = selected }, contentAlignment = Alignment.Center) {
        Text(label, color = if (selected) WaveMixerTheme.pearl else vocalMuted, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

@Composable
private fun VocalSelect(label: String, value: String, values: List<String>, onSelect: (String) -> Unit, modifier: Modifier) {
    var open by remember { mutableStateOf(false) }
    Column(modifier, verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(label, fontSize = 11.sp, color = vocalMuted)
        Box {
            Row(Modifier.fillMaxWidth().height(44.dp).satinControl(10.dp).clip(RoundedCornerShape(10.dp))
                .clickable(role = Role.Button, onClickLabel = "Choisir $label", onClick = { open = true }).padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Text(value, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                Icon(Icons.Default.ExpandMore, null, tint = vocalAccent, modifier = Modifier.size(18.dp))
            }
            DropdownMenu(open, { open = false }, modifier = Modifier.heightIn(max = 340.dp), containerColor = Color(0xFF19191E)) {
                values.forEach { item -> DropdownMenuItem(text = { Text(item, color = if (item == value) vocalAccent else WaveMixerTheme.pearl) },
                    onClick = { onSelect(item); open = false }) }
            }
        }
    }
}

@Composable
private fun vocalSwitchColors() = SwitchDefaults.colors(checkedTrackColor = WaveMixerTheme.primaryCta,
    checkedThumbColor = WaveMixerTheme.pearl, uncheckedTrackColor = Color(0xFF2B2931), uncheckedThumbColor = vocalMuted)
