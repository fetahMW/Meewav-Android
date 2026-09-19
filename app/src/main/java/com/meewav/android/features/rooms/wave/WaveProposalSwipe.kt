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
import kotlinx.coroutines.launch
import kotlin.math.abs

/** Qualification gesture, deliberately distinct from the mixer's action rail. */
@Composable
internal fun WaveProposalSwipe(id: String, reviewId: String?, onReview: (String?) -> Unit,
    onAccept: () -> Unit, onReject: (String) -> Unit, content: @Composable () -> Unit) {
    val offset = remember(id) { Animatable(0f) }
    val scope = rememberCoroutineScope()
    val density = LocalDensity.current
    val threshold = with(density) { 72.dp.toPx() }
    val flickMinimum = with(density) { 36.dp.toPx() }
    val projectedMinimum = with(density) { 144.dp.toPx() }
    val haptic = LocalHapticFeedback.current
    var drag by remember(id) { mutableFloatStateOf(0f) }
    var dragging by remember(id) { mutableStateOf(false) }
    var departing by remember(id) { mutableStateOf(false) }
    var crossed by remember(id) { mutableStateOf(false) }
    val reviewing = reviewId == id
    val currentReview by rememberUpdatedState(reviewing)
    val accept by rememberUpdatedState(onAccept)
    val review by rememberUpdatedState(onReview)
    LaunchedEffect(reviewing) { if (!reviewing && !departing) offset.animateTo(0f, spring(dampingRatio = .9f)) }
    BoxWithConstraints(Modifier.fillMaxWidth()) {
        val width = constraints.maxWidth.toFloat()
        Box(Modifier.fillMaxWidth().heightIn(min = 92.dp).pointerInput(id, reviewing, departing) {
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
                if (currentReview) { if (delta > threshold * .45f) review(null); return@detectHorizontalDragGestures }
                val projected = delta + speed * .12f
                val commit = abs(delta) >= threshold || (abs(delta) >= flickMinimum && abs(projected) >= projectedMinimum && delta * speed > 0)
                if (commit) {
                    departing = true
                    scope.launch {
                        offset.snapTo(delta)
                        offset.animateTo(if (delta > 0) width else -width, tween(260, easing = CubicBezierEasing(.3f, 0f, .65f, 1f)))
                        if (delta > 0) accept() else review(id)
                        departing = false
                    }
                } else scope.launch { offset.snapTo(delta); offset.animateTo(0f, spring(dampingRatio = .9f)) }
            })
        }) {
            if (reviewing) Column(Modifier.fillMaxWidth().hifiBlackSurface(13.dp).padding(10.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Motif", color = Color(0xFFB4ABCC), fontSize = 11.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("Hors consignes", "Choix artistique", "Autre").forEach { reason ->
                        Box(Modifier.weight(1f).height(44.dp).hifiBlackSurface(7.dp).clickable { onReject(reason); onReview(null) }, contentAlignment = Alignment.Center) {
                            Text(reason, color = Color(0xFFEAE8F0), fontSize = 10.sp)
                        }
                    }
                }
                Text("Annuler", color = WaveMixerTheme.capsuleAccentSoft, modifier = Modifier.clickable { onReview(null) }.padding(5.dp))
            } else Box(Modifier.fillMaxWidth().graphicsLayer {
                translationX = if (dragging) drag else offset.value
                rotationZ = ((translationX / width) * 7f).coerceIn(-7f, 7f)
            }) { content(); if (departing) Box(Modifier.matchParentSize().clickable(enabled = true) {}) }
        }
    }
}
