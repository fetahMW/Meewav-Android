package com.meewav.android.features.rooms.wave

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Live is opt-in and server-backed. A missing room id cannot silently publish the demo. */
@Composable internal fun WaveLiveAudioControl(session: RoomsAudioSession?, modifier: Modifier = Modifier) {
    if (session == null) return
    val status by session.status.collectAsState()
    var expanded by remember { mutableStateOf(false) }
    var mode by remember { mutableStateOf(RoomsAudioMode.EXTERNAL) }
    var permissionError by remember { mutableStateOf(false) }
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        permissionError = !granted
        if (granted) session.start(mode)
    }
    Column(modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TextButton(onClick = { expanded = true }, enabled = !status.active && !status.busy, modifier = Modifier.weight(1f)) {
                Text(mode.label, color = WaveMixerTheme.violetSoft, fontSize = 11.sp)
            }
            TextButton(onClick = {
                if (status.active || status.busy) session.stop()
                else if (mode == RoomsAudioMode.LISTEN) session.start(mode)
                else permission.launch(Manifest.permission.RECORD_AUDIO)
            }) { Text(if (status.active || status.busy) "Déconnecter" else "Connecter", color = WaveMixerTheme.violetSoft, fontSize = 11.sp) }
        }
        Text(if (permissionError) "Autorise le micro pour diffuser" else status.text, color = WaveMixerTheme.secondary, fontSize = 10.sp)
        DropdownMenu(expanded, { expanded = false }) {
            RoomsAudioMode.entries.forEach { option -> DropdownMenuItem(text = { Text(option.label) }, onClick = { mode = option; expanded = false }) }
        }
    }
}
