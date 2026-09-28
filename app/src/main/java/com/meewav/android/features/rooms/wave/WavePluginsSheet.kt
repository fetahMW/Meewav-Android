package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val pluginMuted = Color(0xFFAAA6B4)
private val pluginAccent = WaveMixerTheme.capsuleAccentSoft

/** Inventory of effects actually shipped in this build; never claims to load desktop binaries. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun WavePluginsSheet(
    onDismiss: () -> Unit,
    tuneOn: Boolean, onTune: () -> Unit,
    reverbOn: Boolean, onReverb: () -> Unit,
    effects: Int = 0, onEffects: (Int) -> Unit = {},
    cleanVoice: Boolean = false, onCleanVoice: () -> Unit = {}, onCalibrate: () -> Unit = {},
    nativeEffects: Boolean = true,
) {
    ModalBottomSheet(onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        containerColor = Color(0xFF111214), contentColor = WaveMixerTheme.pearl,
        dragHandle = null, scrimColor = Color.Black.copy(alpha = .6f)) {
        Column(Modifier.fillMaxWidth().heightIn(max = 660.dp).navigationBarsPadding()
            .hifiBlackSurface(24.dp).padding(horizontal = 16.dp)) {
            Box(Modifier.align(Alignment.CenterHorizontally).padding(top = 9.dp)
                .size(34.dp, 3.dp).background(Color(0xFF5E5B66), RoundedCornerShape(2.dp)))
            Row(Modifier.fillMaxWidth().height(68.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Extension, null, tint = pluginAccent, modifier = Modifier.size(25.dp))
                Column(Modifier.weight(1f).padding(start = 10.dp)) {
                    Text("Plugins", fontSize = 21.sp, fontWeight = FontWeight.Bold)
                    Text("Ta collection d’effets", color = pluginMuted, fontSize = 12.sp)
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(44.dp).satinControl(12.dp)) {
                    Icon(Icons.Default.Close, "Fermer les plugins", modifier = Modifier.size(20.dp))
                }
            }
            Column(Modifier.weight(1f, fill = false).verticalScroll(rememberScrollState()).padding(bottom = 18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.fillMaxWidth().satinControl(16.dp).padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Ajouter des plugins", fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        PluginUnavailableAction("Télécharger", Icons.Default.Download, Modifier.weight(1f))
                        PluginUnavailableAction("Installer", Icons.Default.FileDownloadDone, Modifier.weight(1f))
                    }
                    Text("L’ajout de plugins externes n’est pas encore disponible sur Android. Les modules MeeWav ci-dessous sont déjà inclus.",
                        color = pluginMuted, fontSize = 12.sp, lineHeight = 17.sp)
                }
                Row(Modifier.fillMaxWidth().padding(top = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("Modules MeeWav", Modifier.weight(1f), fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Text("INCLUS", color = pluginAccent, fontSize = 9.sp, letterSpacing = 1.sp)
                }
                Column(Modifier.fillMaxWidth().satinControl(16.dp).padding(horizontal = 12.dp, vertical = 4.dp)) {
                    PluginModule("Autotune", "Correction de la voix", Icons.Default.GraphicEq, tuneOn, onTune)
                    PluginDivider()
                    PluginModule("Réverb", "Espace et profondeur", Icons.Default.AutoAwesome, reverbOn, onReverb)
                    if (nativeEffects) {
                        listOf(
                            Triple(64, "Délai", "Écho vocal"),
                            Triple(128, "Saturation", "Grain et chaleur"),
                            Triple(256, "Limiteur", "Maîtrise des crêtes"),
                        ).forEach { (flag, title, detail) ->
                            PluginDivider()
                            PluginModule(title, detail, when (flag) {
                                64 -> Icons.Default.Repeat; 128 -> Icons.Default.Waves; else -> Icons.Default.Compress
                            }, effects and flag != 0) { onEffects(effects xor flag) }
                        }
                        PluginDivider()
                        PluginModule("Anti-souffle", "Réduction du bruit de fond", Icons.Default.Mic, cleanVoice, onCleanVoice)
                        if (cleanVoice) TextButton(onClick = onCalibrate, modifier = Modifier.align(Alignment.End)) {
                            Text("Calibrer en silence", color = pluginAccent, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PluginUnavailableAction(label: String, icon: ImageVector, modifier: Modifier) {
    // No import picker/download request until an Android plugin format and host are available.
    OutlinedButton(onClick = {}, enabled = false, modifier = modifier.height(44.dp),
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.outlinedButtonColors(disabledContentColor = pluginMuted),
        contentPadding = PaddingValues(horizontal = 8.dp)) {
        Icon(icon, null, modifier = Modifier.size(16.dp))
        Spacer(Modifier.width(6.dp))
        Text(label, fontSize = 12.sp, maxLines = 1)
    }
}

@Composable
private fun PluginModule(title: String, detail: String, icon: ImageVector, enabled: Boolean, onToggle: () -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 58.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(Modifier.size(34.dp).satinControl(10.dp, selected = enabled), contentAlignment = Alignment.Center) {
            Icon(icon, null, tint = if (enabled) pluginAccent else pluginMuted, modifier = Modifier.size(17.dp))
        }
        Column(Modifier.weight(1f).padding(horizontal = 10.dp)) {
            Text(title, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            Text(detail, color = pluginMuted, fontSize = 11.sp)
        }
        Switch(enabled, { onToggle() }, modifier = Modifier.semantics { contentDescription = "Activer $title" },
            colors = SwitchDefaults.colors(checkedTrackColor = WaveMixerTheme.primaryCta,
                checkedThumbColor = WaveMixerTheme.pearl, uncheckedTrackColor = Color(0xFF2B2931), uncheckedThumbColor = pluginMuted))
    }
}

@Composable
private fun PluginDivider() {
    HorizontalDivider(color = Color.White.copy(alpha = .06f), thickness = .5.dp)
}
