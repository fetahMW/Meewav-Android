package com.meewav.android.features.rooms.wave

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.*
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.*
import androidx.compose.ui.platform.*
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.*
import kotlinx.coroutines.delay

/** Shared by every native room, including the fullscreen presentation. */
@Stable
internal class RoomVideoControls {
    var visible by mutableStateOf(true)
    var touching by mutableStateOf(false)
    var focused by mutableStateOf(false)
    var activity by mutableIntStateOf(0)
    var cameraEnabled by mutableStateOf(true)
    var liveCamera by mutableStateOf(false)
    var frontCamera by mutableStateOf(true)
    var returnAudio by mutableStateOf(true)
    var modalOpen by mutableStateOf(false)
    var sharingRequested by mutableStateOf(false)
    fun reveal() { visible = true; activity++ }
}

/** Observe touches without consuming them: guest selection, dragging and PiP still own gestures. */
internal fun Modifier.roomVideoTouches(controls: RoomVideoControls) = pointerInput(controls) {
    awaitPointerEventScope {
        while (true) {
            val event = awaitPointerEvent(PointerEventPass.Initial)
            controls.touching = event.changes.any { it.pressed }
            if (event.changes.any { it.pressed != it.previousPressed }) controls.reveal()
        }
    }
}

@Composable
internal fun rememberRoomVideoControls(): RoomVideoControls {
    val controls = remember { RoomVideoControls() }
    val accessibility = LocalAccessibilityManager.current
    LaunchedEffect(controls.activity, controls.modalOpen, controls.sharingRequested, controls.touching, controls.focused) {
        if (!controls.modalOpen && !controls.sharingRequested && !controls.touching && !controls.focused) {
            delay(accessibility?.calculateRecommendedTimeoutMillis(3000L, containsIcons = true, containsText = false, containsControls = true) ?: 3000L)
            controls.visible = false
        }
    }
    val context = LocalContext.current
    DisposableEffect(controls) {
        onDispose { context.stopService(Intent(context, RoomScreenCaptureService::class.java)) }
    }
    return controls
}

@Composable
internal fun RoomVideoControlBar(controls: RoomVideoControls, fullscreen: Boolean, onFullscreen: () -> Unit, onDirector: () -> Unit,
    modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val sharing by RoomScreenCaptureService.active.collectAsState()
    val error by RoomScreenCaptureService.failure.collectAsState()
    LaunchedEffect(sharing, error) {
        if (sharing || error != null) controls.sharingRequested = false
        error?.let { Toast.makeText(context, it, Toast.LENGTH_LONG).show(); RoomScreenCaptureService.clearFailure() }
    }
    val capturePermission = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val data = result.data
        if (result.resultCode == Activity.RESULT_OK && data != null) {
            try {
                context.startForegroundService(Intent(context, RoomScreenCaptureService::class.java)
                    .putExtra("resultCode", result.resultCode).putExtra("captureData", data))
            } catch (_: Exception) {
                controls.sharingRequested = false
                Toast.makeText(context, "Impossible de démarrer la capture d’écran.", Toast.LENGTH_LONG).show()
            }
        } else controls.sharingRequested = false
        controls.reveal()
    }
    AnimatedVisibility(visible = controls.visible, modifier = modifier,
        enter = fadeIn(tween(160)) + slideInVertically(tween(160)) { it / 5 },
        exit = fadeOut(tween(220)) + slideOutVertically(tween(220)) { it / 5 }) {
        Row(Modifier.onFocusChanged { controls.focused = it.hasFocus }.clip(CircleShape)
            .background(Brush.verticalGradient(listOf(Color(0xF0191B20), Color(0xF0030406), Color(0xF00B0D12))))
            .border(.7.dp, Brush.verticalGradient(listOf(Color(0x667A718E), Color(0x224D475E), Color(0x665D507B))), CircleShape)
            .padding(horizontal = 3.dp, vertical = 2.dp), verticalAlignment = Alignment.CenterVertically) {
            RoomVideoButton(WaveIcons.More, "Régie vidéo", controls, action = onDirector)
            RoomVideoButton(if (controls.cameraEnabled) Icons.Default.Videocam else WaveIcons.CameraOff,
                if (controls.cameraEnabled) "Couper ma caméra" else "Activer ma caméra", controls,
                off = !controls.cameraEnabled) { controls.cameraEnabled = !controls.cameraEnabled }
            RoomVideoButton(if (sharing) Icons.Default.StopScreenShare else Icons.Default.ScreenShare,
                if (sharing) "Arrêter la capture d’écran" else "Partager mon écran", controls,
                selected = sharing, enabled = !controls.sharingRequested) {
                if (sharing) context.stopService(Intent(context, RoomScreenCaptureService::class.java))
                else controls.modalOpen = true
            }
            RoomVideoButton(if (fullscreen) Icons.Default.CloseFullscreen else WaveIcons.Expand,
                if (fullscreen) "Quitter le plein écran" else "Plein écran", controls, action = onFullscreen)
        }
    }
    if (controls.modalOpen) AlertDialog(
        onDismissRequest = { controls.modalOpen = false; controls.reveal() },
        containerColor = Color(0xFF111216), titleContentColor = Color.White, textContentColor = Color(0xFFC4C1CC),
        title = { Text("Partager mon écran") },
        text = { Text("Cette room est en démonstration : tu peux ouvrir un aperçu local de ton écran. La diffusion aux participants nécessite encore le raccordement RTC.") },
        confirmButton = { TextButton(onClick = {
            controls.modalOpen = false; controls.sharingRequested = true
            val manager = context.getSystemService(MediaProjectionManager::class.java)
            try { capturePermission.launch(manager.createScreenCaptureIntent()) }
            catch (_: Exception) { controls.sharingRequested = false }
        }) { Text("Ouvrir l’aperçu", color = WaveMixerTheme.capsuleAccentSoft) } },
        dismissButton = { TextButton(onClick = { controls.modalOpen = false; controls.reveal() }) { Text("Annuler", color = Color.Gray) } })
}

