package com.meewav.android.features.rooms.wave

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.delay

/** Owns the real studio permission/retry flow; camera denial never blocks audio. */
@Composable internal fun WaveLiveAudioControl(session: RoomsAudioSession?, modifier: Modifier = Modifier,
    onCameraPermission: (Boolean) -> Unit = {}) {
    if (session == null) return
    val status by session.status.collectAsState()
    var permissionError by remember(session) { mutableStateOf(false) }
    var permissionRevision by remember(session) { mutableIntStateOf(0) }
    var requested by remember(session) { mutableStateOf(false) }
    var paused by remember(session) { mutableStateOf(false) }
    val context = LocalContext.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    val cameraPermissionCallback by rememberUpdatedState(onCameraPermission)
    fun granted(permission: String) = ContextCompat.checkSelfPermission(context, permission) == PackageManager.PERMISSION_GRANTED
    val permission = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { granted ->
        permissionError = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED
        cameraPermissionCallback(ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED)
        permissionRevision++
    }
    DisposableEffect(lifecycle, session) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) permissionRevision++
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    LaunchedEffect(session, permissionRevision) {
        val micAllowed = granted(Manifest.permission.RECORD_AUDIO)
        cameraPermissionCallback(granted(Manifest.permission.CAMERA))
        permissionError = !micAllowed
        if (!micAllowed) {
            if (session.status.value.active || session.status.value.busy) session.stop()
            if (!requested) {
                requested = true
                permission.launch(arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA))
            }
        } else if (!paused && !session.status.value.active && !session.status.value.busy) {
            // Let the preceding green-room camera release its device first.
            delay(500)
            session.start(RoomsAudioMode.EXTERNAL)
        }
    }
    Column(modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(if (permissionError) "Autorise le microphone pour diffuser" else status.text,
                color = WaveMixerTheme.secondary, fontSize = 10.sp, modifier = Modifier.weight(1f))
            TextButton(onClick = {
                if (status.active || status.busy) { paused = true; session.stop() }
                else {
                    paused = false
                    if (granted(Manifest.permission.RECORD_AUDIO)) permissionRevision++
                    else permission.launch(arrayOf(Manifest.permission.RECORD_AUDIO, Manifest.permission.CAMERA))
                }
            }) { Text(if (status.active || status.busy) "Déconnecter" else if (permissionError) "Autoriser" else "Reconnecter", color = WaveMixerTheme.violetSoft, fontSize = 11.sp) }
            if (permissionError) TextButton(onClick = {
                context.startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${context.packageName}")))
            }) { Text("Réglages", fontSize = 11.sp) }
        }
        if (!permissionError && !granted(Manifest.permission.CAMERA)) TextButton(onClick = {
            permission.launch(arrayOf(Manifest.permission.CAMERA))
        }) {
            Text("Audio seul · Autoriser la caméra", color = WaveMixerTheme.secondary, fontSize = 10.sp)
        }
    }
}
