package com.meewav.android.features.rooms.wave

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalDensity
import kotlinx.coroutines.delay
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsDraggedAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState

private val accent = WaveMixerTheme.capsuleAccentSoft
private val text = Color(0xFFEAE8F0)
private val secondary = Color(0xFF96949F)
private enum class CardRail { NONE, DURATION, VOLUME, PINS }

@Composable
internal fun WaveVoteControls(clip: WaveCompositionClip, state: WaveCompositionState, duration: Int,
    onDuration: (Int) -> Unit, onLaunch: () -> Unit, onMessage: () -> Unit) {
    var rail by remember(clip.id) { mutableStateOf(CardRail.NONE) }
    var adjusting by remember { mutableStateOf(false) }
    val interaction = remember { MutableInteractionSource() }
    val dragged by interaction.collectIsDraggedAsState()
    val pressed by interaction.collectIsPressedAsState()
    LaunchedEffect(rail, state.auditionGain(clip.id), adjusting, dragged, pressed) { if (rail == CardRail.VOLUME && !adjusting && !dragged && !pressed) { delay(3000); rail = CardRail.NONE } }
    val locked = state.vote != null || clip.id in state.preparing
    val slide = with(LocalDensity.current) { 16.dp.roundToPx() }
    Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
        CardCommand(if (rail == CardRail.DURATION) Icons.Default.ChevronLeft else Icons.Default.Timer, "${duration}s", enabled = !locked, modifier = Modifier.width(62.dp)) {
            rail = if (rail == CardRail.DURATION) CardRail.NONE else CardRail.DURATION
        }
        Box(Modifier.weight(1f).fillMaxHeight().clipToBounds()) {
            AnimatedContent(rail, transitionSpec = {
                (fadeIn(tween(150)) + slideInHorizontally(spring(dampingRatio = .9f, stiffness = 430f)) { -slide }) togetherWith fadeOut(tween(150))
            }, label = "Commandes du vote") { current ->
                Row(Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    if (current == CardRail.DURATION) listOf(30, 60, 90).forEach { seconds ->
                        Box(Modifier.weight(1f).height(36.dp).hifiBlackSurface(8.dp).clickable(enabled = !locked) { onDuration(seconds); rail = CardRail.NONE }, contentAlignment = Alignment.Center) {
                            Text("$seconds s", color = if (duration == seconds) accent else text, fontSize = 11.sp)
                        }
                    } else {
                        CardCommand(if (current == CardRail.VOLUME) Icons.Default.ChevronLeft else Icons.Default.VolumeUp,
                            "${kotlin.math.round(state.auditionGain(clip.id) * 100).toInt()}", enabled = !locked, modifier = Modifier.width(62.dp)) { rail = if (rail == CardRail.VOLUME) CardRail.NONE else CardRail.VOLUME }
                        if (current == CardRail.VOLUME) Slider(state.auditionGain(clip.id), { adjusting = true; state.auditionVolume(clip.id, it) },
                            modifier = Modifier.weight(1f), enabled = !locked, onValueChangeFinished = { adjusting = false }, interactionSource = interaction, steps = 99,
                            colors = SliderDefaults.colors(thumbColor = accent, activeTrackColor = accent))
                        else {
                            CardCommand(Icons.Default.ChatBubbleOutline, "Message", modifier = Modifier.weight(1f), onClick = onMessage)
                            CardCommand(Icons.Default.HowToVote, "Vote", selected = true, enabled = !locked, modifier = Modifier.weight(1f), onClick = onLaunch)
                        }
                    }
                }
            }
        }
    }
}

