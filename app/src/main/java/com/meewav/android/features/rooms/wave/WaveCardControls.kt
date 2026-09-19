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
import androidx.compose.ui.semantics.*
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
    onDuration: (Int) -> Unit, onMessage: () -> Unit, onDuel: () -> Unit) {
    var rail by remember(clip.id) { mutableStateOf(CardRail.NONE) }
    var adjusting by remember { mutableStateOf(false) }
    val interaction = remember { MutableInteractionSource() }
    val dragged by interaction.collectIsDraggedAsState()
    val pressed by interaction.collectIsPressedAsState()
    LaunchedEffect(rail, state.auditionGain(clip.id), adjusting, dragged, pressed) { if (rail == CardRail.VOLUME && !adjusting && !dragged && !pressed) { delay(3000); rail = CardRail.NONE } }
    val locked = state.vote != null || clip.id in state.preparing
    val slide = with(LocalDensity.current) { 16.dp.roundToPx() }
    Row(Modifier.fillMaxWidth().padding(top = 8.dp).height(44.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(5.dp)) {
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
                        if (current == CardRail.VOLUME) WaveOutputFader(state.auditionGain(clip.id), { state.auditionVolume(clip.id, it) }, Modifier.weight(1f).height(40.dp).hifiBlackSurface(9.dp))
                        else {
                            Spacer(Modifier.weight(1f))
                            VoteSquare(Icons.Default.ChatBubbleOutline, "Message", enabled = !locked, onClick = onMessage)
                            VoteSquare(WaveDuelIcon, "Duel de remplacement", enabled = !locked && !clip.isBase, onClick = onDuel)
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
                        CardRail.VOLUME -> WaveOutputFader(clip.gain, { state.gain(clip.id, it) }, Modifier.fillMaxWidth().height(40.dp).hifiBlackSurface(9.dp))
                        else -> {
                            WaveOutputFader(clip.gain, { state.gain(clip.id, it) }, Modifier.fillMaxWidth().height(40.dp).hifiBlackSurface(9.dp))
                        }
                    }
                }
            }
        }
        if (rail != CardRail.PINS) WaveControl(Icons.Default.VolumeUp, "Volume de ${clip.title}", rail == CardRail.VOLUME) {
            rail = if (rail == CardRail.VOLUME) CardRail.NONE else CardRail.VOLUME
        }
        if (rail == CardRail.PINS) WaveControl(Icons.Default.Close, "Supprimer l’épingle",
            enabled = state.selectedPinId != null) {
            state.removePin()
        }
    }
}

@Composable
private fun CardCommand(icon: ImageVector?, label: String, selected: Boolean = false, enabled: Boolean = true, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Row(modifier.height(34.dp).widthIn(min = 34.dp).hifiBlackSurface(8.dp)
        .border(.6.dp, if (selected) accent.copy(alpha = .4f) else Color.Transparent, RoundedCornerShape(8.dp))
        .semantics { this.selected = selected }
        .clickable(enabled = enabled, onClick = onClick).padding(horizontal = 7.dp),
        horizontalArrangement = Arrangement.spacedBy(3.dp, Alignment.CenterHorizontally), verticalAlignment = Alignment.CenterVertically) {
        val tint = (if (selected) accent else text).copy(alpha = if (enabled) 1f else .4f)
        if (icon != null) Icon(icon, label.ifBlank { "Retour" }, tint = tint, modifier = Modifier.size(15.dp))
        if (label.isNotEmpty()) Text(label, color = tint, fontSize = 10.sp, maxLines = 1)
    }
}

@Composable
private fun VoteSquare(icon: ImageVector, label: String, enabled: Boolean, onClick: () -> Unit) {
    Box(Modifier.size(40.dp).clickable(enabled = enabled, onClick = onClick), contentAlignment = Alignment.Center) {
        Box(Modifier.size(34.dp).hifiBlackSurface(8.dp), contentAlignment = Alignment.Center) {
            Icon(icon, label, tint = accent.copy(alpha = if (enabled) 1f else .3f), modifier = Modifier.size(18.dp))
        }
    }
}

@Composable
internal fun WaveMixHeaderControls(clip: WaveCompositionClip, state: WaveCompositionState) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
        CardCommand(null, "Mute", clip.mute, modifier = Modifier.width(44.dp)) { state.mute(clip.id) }
        CardCommand(null, "Solo", clip.solo, modifier = Modifier.width(44.dp)) { state.solo(clip.id) }
    }
}
