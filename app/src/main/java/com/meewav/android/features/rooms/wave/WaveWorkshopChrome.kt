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
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

private val ink = Color(0xFFEAE8F0)
private val secondary = Color(0xFF96949F)
private val accent = WaveMixerTheme.capsuleAccentSoft

@Composable
internal fun Modifier.waveTactileClick(onClick: () -> Unit): Modifier {
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) .96f else 1f, spring(dampingRatio = .78f), label = "Pression Wave")
    val opacity by animateFloatAsState(if (pressed) .78f else 1f, tween(90), label = "Opacité Wave")
    return graphicsLayer { scaleX = scale; scaleY = scale; alpha = opacity }.clickable(source, indication = null, onClick = onClick)
}

@Composable
internal fun WaveControl(icon: ImageVector, label: String, active: Boolean = false, enabled: Boolean = true, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) .96f else 1f, spring(dampingRatio = .78f), label = "Pression")
    val tint by androidx.compose.animation.animateColorAsState(if (active) accent else ink.copy(alpha = .8f), tween(170), label = "État")
    IconButton(onClick, enabled = enabled, interactionSource = interaction,
        modifier = Modifier.size(38.dp).graphicsLayer { scaleX = scale; scaleY = scale }) {
        Icon(icon, label, tint = if (enabled) tint else secondary.copy(alpha = .4f), modifier = Modifier.size(20.dp))
    }
}

