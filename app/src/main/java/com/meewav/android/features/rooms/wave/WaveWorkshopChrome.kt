package com.meewav.android.features.rooms.wave

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

private val ink = Color(0xFFEAE8F0)
private val secondary = Color(0xFF96949F)
private val accent = WaveMixerTheme.capsuleAccentSoft

/** Fixed above the workspace lists. Only the deck folds; transport never scrolls away. */
@Composable
internal fun WaveMasterPlayer(state: WaveCompositionState, onImport: () -> Unit, onSettings: () -> Unit) {
    var expanded by rememberSaveable { mutableStateOf(true) }
    val snapshot = state.snapshot
    val duration = state.durationFrames
    val progress = (snapshot.frame.toFloat() / duration).coerceIn(0f, 1f)
    val peaks = remember(state.prepared, state.clips) { state.masterPeaks }
    Column(Modifier.fillMaxWidth().hifiBlackSurface(17.dp).animateContentSize(spring(stiffness = Spring.StiffnessMediumLow))
        .padding(horizontal = 10.dp, vertical = 5.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            WaveRoundPlay(snapshot.running, state.transportPending, progress, "Lecture ou pause de la composition", onClick = state::transport)
            Column(Modifier.weight(1f).padding(start = 8.dp)) {
                Text("Composition live", color = ink, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text("${state.bpm} BPM · ${state.key}", color = secondary, fontSize = 10.sp)
            }
            Text(formatWaveTime(snapshot.frame), color = ink, fontSize = 11.sp, fontFamily = FontFamily.Monospace,
                modifier = Modifier.width(48.dp))
            WaveControl(Icons.Default.Stop, "Tout arrêter et revenir au début", onClick = state::stopTransport)
            WaveControl(if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                if (expanded) "Replier le lecteur" else "Déplier le lecteur", active = expanded) { expanded = !expanded }
        }
        AnimatedVisibility(expanded) {
            Column {
                Row(Modifier.fillMaxWidth().padding(start = 5.dp, end = 5.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    val beat = snapshot.frame * state.bpm / (48_000L * 60)
                    Text("MES. ${beat / 4 + 1}  ·  ${beat % 4 + 1}/4", color = secondary, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    Text(if (state.loopEnabled) "Boucle A — B" else "${state.clips.count { it.inComposition }} pistes", color = secondary, fontSize = 9.sp)
                }
                WaveDeckTimeline(peaks, progress, state.loopEnabled, state.loopRange,
                    onSeek = state::seek, onRange = state::updateLoopRange,
                    modifier = Modifier.fillMaxWidth().height(47.dp).padding(vertical = 3.dp))
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                    WaveControl(Icons.Default.SkipPrevious, "Reculer d’une mesure") { state.stepBar(-1) }
                    WaveControl(Icons.Default.Repeat, "Activer ou désactiver la boucle A B", state.loopEnabled, onClick = state::toggleLoop)
                    WaveControl(Icons.Default.SkipNext, "Avancer d’une mesure") { state.stepBar(1) }
                    WaveControl(Icons.Default.Add, "Importer un son ou un pack", onClick = onImport)
                    WaveControl(Icons.Default.Tune, "Grille musicale", onClick = onSettings)
                    WaveMeters(snapshot.leftPeak, snapshot.rightPeak)
                }
            }
        }
        if (snapshot.cue != null) Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Headphones, null, tint = accent, modifier = Modifier.size(15.dp))
            Text(state.clips.find { it.id == snapshot.cue }?.title ?: "Écoute privée", color = secondary, fontSize = 10.sp,
                modifier = Modifier.weight(1f).padding(horizontal = 6.dp), maxLines = 1, overflow = TextOverflow.Ellipsis)
            WaveControl(Icons.Default.Close, "Arrêter l’écoute privée", onClick = state::stopPreview)
        }
    }
}

private fun formatWaveTime(frame: Long): String {
    val seconds = frame / 48_000
    return "%02d:%02d".format(seconds / 60, seconds % 60)
}