@Composable
internal fun WaveMixControls(clip: WaveCompositionClip, state: WaveCompositionState) {
    var rail by remember(clip.id) { mutableStateOf(CardRail.NONE) }
    var adjusting by remember { mutableStateOf(false) }
    val interaction = remember { MutableInteractionSource() }
    val dragged by interaction.collectIsDraggedAsState()
    val pressed by interaction.collectIsPressedAsState()
    val pinScroll = rememberScrollState()
    val density = LocalDensity.current
    LaunchedEffect(state.selectedPinId) {
        val index = state.pinsFor(clip.id).indexOfFirst { it.id == state.selectedPinId }
        if (index >= 0) pinScroll.animateScrollTo((with(density) { (index * 52).dp.roundToPx() } - pinScroll.viewportSize / 2).coerceAtLeast(0))
    }
    LaunchedEffect(rail, clip.gain, adjusting, dragged, pressed) { if (rail == CardRail.VOLUME && !adjusting && !dragged && !pressed) { delay(3000); rail = CardRail.NONE } }
    Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        if (rail != CardRail.VOLUME) CardCommand(if (rail == CardRail.PINS) Icons.Default.ChevronLeft else Icons.Default.PushPin,
            if (rail == CardRail.PINS) "" else state.pinsFor(clip.id).size.takeIf { it > 0 }?.toString() ?: "∞") {
            rail = if (rail == CardRail.PINS) CardRail.NONE else CardRail.PINS
            state.selectPin(if (rail == CardRail.PINS) state.pinsFor(clip.id).firstOrNull()?.id else null)
        }
        Box(Modifier.weight(1f).clipToBounds()) {
            AnimatedContent(rail, transitionSpec = {
                (fadeIn(tween(140)) + slideInHorizontally(tween(220)) { it / 6 }) togetherWith fadeOut(tween(80))
            }, label = "Commandes de composition") { current ->
                Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                    when (current) {
                        CardRail.PINS -> {
                            Row(Modifier.weight(1f).horizontalScroll(pinScroll), verticalAlignment = Alignment.CenterVertically) {
                                val pins = state.pinsFor(clip.id)
                                if (pins.isEmpty()) Text("Partout", color = secondary, fontSize = 10.sp)
                                pins.forEachIndexed { index, pin -> CardCommand(Icons.Default.Repeat, "${index + 1}", state.selectedPinId == pin.id) { state.selectPin(pin.id) } }
                            }
                            WaveControl(Icons.Default.Add, "Placer la boucle sur la base", enabled = state.canAddPin(clip.id)) { state.addPin(clip.id) }
                        }
                        CardRail.VOLUME -> Slider(clip.gain, { adjusting = true; state.gain(clip.id, it) },
                            onValueChangeFinished = { adjusting = false }, interactionSource = interaction, steps = 99, colors = SliderDefaults.colors(thumbColor = accent, activeTrackColor = accent))
                        else -> {
                            CardCommand(null, "M", clip.mute) { state.mute(clip.id) }
                            CardCommand(null, "S", clip.solo) { state.solo(clip.id) }
                        }
                    }
                }
            }
        }
        if (rail != CardRail.PINS) WaveControl(Icons.Default.VolumeUp, "Volume de ${clip.title}", rail == CardRail.VOLUME) {
            rail = if (rail == CardRail.VOLUME) CardRail.NONE else CardRail.VOLUME
        }
        WaveControl(Icons.Default.Close, if (rail == CardRail.PINS) "Supprimer l’épingle" else "Retirer la boucle",
            enabled = rail != CardRail.PINS || state.selectedPinId != null) {
            if (rail == CardRail.PINS) state.removePin() else state.remove(clip.id)
        }
    }
}

@Composable
private fun CardCommand(icon: ImageVector?, label: String, selected: Boolean = false, enabled: Boolean = true, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(modifier.height(44.dp).widthIn(min = 44.dp).hifiBlackSurface(8.dp)
        .clickable(enabled = enabled, onClick = onClick).padding(horizontal = 7.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.CenterVertically) {
        val tint = (if (selected) accent else text).copy(alpha = if (enabled) 1f else .4f)
        if (icon != null) Icon(icon, label.ifBlank { "Retour" }, tint = tint, modifier = Modifier.size(15.dp))
        if (label.isNotEmpty()) Text(label, color = tint, fontSize = 10.sp, maxLines = 1)
    }
}