@Composable
internal fun WaveRoundPlay(playing: Boolean, loading: Boolean, progress: Float, label: String,
    queued: Boolean = false, stopIcon: Boolean = false, enabled: Boolean = true, onClick: () -> Unit) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed) .94f else 1f, spring(dampingRatio = .8f), label = "Lecture")
    val fill by androidx.compose.animation.animateColorAsState(if (playing || queued) Color(0xFF24222D) else Color(0xFF101114), tween(180), label = "Lecteur")
    Box(Modifier.size(44.dp).graphicsLayer { scaleX = scale; scaleY = scale; alpha = if (enabled) 1f else .35f }
        .clip(CircleShape).background(Brush.verticalGradient(listOf(Color(0xFF33333C), fill, Color.Black)))
        .border(.75.dp, Color(0xFF4C4B55), CircleShape)
        .clickable(interactionSource = interaction, indication = null, enabled = enabled, onClick = onClick), contentAlignment = Alignment.Center) {
        if (loading) CircularProgressIndicator(Modifier.size(19.dp), color = accent, strokeWidth = 1.5.dp)
        else Icon(if (queued) Icons.Default.Schedule else if (playing && stopIcon) Icons.Default.Stop else if (playing) Icons.Default.Pause else Icons.Default.PlayArrow,
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
internal fun WaveRoleChip(category: String, expanded: Boolean = false, active: Boolean = true, uniform: Boolean = true) {
    val color = when (category) {
        "Drums" -> Color(0xFFFF9A16)
        "Basse" -> Color(0xFF43EF9E)
        "Mélodie" -> Color(0xFF9B7BFF)
        "Accords" -> Color(0xFF00DEFF)
        "Nappe" -> Color(0xFFD34FFF)
        "Acapella" -> Color(0xFFFF3AA8)
        else -> Color(0xFFFFE329)
    }
    Box(Modifier.then(if (expanded) Modifier.fillMaxWidth().height(32.dp) else Modifier.width(58.dp).height(18.dp))
        .clip(RoundedCornerShape(50))
        .background(if (active) color.copy(alpha = .22f) else Color(0xFF17181D))
        .border(.75.dp, if (active) color.copy(alpha = .9f) else Color(0xFF33343B), RoundedCornerShape(50)),
        contentAlignment = Alignment.Center) {
        Text(category, color = if (active) color else Color(0xFF777781), fontSize = if (expanded) 12.sp else 9.sp,
            fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

/** Horizontal slop is handled by Compose; vertical list scrolling retains its gesture. */
@Composable
internal fun WaveSwipeActions(id: String, revealed: String?, onReveal: (String?) -> Unit, modifier: Modifier = Modifier,
    actions: @Composable RowScope.(() -> Unit) -> Unit, content: @Composable () -> Unit) {
    val width = with(LocalDensity.current) { 162.dp.toPx() }
    var drag by remember(id) { mutableFloatStateOf(0f) }
    var dragging by remember(id) { mutableStateOf(false) }
    val target = if (dragging) drag else if (revealed == id) -width else 0f
    val offset by animateFloatAsState(target, if (dragging) snap() else spring(dampingRatio = .86f, stiffness = 420f), label = "Actions de piste")
    val currentRevealed by rememberUpdatedState(revealed)
    Box(modifier.fillMaxWidth().clip(RoundedCornerShape(13.dp)).pointerInput(id, width) {
        detectHorizontalDragGestures(onDragStart = { dragging = true; drag = if (currentRevealed == id) -width else 0f },
            onHorizontalDrag = { change, delta -> change.consume(); drag = (drag + delta).coerceIn(-width, 0f) },
            onDragEnd = { dragging = false; onReveal(if (drag < -width * .28f) id else null) },
            onDragCancel = { dragging = false })
    }) {
        if (offset < -1) Row(Modifier.align(Alignment.CenterEnd).width(162.dp).matchParentSize().padding(start = 0.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.End) { actions { onReveal(null) } }
        Box(Modifier.fillMaxWidth().graphicsLayer { translationX = offset }) {
            content()
            if (offset < -8 && !dragging) Box(Modifier.matchParentSize().clickable { onReveal(null) })
        }
    }
}

@Composable
internal fun RowScope.SwipeAction(label: String, icon: ImageVector, active: Boolean = false, onClick: () -> Unit) {
    Column(Modifier.width(54.dp).fillMaxHeight().background(if (active) Color(0xFF302641) else Color(0xFF1C1D23))
        .waveTactileClick(onClick), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(icon, label, tint = accent, modifier = Modifier.size(19.dp))
        Spacer(Modifier.height(4.dp))
        Text(label, fontSize = 9.sp, color = ink)
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
internal fun WaveLoopCard(clip: WaveCompositionClip, state: WaveCompositionState, composition: Boolean,
    onMessage: () -> Unit = {}, onProfile: () -> Unit = {}) {
    val download = rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("audio/*")) { uri -> if (uri != null) state.download(clip.id, uri) }
    var confirmRemoval by remember(clip.id) { mutableStateOf(false) }
    val voice = state.snapshot.voices.find { it.id == clip.id }
    val cue = state.snapshot.cue == clip.id
    val queued = if (composition) voice?.phase == "Prochaine mesure" else state.snapshot.pendingCandidate == clip.id
    val playing = if (composition) voice?.phase == "En lecture" else (cue && !state.snapshot.cuePaused) || (state.snapshot.candidate == clip.id && state.snapshot.running)
    val progress = if (composition) {
        if (queued) 1f - (voice!!.remainingFrames / (48_000f * 60 * 4 / state.bpm)).toFloat().coerceIn(0f, 1f) else voice?.progress ?: 0f
    } else if (cue) state.snapshot.cueProgress else if (state.snapshot.candidate == clip.id) state.snapshot.candidateProgress else 0f
    val dimmed = composition && (clip.mute || (state.clips.any { it.inComposition && it.solo } && !clip.solo))
    val selected = composition && state.selectedMixId == clip.id
    val opacity by animateFloatAsState(if (dimmed) .50f else 1f, tween(170), label = "Audibilité")
    Column(Modifier.fillMaxWidth().hifiBlackSurface(13.dp).graphicsLayer { alpha = opacity }
        .border(.75.dp, if (selected) accent.copy(alpha = .45f) else Color.Transparent, RoundedCornerShape(13.dp))
        .then(if (composition) Modifier.clickable { state.selectMix(clip.id) } else Modifier)
        .padding(horizontal = 10.dp, vertical = 5.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(9.dp)) {
            Box(Modifier.clickable(onClick = onProfile)) { WaveArtistPortrait(clip.artist) }
            Column(Modifier.weight(1f)) {
                if (composition) Text(clip.title, color = ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(clip.artist, color = secondary, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, false))
                    val grade = when (clip.artist) {
                        "AZUR" -> R.drawable.wave_grade_4
                        "SOLEN", "LUMA" -> R.drawable.wave_grade_3
                        "KÉO", "NOAM A." -> R.drawable.wave_grade_2
                        else -> R.drawable.wave_grade_1
                    }
                    Image(painterResource(grade), "Grade de ${clip.artist}", modifier = Modifier.size(24.dp))
                }
                if (!composition) Row(Modifier.padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (composition) Text(if (clip.solo) "SOLO" else if (clip.mute) "MUTE" else if (queued) "À la mesure" else if (clip.repeats == -1) "∞" else "${clip.repeats}×",
                        color = secondary, fontSize = 9.sp)
                    else Text(if (clip.id in state.preparing) "Préparation…" else clip.musical, color = secondary, fontSize = 8.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                }
            }
            if (!composition) WaveRoleChip(clip.category)
            if (!composition) WaveRoundPlay(playing, clip.id in state.preparing, progress, if (composition) "Lancer ou arrêter ${clip.title}" else "Écouter ${clip.title}", queued, stopIcon = false) {
                state.preview(clip.id)
            }
            if (!composition) WaveControl(Icons.Default.ChatBubbleOutline, "Envoyer un message à ${clip.artist}") { onMessage() }
            if (!composition) WaveControl(Icons.Default.FileDownload, "Télécharger ${clip.title}") {
                val extension = clip.source.substringAfterLast('.', "wav").substringBefore('?').takeIf { it in listOf("wav", "mp3", "m4a", "aac", "ogg", "flac") } ?: "wav"
                download.launch("${clip.title.replace('/', '-') }.$extension")
            }
            else {
                WaveMixHeaderControls(clip, state)
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    WaveRoleChip(clip.category)
                    WaveControl(Icons.Default.Close, "Retirer ${clip.title} de la composition") { confirmRemoval = true }
                }
            }
        }

        AnimatedVisibility(selected) { WaveMixControls(clip, state) }
        if (clip.id in state.errors) Text(state.errors[clip.id] ?: "Audio indisponible", color = Color(0xFFC88B90), fontSize = 9.sp)
    }
    if (confirmRemoval) AlertDialog(onDismissRequest = { confirmRemoval = false }, containerColor = Color(0xFF111217),
        icon = { Icon(Icons.Default.WarningAmber, null, tint = Color(0xFFC88B90)) },
        title = { Text("Retirer une boucle validée ?", color = ink) },
        text = { Text("Tu es sur le point de supprimer « ${clip.title} » de la composition. Cette boucle a été validée par le public. Elle cessera de jouer et ses épingles seront retirées.", color = secondary) },
        confirmButton = { TextButton(onClick = { state.remove(clip.id); confirmRemoval = false }) { Text("Retirer la boucle", color = Color(0xFFC88B90)) } },
        dismissButton = { TextButton(onClick = { confirmRemoval = false }) { Text("Conserver", color = accent) } })
}