@Composable
private fun WaveDeckTimeline(peaks: List<Float>, progress: Float, looping: Boolean,
    range: ClosedFloatingPointRange<Float>, onSeek: (Float) -> Unit,
    onRange: (ClosedFloatingPointRange<Float>) -> Unit, modifier: Modifier) {
    val currentRange by rememberUpdatedState(range)
    val currentSeek by rememberUpdatedState(onSeek)
    val currentSelect by rememberUpdatedState(onRange)
    Canvas(modifier.pointerInput(looping) {
        var anchor = 0f
        detectDragGestures(onDragStart = { point ->
            val p = (point.x / size.width).coerceIn(0f, 1f)
            anchor = if (!looping) p else if (abs(p - currentRange.start) < .08f) currentRange.endInclusive
                else if (abs(p - currentRange.endInclusive) < .08f) currentRange.start else p
            if (!looping) currentSeek(p)
        }, onDrag = { change, _ ->
            change.consume()
            val p = (change.position.x / size.width).coerceIn(0f, 1f)
            if (looping) currentSelect(min(anchor, p)..max(anchor, p)) else currentSeek(p)
        })
    }.pointerInput(looping) {
        detectTapGestures { if (!looping) currentSeek((it.x / size.width).coerceIn(0f, 1f)) }
    }) {
        val width = size.width
        repeat(9) { drawLine(Color.White.copy(alpha = .07f), Offset(width * it / 8, 0f), Offset(width * it / 8, size.height), 1f) }
        if (looping) drawRect(accent.copy(alpha = .10f), Offset(range.start * width, 0f), androidx.compose.ui.geometry.Size((range.endInclusive - range.start) * width, size.height))
        peaks.forEachIndexed { i, peak ->
            val x = width * i / peaks.size
            val h = max(1f, peak * size.height * .39f)
            drawLine(if (i.toFloat() / peaks.size < progress) accent.copy(alpha = .8f) else Color(0xFF777680),
                Offset(x, size.height / 2 - h), Offset(x, size.height / 2 + h), 2f, StrokeCap.Round)
        }
        if (looping) listOf(range.start, range.endInclusive).forEach {
            drawLine(accent.copy(alpha = .8f), Offset(it * width, 0f), Offset(it * width, size.height), 2f)
            drawCircle(accent, 3.dp.toPx(), Offset((it * width).coerceIn(3.dp.toPx(), width - 3.dp.toPx()), 4.dp.toPx()))
        }
        drawLine(ink, Offset(progress * width, 0f), Offset(progress * width, size.height), 1.5f)
    }
}

@Composable
private fun WaveMeters(left: Float, right: Float) {
    val l by animateFloatAsState(left, tween(90), label = "Niveau gauche")
    val r by animateFloatAsState(right, tween(90), label = "Niveau droit")
    Canvas(Modifier.size(20.dp, 24.dp)) {
        listOf(l, r).forEachIndexed { channel, value ->
            repeat(8) { led ->
                drawRoundRect(if (value * 8 >= led + 1) accent.copy(alpha = .85f) else Color(0xFF303038),
                    Offset(channel * size.width / 2, size.height - (led + 1) * size.height / 8),
                    androidx.compose.ui.geometry.Size(size.width / 2 - 3, size.height / 8 - 2), androidx.compose.ui.geometry.CornerRadius(1f))
            }
        }
    }
}

@Composable
internal fun WaveControl(icon: ImageVector, label: String, active: Boolean = false, enabled: Boolean = true, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) .90f else 1f, spring(dampingRatio = .72f), label = "Pression")
    val tint by androidx.compose.animation.animateColorAsState(if (active) accent else ink.copy(alpha = .8f), tween(170), label = "État")
    IconButton(onClick, enabled = enabled, interactionSource = interaction,
        modifier = Modifier.size(38.dp).graphicsLayer { scaleX = scale; scaleY = scale }) {
        Icon(icon, label, tint = if (enabled) tint else secondary.copy(alpha = .4f), modifier = Modifier.size(20.dp))
    }
}

