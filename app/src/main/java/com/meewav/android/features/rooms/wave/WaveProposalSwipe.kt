package com.meewav.android.features.rooms.wave

import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.input.pointer.util.VelocityTracker
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import kotlinx.coroutines.launch
import kotlin.math.abs

/** Qualification gesture, deliberately distinct from the mixer's action rail. */
@Composable
internal fun WaveProposalSwipe(id: String, onVote: () -> Unit, onDelete: () -> Unit, content: @Composable () -> Unit) {
    val offset = remember(id) { Animatable(0f) }
    val scope = rememberCoroutineScope()
    val density = LocalDensity.current
    val threshold = with(density) { 72.dp.toPx() }
    val haptic = LocalHapticFeedback.current
    var drag by remember(id) { mutableFloatStateOf(0f) }
    var dragging by remember(id) { mutableStateOf(false) }
    var departing by remember(id) { mutableStateOf(false) }
    var crossed by remember(id) { mutableStateOf(false) }
    val vote by rememberUpdatedState(onVote)
    val delete by rememberUpdatedState(onDelete)
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val width = constraints.maxWidth.toFloat()
        Box(Modifier.fillMaxWidth().semantics {
            customActions = listOf(
                CustomAccessibilityAction("Envoyer au vote") { if (!departing) { vote(); true } else false },
                CustomAccessibilityAction("Supprimer la boucle") { if (!departing) { delete(); true } else false })
        }.pointerInput(id, departing) {
            if (departing) return@pointerInput
            val velocity = VelocityTracker()
            detectHorizontalDragGestures(onDragStart = {
                dragging = true; drag = 0f; crossed = false; velocity.resetTracking()
            }, onHorizontalDrag = { change, dx ->
                change.consume(); velocity.addPosition(change.uptimeMillis, change.position); drag += dx
                if (!crossed && abs(drag) >= threshold) { crossed = true; haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove) }
            }, onDragCancel = { dragging = false; drag = 0f }, onDragEnd = {
                val delta = drag; val speed = velocity.calculateVelocity().x
                dragging = false
                val action = resolveWaveProposalGesture(delta / density.density, speed / density.density)
                if (action != WaveProposalGesture.NONE) {
                    departing = true
                    scope.launch {
                        offset.snapTo(delta)
                        offset.animateTo(if (delta > 0) width else -width, tween(260, easing = CubicBezierEasing(.3f, 0f, .65f, 1f)))
                        if (action == WaveProposalGesture.VOTE) vote() else delete()
                        offset.snapTo(0f)
                        departing = false
                    }
                } else scope.launch { offset.snapTo(delta); offset.animateTo(0f, spring(dampingRatio = .9f)) }
            })
        }) {
            if (dragging && abs(drag) > threshold * .25f) Box(Modifier.matchParentSize().padding(horizontal = 12.dp),
                contentAlignment = if (drag > 0f) Alignment.CenterStart else Alignment.CenterEnd) {
                Text(if (drag > 0f) "Vote →" else "← Supprimer",
                    color = if (drag > 0f) WaveMixerTheme.violetSoft else Color(0xFFC88B90), fontSize = 11.sp)
            }
            Box(Modifier.fillMaxWidth().graphicsLayer {
                translationX = if (dragging) drag else offset.value
                rotationZ = ((translationX / width.coerceAtLeast(1f)) * 7f).coerceIn(-7f, 7f)
            }) { content(); if (departing) Box(Modifier.matchParentSize().clickable(enabled = true) {}) }
        }
    }
}