@Composable
private fun RoomVideoButton(icon: ImageVector, label: String, controls: RoomVideoControls,
    off: Boolean = false, selected: Boolean = false, enabled: Boolean = true, action: () -> Unit) {
    val interactions = remember { MutableInteractionSource() }
    val pressed by interactions.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) .90f else 1f, tween(120), label = "video-button")
    // 34 dp visible iOS button, surrounded by a separate 48 dp Android touch target.
    Box(Modifier.size(48.dp).semantics { contentDescription = label }
        .clickable(interactionSource = interactions, indication = null, enabled = enabled, role = Role.Button) {
            controls.reveal(); action()
        }, contentAlignment = Alignment.Center) {
        Box(Modifier.size(34.dp).scale(scale).clip(CircleShape)
            .background(Brush.verticalGradient(listOf(Color(0xFF303039), Color(0xFF08090D), Color(0xFF15121D))))
            .border(.65.dp, if (selected) WaveMixerTheme.capsuleAccentSoft else Color(0xFF494450), CircleShape),
            contentAlignment = Alignment.Center) {
            Icon(icon, null, modifier = Modifier.size(16.dp), tint = when {
                !enabled -> Color.Gray; off -> Color(0xFFE39AA6); selected -> WaveMixerTheme.capsuleAccentSoft; else -> Color(0xFFE5E2EC)
            })
        }
    }
}

@Composable
internal fun RoomHostVideo(controls: RoomVideoControls, active: Boolean = true, demo: @Composable () -> Unit) {
    val sharing by RoomScreenCaptureService.active.collectAsState()
    val frame by RoomScreenCaptureService.frame.collectAsState()
    Box(Modifier.fillMaxSize().background(Color.Black), contentAlignment = Alignment.Center) {
        when {
            sharing -> {
                frame?.let { Image(it.asImageBitmap(), "Aperçu local de l’écran", Modifier.fillMaxSize()) }
                Text("ÉCRAN · APERÇU LOCAL", color = WaveMixerTheme.capsuleAccentSoft, fontSize = 9.sp,
                    modifier = Modifier.align(Alignment.TopCenter).background(Color.Black.copy(alpha = .8f)).padding(5.dp))
            }
            !controls.cameraEnabled -> Icon(WaveIcons.CameraOff, "Caméra coupée", tint = Color.Gray, modifier = Modifier.size(28.dp))
            controls.liveCamera && active -> RoomCameraPreview(front = controls.frontCamera)
            controls.liveCamera -> Unit // Only the visible window owns the physical camera.
            else -> demo()
        }
    }
}