@Composable
internal fun WaveRoundPlay(playing: Boolean, loading: Boolean, progress: Float, label: String,
    queued: Boolean = false, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) .94f else 1f, spring(dampingRatio = .8f), label = "Lecture")
    val fill by androidx.compose.animation.animateColorAsState(if (playing || queued) Color(0xFF24222D) else Color(0xFF101114), tween(180), label = "Lecteur")
    Box(Modifier.size(44.dp).graphicsLayer { scaleX = scale; scaleY = scale }
        .clip(CircleShape).background(Brush.verticalGradient(listOf(Color(0xFF33333C), fill, Color.Black)))
        .border(.75.dp, Color(0xFF4C4B55), CircleShape)
        .clickable(interactionSource = interaction, indication = null, onClick = onClick), contentAlignment = Alignment.Center) {
        if (loading) CircularProgressIndicator(Modifier.size(19.dp), color = accent, strokeWidth = 1.5.dp)
        else Icon(if (queued) Icons.Default.Schedule else if (playing) Icons.Default.Pause else Icons.Default.PlayArrow,
            label, tint = ink, modifier = Modifier.size(22.dp))
        Canvas(Modifier.fillMaxSize().padding(2.dp)) {
            if (playing || queued) drawArc(accent.copy(alpha = .8f), -90f, 360f * progress.coerceIn(0f, 1f), false, style = Stroke(1.5.dp.toPx(), cap = StrokeCap.Round))
        }
    }
}

@Composable
internal fun WaveArtistPortrait(artist: String) {
    val res = when (artist) {
        "LUMA" -> R.drawable.wave_artist_luma
        "NAYA K." -> R.drawable.wave_chat_artist_0
        "KÉO" -> R.drawable.wave_chat_artist_1
        "SOLEN" -> R.drawable.wave_chat_artist_2
        "AZUR" -> R.drawable.wave_chat_artist_3
        "NOAM A." -> R.drawable.wave_chat_artist_8
        "LINA V." -> R.drawable.wave_chat_artist_9
        else -> R.drawable.wave_chat_artist_4
    }
    if (artist == "VOUS") Box(Modifier.size(38.dp).clip(CircleShape).background(Color(0xFF23242B)), contentAlignment = Alignment.Center) {
        Icon(Icons.Default.Person, "Vous", tint = secondary, modifier = Modifier.size(24.dp))
    } else Image(painterResource(res), artist, Modifier.size(38.dp).clip(CircleShape).border(.5.dp, Color(0xFF42414B), CircleShape), contentScale = ContentScale.Crop)
}

@Composable
internal fun WaveRoleChip(category: String) {
    val color = when (category) {
        "Drums" -> Color(0xFFD6A56F)
        "Basse" -> Color(0xFF84B8A2)
        "Mélodie" -> Color(0xFF9B9CD4)
        "Accords" -> Color(0xFF82AFCD)
        "Nappe" -> Color(0xFFB39BCD)
        "Acapella" -> Color(0xFFC799A4)
        else -> Color(0xFFADB5BE)
    }
    Text(category, color = color, fontSize = 9.sp, fontWeight = FontWeight.Medium,
        modifier = Modifier.clip(RoundedCornerShape(5.dp)).background(color.copy(alpha = .11f))
            .border(.5.dp, color.copy(alpha = .26f), RoundedCornerShape(5.dp)).padding(horizontal = 6.dp, vertical = 2.dp), maxLines = 1)
}

