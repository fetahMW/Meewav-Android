package com.meewav.android.features.rooms.wave

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalFoundationApi::class)
@Composable
internal fun WaveMixerPads(tools: WaveMixerToolsState, modifier: Modifier) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var target by remember { mutableIntStateOf(6) }
    var editing by remember { mutableStateOf<Int?>(null) }
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            val slot = target
            runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            scope.launch {
                val name = withContext(Dispatchers.IO) { runCatching { WaveWorkshopImports.name(context, uri) }.getOrDefault("Mon son") }
                tools.setPad(slot, uri, name)
            }
        }
    }
    LazyColumn(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Pads", color = Color.White, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                WaveControl(if (tools.padPaused) Icons.Default.PlayArrow else Icons.Default.Pause, "Pause ou reprise du pad", enabled = tools.activePad != null && !tools.padLoading) { tools.togglePadPause() }
                WaveControl(Icons.Default.Stop, "Arrêter les pads", enabled = tools.activePad != null) { tools.stopAllPads() }
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.VolumeUp, null, tint = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.size(18.dp))
                WaveOutputFader(tools.padVolume, tools::volume, Modifier.weight(1f).height(40.dp))
                Text("${(tools.padVolume * 100).toInt()} %", color = Color(0xFFB4B1BC), fontSize = 11.sp, modifier = Modifier.width(38.dp))
            }
        }
        item {
            Column(Modifier.hifiBlackSurface(12.dp).padding(horizontal = 10.dp)) {
                MixerToolToggle("Compte à rebours avant le beat", tools.countdownBefore, tools::intro)
                MixerToolToggle("DJ Horn à la fin", tools.hornAfter, tools::outro)
            }
        }
        items(5) { row ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                repeat(3) { column ->
                    val index = row * 3 + column
                    val pad = tools.pads[index]
                    val selected = tools.activePad == index
                    val accent = pad?.let { Color(it.color) } ?: Color(0xFF65616F)
                    Column(Modifier.weight(1f).height(76.dp).hifiBlackSurface(12.dp)
                        .border(.75.dp, accent.copy(alpha = if (selected) .95f else .24f), RoundedCornerShape(12.dp))
                        .combinedClickable(onClick = {
                            if (pad == null) { target = index; importer.launch(arrayOf("audio/*")) } else tools.trigger(index)
                        }, onLongClick = { editing = index }).padding(6.dp),
                        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        if (selected && tools.padLoading) CircularProgressIndicator(Modifier.size(18.dp), color = accent, strokeWidth = 2.dp)
                        else Icon(if (pad == null) Icons.Default.Add else if (selected) Icons.Default.GraphicEq else Icons.Default.PlayArrow, null, tint = accent, modifier = Modifier.size(22.dp))
                        Spacer(Modifier.height(5.dp))
                        Text(pad?.title ?: "Ajouter", color = if (selected) accent else Color(0xFFCECBD5), fontSize = 11.sp,
                            maxLines = 2, overflow = TextOverflow.Ellipsis, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                    }
                }
            }
        }
        item { Text("Appui long pour remplacer ou rétablir un pad.", color = Color(0xFF898593), fontSize = 10.sp) }
        tools.error?.let { message -> item { Text(message, color = Color(0xFFC88B90), fontSize = 11.sp) } }
    }
    editing?.let { index ->
        AlertDialog(onDismissRequest = { editing = null }, containerColor = Color(0xFF141419),
            title = { Text(tools.pads[index]?.title ?: "Ajouter un pad") },
            text = { Text("Choisis un son de ton téléphone ou rétablis cet emplacement.") },
            confirmButton = { TextButton(onClick = { editing = null; target = index; importer.launch(arrayOf("audio/*")) }) { Text("Importer", color = WaveMixerTheme.capsuleAccentSoft) } },
            dismissButton = { TextButton(onClick = { tools.restorePad(index); editing = null }) { Text("Rétablir", color = WaveMixerTheme.capsuleAccentSoft) } })
    }
}

@Composable
internal fun WaveMixerChrono(state: WaveMixerDeckState, modifier: Modifier) {
    val tools = state.tools
    var minutes by remember { mutableStateOf((tools.durationSeconds / 60).toString()) }
    var seconds by remember { mutableStateOf((tools.durationSeconds % 60).toString()) }
    val remaining = (tools.remainingMs + 999) / 1000
    Column(modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        MixerToolToggle("Chronomètre", tools.timerEnabled, tools::enable)
        Column(Modifier.fillMaxWidth().hifiBlackSurface(14.dp).padding(vertical = 18.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text("%02d:%02d".format(remaining / 60, remaining % 60), fontSize = 42.sp, fontFamily = FontFamily.Monospace,
                color = if (tools.timerEnabled) WaveMixerTheme.capsuleAccentSoft else Color(0xFF77737F))
            Text(if (tools.pendingStart) "Départ après le pad…" else if (tools.timerRunning) "En cours" else "Compte à rebours", color = Color(0xFFAAA6B3), fontSize = 11.sp)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            OutlinedTextField(minutes, { value -> minutes = value.filter(Char::isDigit).take(2); tools.configure(minutes.toIntOrNull() ?: 0, seconds.toIntOrNull() ?: 0) }, label = { Text("Minutes") },
                enabled = !tools.timerRunning && !tools.pendingStart, singleLine = true, modifier = Modifier.weight(1f), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
            OutlinedTextField(seconds, { value -> seconds = value.filter(Char::isDigit).take(2).let { if ((it.toIntOrNull() ?: 0) > 59) "59" else it }; tools.configure(minutes.toIntOrNull() ?: 0, seconds.toIntOrNull() ?: 0) }, label = { Text("Secondes") },
                enabled = !tools.timerRunning && !tools.pendingStart, singleLine = true, modifier = Modifier.weight(1f), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
                if (!tools.timerRunning && !tools.pendingStart) {
                    val desired = ((minutes.toIntOrNull() ?: 0).coerceIn(0, 99) * 60 + (seconds.toIntOrNull() ?: 0).coerceIn(0, 59)).coerceAtLeast(1)
                    if (desired != tools.durationSeconds) tools.configure(desired / 60, desired % 60)
                }
                state.toggleChrono()
            }, enabled = tools.timerEnabled, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = WaveMixerTheme.primaryCta)) {
                Text(if (tools.timerRunning || tools.pendingStart) "Pause" else if (tools.remainingMs < tools.durationSeconds * 1000L) "Reprendre" else "Démarrer", fontSize = 12.sp)
            }
            TextButton(onClick = { state.pause(); tools.configure(minutes.toIntOrNull() ?: 0, seconds.toIntOrNull() ?: 0) }, modifier = Modifier.weight(1f)) {
                Text("Réinitialiser", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 12.sp)
            }
        }
        Text("Activé, le chrono suit Lecture et Pause du lecteur. À zéro, le beat s’arrête.", color = Color(0xFF9995A3), fontSize = 11.sp)
        MixerToolToggle("Compte à rebours avant le beat", tools.countdownBefore, tools::intro)
        MixerToolToggle("DJ Horn à la fin", tools.hornAfter, tools::outro)
    }
}

@Composable
private fun MixerToolToggle(label: String, value: Boolean, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 44.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = Color(0xFFD5D2DD), fontSize = 12.sp, modifier = Modifier.weight(1f))
        Switch(value, onChange, colors = SwitchDefaults.colors(checkedTrackColor = WaveMixerTheme.primaryCta, checkedThumbColor = Color(0xFFE4DEEF)))
    }
}
