package com.meewav.android.features.auth

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import com.meewav.android.core.design.Muted

@Composable
internal fun SceneGlobeArrival(state: AuthUiState, onBack: () -> Unit, onEnter: () -> Unit, onClose: () -> Unit) {
    val interactive = state.page == AuthPage.Globe
    val sceneLabel = listOfNotNull(state.profile.musicScene?.label, state.profile.city.takeIf { it.isNotBlank() })
        .distinct().joinToString(" · ")
    if (interactive) {
        var globeLoading by remember { mutableStateOf(true) }
        var dockRotation by remember { mutableStateOf(0) }
        var pendingRotation by remember { mutableStateOf(0) }
        var globeTurning by remember { mutableStateOf(false) }
        val closeAlpha by animateFloatAsState(if (globeTurning) 0f else 1f,
            animationSpec = tween(durationMillis = if (globeTurning) 90 else 180,
                delayMillis = if (globeTurning) 0 else 120), label = "globeCloseFade")
        LaunchedEffect(pendingRotation, closeAlpha, globeLoading) {
            // Reposition only after the close control is invisible.
            if (globeLoading || closeAlpha < .01f) dockRotation = pendingRotation
        }
        Box(Modifier.fillMaxSize().background(Color(0xFF08090D)).safeDrawingPadding()) {
            AuthCompletionGlobe(Modifier.fillMaxSize(), interactive = true, onClick = onEnter,
                onLoadingChange = { globeLoading = it }, previewMessages = state.localPreview,
                homeScene = state.homeScene, onDockRotationChange = { pendingRotation = it },
                onGlobeTurningChange = { globeTurning = it })
            // Reserved right strip in mobile.css keeps this outside Web panels.
            if (!globeLoading) IconButton(onClick = onClose, enabled = !globeTurning && closeAlpha > .9f,
                modifier = Modifier.graphicsLayer { alpha = closeAlpha }.align(if (dockRotation == 90) Alignment.TopStart else Alignment.TopEnd)
                .padding(start = if (dockRotation == 90) 12.dp else 0.dp, end = if (dockRotation == 90) 0.dp else 12.dp,
                    top = if (dockRotation == 180) 116.dp else 12.dp).size(44.dp)) {
                Icon(Icons.Outlined.Close, "Fermer l’application", Modifier.size(18.dp), tint = Color.White)
            }
        }
        return
    }
    BoxWithConstraints(Modifier.fillMaxSize().safeDrawingPadding().padding(12.dp)) {
        val landscape = maxWidth > maxHeight
        // Fit the preview to the remaining height, including during rotation.
        // Its square viewport never takes the whole landscape screen width.
        val globeSize = minOf(maxWidth - 32.dp, (maxHeight - 102.dp).coerceAtLeast(80.dp), 390.dp)
        Box(Modifier.fillMaxWidth().height(42.dp), contentAlignment = Alignment.Center) {
            IconButton(onClick = onBack, modifier = Modifier.align(Alignment.CenterStart)) {
                Icon(Icons.Outlined.ChevronLeft, "Retour", tint = Color.White)
            }
            Image(painterResource(R.drawable.meewav_logo), "Meewav",
                Modifier.then(if (landscape) Modifier.align(Alignment.CenterEnd) else Modifier)
                    .padding(horizontal = 16.dp).width(124.dp).height(34.dp),
                contentScale = ContentScale.Fit)
        }
        Column(Modifier.fillMaxSize().padding(top = if (landscape) 8.dp else 52.dp),
            horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text("Ta scène est prête", color = Color.White,
                fontSize = 23.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
            if (sceneLabel.isNotBlank()) {
                Spacer(Modifier.height(4.dp))
                Text(sceneLabel, color = Muted, fontSize = 12.sp, textAlign = TextAlign.Center, maxLines = 1)
            }
            AuthCompletionGlobe(modifier = Modifier.size(globeSize), onClick = onEnter)
            Text("Touche le globe pour entrer", color = Color.White, fontSize = 14.sp)
        }
    }
}