/** Horizontal slop is handled by Compose; vertical list scrolling retains its gesture. */
@Composable
internal fun WaveSwipeActions(id: String, revealed: String?, onReveal: (String?) -> Unit,
    actions: @Composable RowScope.(() -> Unit) -> Unit, content: @Composable () -> Unit) {
    val width = with(LocalDensity.current) { 162.dp.toPx() }
    var drag by remember(id) { mutableFloatStateOf(0f) }
    var dragging by remember(id) { mutableStateOf(false) }
    val target = if (dragging) drag else if (revealed == id) -width else 0f
    val offset by animateFloatAsState(target, if (dragging) snap() else spring(dampingRatio = .86f, stiffness = 420f), label = "Actions de piste")
    val currentRevealed by rememberUpdatedState(revealed)
    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(13.dp)).pointerInput(id, width) {
        detectHorizontalDragGestures(onDragStart = { dragging = true; drag = if (currentRevealed == id) -width else 0f },
            onHorizontalDrag = { change, delta -> change.consume(); drag = (drag + delta).coerceIn(-width, 0f) },
            onDragEnd = { dragging = false; onReveal(if (drag < -width * .28f) id else null) },
            onDragCancel = { dragging = false })
    }) {
        if (offset < -1) Row(Modifier.align(Alignment.CenterEnd).width(162.dp).matchParentSize().padding(start = 0.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.End) { actions { onReveal(null) } }
        Box(Modifier.fillMaxWidth().graphicsLayer { translationX = offset }) { content() }
    }
}

@Composable
internal fun RowScope.SwipeAction(label: String, icon: ImageVector, active: Boolean = false, onClick: () -> Unit) {
    Column(Modifier.width(54.dp).fillMaxHeight().background(if (active) Color(0xFF302641) else Color(0xFF1C1D23))
        .clickable(onClick = onClick), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, label, tint = accent, modifier = Modifier.size(19.dp))
        Spacer(Modifier.height(4.dp))
        Text(label, fontSize = 9.sp, color = ink)
    }
}

@Composable
internal fun WaveLoopCard(clip: WaveCompositionClip, state: WaveCompositionState, composition: Boolean,
    onDetail: () -> Unit, onAction: () -> Unit) {
    val voice = state.snapshot.voices.find { it.id == clip.id }
    val cue = state.snapshot.cue == clip.id
    val queued = composition && voice?.phase == "Prochaine mesure"
    val playing = if (composition) voice?.phase == "En lecture" else cue
    val progress = if (composition) {
        if (queued) 1f - (voice!!.remainingFrames / (48_000f * 60 * 4 / state.bpm)).coerceIn(0f, 1f) else voice?.progress ?: 0f
    } else if (cue) state.snapshot.cueProgress else 0f
    val dimmed = composition && (clip.mute || (state.clips.any { it.inComposition && it.solo } && !clip.solo))
    val opacity by animateFloatAsState(if (dimmed) .50f else 1f, tween(170), label = "Audibilité")
    Column(Modifier.fillMaxWidth().hifiBlackSurface(13.dp).graphicsLayer { alpha = opacity }
        .clickable(onClick = onDetail).padding(horizontal = 10.dp, vertical = 8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            WaveArtistPortrait(clip.artist)
            Column(Modifier.weight(1f)) {
                Text(clip.title, color = ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(clip.artist, color = secondary, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(Modifier.padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    WaveRoleChip(clip.category)
                    if (composition) Text(if (clip.solo) "SOLO" else if (clip.mute) "MUTE" else if (queued) "À la mesure" else if (clip.repeats == -1) "∞" else "${clip.repeats}×",
                        color = secondary, fontSize = 9.sp)
                    else Text(if (clip.id in state.preparing) "Préparation…" else clip.musical, color = secondary, fontSize = 8.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            WaveRoundPlay(playing, clip.id in state.preparing, progress, if (composition) "Lancer ou arrêter ${clip.title}" else "Écouter ${clip.title}", queued) {
                if (composition) onAction() else state.preview(clip.id)
            }
            if (!composition) WaveControl(if (clip.inComposition) Icons.Default.Check else if (clip.status == WaveProposalStatus.ARCHIVED) Icons.Default.Restore else Icons.Default.Add,
                "Prendre ou restaurer ${clip.title}", active = clip.inComposition, enabled = !clip.inComposition, onClick = onAction)
            else WaveControl(Icons.Default.MoreHoriz, "Options de ${clip.title}", onClick = onDetail)
        }
        if (clip.id in state.errors) Text(state.errors[clip.id] ?: "Audio indisponible", color = Color(0xFFC88B90), fontSize = 9.sp)
    }
}
