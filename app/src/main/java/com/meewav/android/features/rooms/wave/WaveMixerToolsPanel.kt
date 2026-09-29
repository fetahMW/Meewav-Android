package com.meewav.android.features.rooms.wave

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val padsAccent = Color(0xFFA876FF)
private val toolsMuted = Color(0xFFAAA4B3)

@Composable
internal fun WavePadsEntry(onClick: () -> Unit, modifier: Modifier = Modifier) {
    Row(modifier.consoleTabSurface(selected = false).clip(RoundedCornerShape(12.dp))
        .clickable(role = Role.Button, onClickLabel = "Ouvrir les pads et le chronomètre", onClick = onClick)
        .padding(horizontal = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically) {
        Icon(Icons.Default.Apps, null, tint = padsAccent, modifier = Modifier.size(14.dp))
        Text("Pads", color = WaveMixerTheme.pearl, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

/** Uses the existing deck tools; closing the sheet never stops a pad or timer. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WaveMixerToolsSheet(state: WaveMixerDeckState, onDismiss: () -> Unit) {
    val tools = state.tools
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var page by rememberSaveable { mutableIntStateOf(0) }
    var target by rememberSaveable { mutableIntStateOf(6) }
    var editing by remember { mutableStateOf<Int?>(null) }
    val importer = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        state.documentPicker.complete()
        if (uri != null) {
            val slot = target
            runCatching { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            scope.launch {
                val name = withContext(Dispatchers.IO) { runCatching { WaveWorkshopImports.name(context, uri) }.getOrDefault("Mon son") }
                tools.setPad(slot, uri, name)
            }
        }
    }
    fun importPad(index: Int) {
        target = index
        state.documentPicker.launch { importer.launch(arrayOf("audio/*")) }
    }
    ModalBottomSheet(onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        containerColor = Color(0xFF111214), contentColor = WaveMixerTheme.pearl,
        dragHandle = null, scrimColor = Color.Black.copy(alpha = .6f)) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(.88f).navigationBarsPadding().imePadding()
            .hifiBlackSurface(24.dp).padding(horizontal = 16.dp)) {
            Box(Modifier.align(Alignment.CenterHorizontally).padding(top = 9.dp)
                .size(34.dp, 3.dp).background(Color(0xFF5E5B66), RoundedCornerShape(2.dp)))
            Row(Modifier.fillMaxWidth().height(54.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Apps, null, tint = padsAccent, modifier = Modifier.size(22.dp))
                Text("Pads & chrono", Modifier.weight(1f).padding(start = 10.dp), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                WaveControl(Icons.Default.Close, "Fermer les pads et le chronomètre", onClick = onDismiss)
            }
            Row(Modifier.fillMaxWidth().selectableGroup(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                ToolTab("Pads", Icons.Default.Apps, page == 0, { page = 0 }, Modifier.weight(1f))
                ToolTab("Chronomètre", Icons.Default.Timer, page == 1, { page = 1 }, Modifier.weight(1f))
            }
            Spacer(Modifier.height(12.dp))
            if (page == 0) WaveMixerPads(tools, Modifier.weight(1f).fillMaxWidth(), ::importPad, { editing = it })
            else WaveMixerChrono(state, Modifier.weight(1f).fillMaxWidth(), { editing = it })
            Spacer(Modifier.height(10.dp))
        }
    }
    editing?.let { index ->
        AlertDialog(onDismissRequest = { editing = null }, containerColor = Color(0xFF17161B),
            title = { Text(tools.pads[index]?.title ?: "Ajouter un pad", color = WaveMixerTheme.pearl) },
            text = { Text("Remplace ce son par un fichier de ton appareil.", color = toolsMuted) },
            confirmButton = { TextButton(onClick = { editing = null; importPad(index) }) { Text("Importer", color = padsAccent) } },
            dismissButton = { TextButton(onClick = { tools.restorePad(index); editing = null }) { Text("Rétablir", color = toolsMuted) } })
    }
}

@Composable
private fun ToolTab(label: String, icon: ImageVector, active: Boolean, onClick: () -> Unit, modifier: Modifier) {
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    Row(modifier.height(42.dp).consoleTabSurface(selected = active, focused = focused)
        .clip(RoundedCornerShape(12.dp)).selectable(selected = active, role = Role.Tab,
            interactionSource = interaction, indication = null, onClick = onClick).padding(horizontal = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(7.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = if (active) padsAccent else toolsMuted, modifier = Modifier.size(17.dp))
        Text(label, color = WaveMixerTheme.pearl, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

private fun padIcon(index: Int): ImageVector = when (index) {
    0 -> Icons.Default.FavoriteBorder
    1 -> Icons.Default.Campaign
    2 -> Icons.Default.Celebration
    3 -> Icons.Default.ThumbDown
    4 -> Icons.Default.MusicNote
    5 -> Icons.Default.Timer
    else -> Icons.Default.GraphicEq
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun WaveMixerPads(tools: WaveMixerToolsState, modifier: Modifier, onImport: (Int) -> Unit, onEdit: (Int) -> Unit) {
    BoxWithConstraints(modifier) {
        val columns = if (maxWidth < 310.dp) 2 else 3
        LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = PaddingValues(bottom = 4.dp)) {
            item {
                Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.VolumeUp, null, tint = padsAccent, modifier = Modifier.size(18.dp))
                    WaveOutputFader(tools.padVolume, tools::volume, Modifier.weight(1f).height(40.dp), accent = padsAccent, label = "Volume des pads")
                    Text("${(tools.padVolume * 100).toInt()} %", color = toolsMuted, fontSize = 11.sp, modifier = Modifier.width(38.dp))
                    WaveControl(if (tools.padPaused) Icons.Default.PlayArrow else Icons.Default.Pause, "Pause ou reprise du pad",
                        enabled = tools.activePad != null && !tools.padLoading) { tools.togglePadPause() }
                    WaveControl(Icons.Default.Stop, "Arrêter les pads", enabled = tools.activePad != null) { tools.stopAllPads() }
                }
            }
            items((tools.pads.size + columns - 1) / columns) { row ->
                val allEmpty = (row * columns until minOf((row + 1) * columns, tools.pads.size)).all { tools.pads[it] == null }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    repeat(columns) { column ->
                        val index = row * columns + column
                        if (index >= tools.pads.size) Spacer(Modifier.weight(1f)) else {
                            val pad = tools.pads[index]
                            val selected = tools.activePad == index
                            val accent = pad?.let { Color(it.color) } ?: Color(0xFF8E879A)
                            Column(Modifier.weight(1f).heightIn(min = if (allEmpty) 46.dp else 94.dp)
                                .mixerPadSurface(accent, selected && !tools.padPaused, empty = pad == null)
                                .clip(RoundedCornerShape(12.dp)).combinedClickable(role = Role.Button,
                                    onClickLabel = if (pad == null) "Importer un son" else "Jouer ${pad.title}",
                                    onLongClickLabel = "Remplacer ou rétablir ce pad",
                                    onClick = { if (pad == null) onImport(index) else tools.trigger(index) },
                                    onLongClick = { onEdit(index) }).padding(11.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                    if (selected && tools.padLoading) CircularProgressIndicator(Modifier.size(19.dp), color = accent, strokeWidth = 2.dp)
                                    else Icon(if (pad == null) Icons.Default.Add else padIcon(index), null, tint = accent, modifier = Modifier.size(if (pad == null) 15.dp else 19.dp))
                                    if (allEmpty) Text("Ajouter", color = toolsMuted, fontSize = 10.sp, modifier = Modifier.weight(1f).padding(start = 5.dp), maxLines = 1)
                                    else Spacer(Modifier.weight(1f))
                                    Text(if (selected && !allEmpty) { if (tools.padPaused) "Ⅱ" else "●" } else "%02d".format(index + 1),
                                        color = if (selected) accent else Color(0xFF8C8496), fontSize = 10.sp)
                                }
                                if (!allEmpty) Text(pad?.title ?: "Ajouter", color = WaveMixerTheme.pearl, fontWeight = FontWeight.SemiBold,
                                    fontSize = 12.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                            }
                        }
                    }
                }
            }
            item { Text("Appui long pour remplacer un son.", color = toolsMuted, fontSize = 11.sp) }
            tools.error?.let { message -> item { Text(message, color = Color(0xFFC88B90), fontSize = 11.sp) } }
        }
    }
}

@Composable
private fun WaveMixerChrono(state: WaveMixerDeckState, modifier: Modifier, onEdit: (Int) -> Unit) {
    val tools = state.tools
    var minutes by remember { mutableStateOf((tools.durationSeconds / 60).toString()) }
    var seconds by remember { mutableStateOf((tools.durationSeconds % 60).toString()) }
    val remaining = (tools.remainingMs + 999) / 1000
    fun applyDuration() {
        val duration = ((minutes.toIntOrNull() ?: 0).coerceIn(0, 99) * 60 + (seconds.toIntOrNull() ?: 0).coerceIn(0, 59)).coerceAtLeast(1)
        if (duration != tools.durationSeconds) tools.configure(duration / 60, duration % 60)
    }
    Column(modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Column(Modifier.fillMaxWidth().hifiBlackSurface(14.dp).padding(horizontal = 14.dp, vertical = 10.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Compte à rebours", Modifier.weight(1f), color = WaveMixerTheme.pearl, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Switch(tools.timerEnabled, { applyDuration(); tools.enable(it) }, colors = toolSwitchColors())
            }
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Text("%02d:%02d".format(remaining / 60, remaining % 60), fontSize = 38.sp, fontFamily = FontFamily.Monospace,
                    color = if (tools.timerEnabled) WaveMixerTheme.pearl else toolsMuted)
                Text(if (tools.pendingStart) "Départ…" else if (tools.timerRunning) "En cours" else "En attente", color = toolsMuted, fontSize = 11.sp)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DurationField("Minutes", minutes, {
                minutes = it.filter(Char::isDigit).take(2); tools.configure(minutes.toIntOrNull() ?: 0, seconds.toIntOrNull() ?: 0)
            }, !tools.timerRunning && !tools.pendingStart, Modifier.weight(1f))
            DurationField("Secondes", seconds, {
                seconds = it.filter(Char::isDigit).take(2).let { text -> if ((text.toIntOrNull() ?: 0) > 59) "59" else text }
                tools.configure(minutes.toIntOrNull() ?: 0, seconds.toIntOrNull() ?: 0)
            }, !tools.timerRunning && !tools.pendingStart, Modifier.weight(1f))
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ToolAction(if (tools.timerRunning || tools.pendingStart) "Pause" else if (tools.remainingMs < tools.durationSeconds * 1000L) "Reprendre" else "Démarrer",
                if (tools.timerRunning || tools.pendingStart) Icons.Default.Pause else Icons.Default.PlayArrow,
                tools.timerEnabled, tools.timerEnabled, {
                    if (!tools.timerRunning && !tools.pendingStart) applyDuration()
                    state.toggleChrono()
                }, Modifier.weight(1f))
            ToolAction("Réinitialiser", Icons.Default.RestartAlt, false, true, {
                state.pause(); tools.configure(minutes.toIntOrNull() ?: 0, seconds.toIntOrNull() ?: 0)
            }, Modifier.weight(1f))
        }
        Text("Lecture et Pause pilotent aussi le chrono.", color = toolsMuted, fontSize = 11.sp)
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TimerCue(tools, 5, "Au départ", tools.countdownBefore, tools::intro, { onEdit(5) }, Modifier.weight(1f))
            TimerCue(tools, 1, "À la fin", tools.hornAfter, tools::outro, { onEdit(1) }, Modifier.weight(1f))
        }
        tools.error?.let { Text(it, color = Color(0xFFC88B90), fontSize = 11.sp) }
    }
}

@Composable
private fun DurationField(label: String, value: String, onChange: (String) -> Unit, enabled: Boolean, modifier: Modifier) {
    OutlinedTextField(value, onChange, label = { Text(label, fontSize = 11.sp) }, enabled = enabled, singleLine = true,
        modifier = modifier, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(focusedContainerColor = Color(0xFF111114), unfocusedContainerColor = Color(0xFF111114),
            focusedBorderColor = padsAccent, unfocusedBorderColor = Color(0xFF3D3945), focusedTextColor = WaveMixerTheme.pearl,
            unfocusedTextColor = WaveMixerTheme.pearl, cursorColor = padsAccent, focusedLabelColor = padsAccent, unfocusedLabelColor = toolsMuted))
}

@Composable
private fun ToolAction(label: String, icon: ImageVector, active: Boolean, enabled: Boolean, onClick: () -> Unit, modifier: Modifier) {
    Row(modifier.heightIn(min = 42.dp).consoleTabSurface(selected = active).clip(RoundedCornerShape(12.dp))
        .clickable(enabled = enabled, role = Role.Button, onClick = onClick).padding(horizontal = 8.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = if (enabled) padsAccent else toolsMuted, modifier = Modifier.size(16.dp))
        Text(label, color = if (enabled) WaveMixerTheme.pearl else toolsMuted, fontSize = 12.sp, maxLines = 1)
    }
}

@Composable
private fun TimerCue(tools: WaveMixerToolsState, index: Int, label: String, enabled: Boolean, onToggle: (Boolean) -> Unit, onEdit: () -> Unit, modifier: Modifier) {
    val pad = tools.pads[index]
    val accent = Color(pad?.color ?: 0xFFA876FF)
    Column(modifier.mixerPadSurface(accent, enabled).padding(11.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Icon(padIcon(index), null, tint = accent, modifier = Modifier.size(19.dp))
            Text(label, Modifier.weight(1f).padding(start = 7.dp), color = WaveMixerTheme.pearl, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            Icon(Icons.Default.SwapHoriz, "Remplacer le son", tint = toolsMuted,
                modifier = Modifier.size(28.dp).clip(RoundedCornerShape(7.dp)).clickable(role = Role.Button, onClick = onEdit).padding(5.dp))
        }
        Text(pad?.title ?: "Son par défaut", color = toolsMuted, fontSize = 11.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
            IconButton(onClick = { tools.trigger(index) }, modifier = Modifier.size(36.dp)) {
                Icon(Icons.Default.PlayArrow, "Écouter ${pad?.title ?: label}", tint = accent, modifier = Modifier.size(20.dp))
            }
            Switch(enabled, onToggle, colors = toolSwitchColors(accent))
        }
    }
}

@Composable
private fun toolSwitchColors(accent: Color = padsAccent) = SwitchDefaults.colors(
    checkedTrackColor = accent.copy(alpha = .5f), checkedThumbColor = WaveMixerTheme.pearl,
    checkedBorderColor = accent.copy(alpha = .25f), uncheckedTrackColor = Color(0xFF29252F),
    uncheckedThumbColor = Color(0xFF8E879A), uncheckedBorderColor = Color(0xFF4C4558),
)
