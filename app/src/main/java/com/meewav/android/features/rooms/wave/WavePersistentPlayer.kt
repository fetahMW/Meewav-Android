package com.meewav.android.features.rooms.wave

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.*
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.abs
import kotlin.math.max

private val pearl = Color(0xFFEAE8F0)
private val secondary = Color(0xFF96949F)
private val violet = WaveMixerTheme.capsuleAccentSoft
private val curtain = CubicBezierEasing(.22f, 1f, .36f, 1f)
private enum class PlayerRail { READOUT, IMPORT, LOOP }

/** Native adaptation of iOS wave/host-hardware-c97a's persistent workflow deck. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
internal fun WaveMasterPlayer(state: WaveCompositionState, onImport: (WaveImportDestination) -> Unit, onSettings: () -> Unit) {
    var expanded by rememberSaveable { mutableStateOf(false) }
    var volumeOpen by rememberSaveable { mutableStateOf(false) }
    var bases by remember { mutableStateOf(false) }
    var rail by remember { mutableStateOf(PlayerRail.READOUT) }
    val chevron by animateFloatAsState(if (expanded) 180f else 0f,
        spring(dampingRatio = .88f, stiffness = 230f), label = "Repli du lecteur")
    val haptic = LocalHapticFeedback.current
    val snapshot = state.snapshot
    val editingPin = state.selectedPin
    val displayedRange = editingPin?.let {
        (it.startBar * state.framesPerBar / state.durationFrames).toFloat()..((it.startBar + it.bars) * state.framesPerBar / state.durationFrames).toFloat()
    } ?: state.loopRange
    val progress = if (snapshot.cue != null) snapshot.cueProgress else
        (snapshot.frame.toFloat() / state.durationFrames).coerceIn(0f, 1f)
    val peaks = if (snapshot.cue != null) state.prepared[snapshot.cue]?.peaks.orEmpty() else state.masterPeaks
    LaunchedEffect(state.compositionPage, state.referenceId, state.listeningMode) { rail = PlayerRail.READOUT; bases = false; volumeOpen = false }
    Column(Modifier.fillMaxWidth().hifiBlackSurface(17.dp).padding(horizontal = 10.dp, vertical = 4.dp)) {
        Row(Modifier.fillMaxWidth().height(48.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(48.dp).waveTactileClick {
                expanded = !expanded; bases = false; rail = PlayerRail.READOUT; volumeOpen = false
                haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
            }.semantics { contentDescription = if (expanded) "Replier le lecteur" else "Déplier le lecteur"; role = Role.Button }, contentAlignment = Alignment.Center) {
                Icon(Icons.Default.ExpandMore, null, tint = violet,
                    modifier = Modifier.size(30.dp).graphicsLayer { rotationZ = chevron })
            }
            if (state.compositionPage) {
                Row(Modifier.weight(1f).height(44.dp).waveTactileClick { expanded = true; bases = !bases; rail = PlayerRail.READOUT },
                    verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                    Text(state.reference?.title ?: "Choisir une base", color = pearl, fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                        maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, false))
                    Icon(Icons.Default.ExpandMore, "Bibliothèque de bases", tint = violet, modifier = Modifier.size(16.dp))
                }
            } else Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                WaveListeningMode.entries.forEach { mode ->
                    val selected = state.listeningMode == mode
                    Box(Modifier.weight(1f).height(44.dp).semantics { this.selected = selected; role = Role.Tab }
                        .waveTactileClick { state.listen(mode) }, contentAlignment = Alignment.Center) {
                        Box(Modifier.fillMaxWidth().padding(horizontal = 2.dp).height(28.dp).clip(RoundedCornerShape(6.dp))
                            .hardwareSurface(6.dp, raised = true, reflection = 0.085f), contentAlignment = Alignment.Center) {
                            Text(mode.label, color = if (selected) violet else secondary, fontWeight = FontWeight.SemiBold, fontSize = 10.sp)
                        }
                    }
                }
            }
            Box(Modifier.width(52.dp).height(44.dp).waveTactileClick { state.toggleRoute() }
                .semantics { contentDescription = "Sortie ${if (state.publicRoute) "publique" else "privée"}, toucher pour changer"; role = Role.Switch }, contentAlignment = Alignment.Center) {
                Text(if (state.publicRoute) "Public" else "Privé", color = if (state.publicRoute) violet else secondary,
                    fontSize = 10.sp, modifier = Modifier.clip(RoundedCornerShape(7.dp)).background(Color(0xFF17171C)).padding(horizontal = 5.dp, vertical = 7.dp))
            }
        }
        AnimatedVisibility(volumeOpen, enter = expandVertically(spring(dampingRatio = .9f)) + fadeIn(),
            exit = shrinkVertically(spring(dampingRatio = .9f)) + fadeOut()) {
            Row(Modifier.fillMaxWidth().height(60.dp).padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(Icons.Default.VolumeUp, null, tint = secondary, modifier = Modifier.size(18.dp))
                WaveOutputFader(state.outputGain, state::outputVolume, Modifier.weight(1f).height(44.dp))
                Text("${kotlin.math.round(state.outputGain * 100).toInt()} %", color = pearl, fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace, modifier = Modifier.width(40.dp))
            }
        }
        AnimatedVisibility(expanded,
            enter = expandVertically(animationSpec = spring(dampingRatio = .88f, stiffness = 230f), expandFrom = Alignment.Top) + fadeIn(tween(150)),
            exit = shrinkVertically(animationSpec = spring(dampingRatio = .88f, stiffness = 230f), shrinkTowards = Alignment.Top) + fadeOut(tween(100))) {
            Column {
                // Library replaces the waveform's footprint, exactly as the iOS player does.
                Box(Modifier.fillMaxWidth().height(87.dp).clipToBounds()) {
                    if (bases) Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {
                        state.clips.filter { it.isBase }.forEach { base ->
                            Row(Modifier.fillMaxWidth().height(42.dp).waveTactileClick { state.activateReference(base.id); bases = false },
                                verticalAlignment = Alignment.CenterVertically) {
                                Icon(if (base.id == state.referenceId) Icons.Default.Check else Icons.Default.MusicNote, null, tint = violet, modifier = Modifier.size(17.dp))
                                Text(base.title, color = pearl, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(start = 8.dp).weight(1f))
                            }
                        }
                        Row(Modifier.fillMaxWidth().height(42.dp).waveTactileClick { bases = false; onImport(WaveImportDestination.BASE) }, verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Add, null, tint = violet, modifier = Modifier.size(18.dp))
                            Text("Importer une base", color = secondary, fontSize = 12.sp, modifier = Modifier.padding(start = 8.dp))
                        }
                    } else Column {
                        Row(Modifier.fillMaxWidth().height(27.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(if (snapshot.cue != null) state.candidate?.title ?: "Écoute privée" else state.reference?.title ?: "Aucune base importée",
                                color = secondary, fontSize = 10.sp, maxLines = 1, overflow = TextOverflow.Ellipsis,
                                modifier = Modifier.weight(1f).combinedClickable(onClick = { bases = true }, onLongClick = onSettings))
                            Text("${state.bpm} · ${state.key}", color = secondary, fontSize = 9.sp,
                                modifier = Modifier.width(88.dp).clickable(onClick = onSettings), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text(waveClock(snapshot.frame), color = pearl, fontSize = 10.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.width(38.dp))
                        }
                        if (rail == PlayerRail.LOOP && !state.canLoop) Box(Modifier.fillMaxWidth().height(60.dp), contentAlignment = Alignment.Center) {
                            Text(if (!state.referenceReady) "Importe une base pour régler sa boucle." else "Choisis Base ou Mix pour régler la boucle.",
                                color = secondary, fontSize = 11.sp)
                        } else WaveReferenceTimeline(peaks, progress, editingPin != null || state.loopEnabled,
                            editingPin == null && state.loopBars == 0, displayedRange, state.cueFrame.toFloat() / state.durationFrames,
                            onSeek = state::seek, onRange = { if (editingPin != null) state.movePin(it.start) else state.updateLoopRange(it) },
                            snap = { state.snapRegion(it, editingPin?.bars ?: state.loopBars) }, editable = state.canLoop,
                            sourceId = state.referenceId, minimum = (4800f / state.durationFrames).coerceAtMost(1f),
                            onScrubBegin = state::beginScrub, onScrubEnd = state::endScrub,
                            modifier = Modifier.fillMaxWidth().height(60.dp).padding(vertical = 6.dp))
                    }
                }
                Row(Modifier.fillMaxWidth().height(48.dp), horizontalArrangement = Arrangement.spacedBy(5.dp), verticalAlignment = Alignment.CenterVertically) {
                    WaveRoundPlay(state.playing, state.transportPending, progress, if (state.playing) "Pause" else "Lecture", onClick = state::transport)
                    Box(Modifier.weight(1f).height(44.dp).clipToBounds()) {
                        Row(Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
                            Box(Modifier.weight(1f).fillMaxHeight().clipToBounds()) {
                                androidx.compose.animation.AnimatedVisibility(rail == PlayerRail.READOUT, enter = fadeIn(tween(140)), exit = fadeOut(tween(80))) {
                                    Row(Modifier.fillMaxSize(), verticalAlignment = Alignment.CenterVertically) {
                                        val beat = (snapshot.frame.coerceAtMost((state.durationFrames - 1).coerceAtLeast(0)) * state.bpm / (48_000L * 60)).toLong()
                                        Column(Modifier.weight(1f).combinedClickable(onClick = onSettings, onLongClick = state::setCue)) {
                                            Text(if (editingPin != null) "Épingle · M${editingPin.startBar + 1}" else "Mesure ${beat / 4 + 1} / ${max(1, (state.durationFrames / state.framesPerBar).toInt())}", color = pearl, fontSize = 10.sp, maxLines = 1)
                                            Text(if (editingPin != null) "${editingPin.bars} mesures" else "Temps ${beat % 4 + 1} / 4", color = secondary, fontSize = 9.sp)
                                        }
                                        if (editingPin != null) WaveControl(Icons.Default.Check, "Terminer l’édition des épingles") { state.selectPin(null) }
                                        else Box(Modifier.size(44.dp).combinedClickable(onClick = state::returnToCue, onLongClick = state::setCue)
                                            .semantics { contentDescription = "Retour au point de reprise. Appui long pour mémoriser la position." }, contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.MyLocation, null, tint = secondary, modifier = Modifier.size(19.dp))
                                        }
                                    }
                                }
                                PlayerCurtain(rail == PlayerRail.IMPORT) {
                                    Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
                                        listOf("Base" to WaveImportDestination.BASE, "Vote" to WaveImportDestination.VOTE).forEach { (label, destination) ->
                                            Column(Modifier.weight(1f).fillMaxHeight().waveTactileClick {
                                                rail = PlayerRail.READOUT; onImport(destination)
                                            }, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                                                Icon(if (destination == WaveImportDestination.BASE) Icons.Default.LibraryMusic else Icons.Default.HowToVote, null, tint = violet, modifier = Modifier.size(18.dp))
                                                Text(label, color = pearl, fontSize = 10.sp)
                                            }
                                        }
                                    }
                                }
                            }
                            if (rail != PlayerRail.LOOP) WaveControl(Icons.Default.FileDownload, "Importer une base ou une boucle au vote", rail == PlayerRail.IMPORT) {
                                rail = if (rail == PlayerRail.IMPORT) PlayerRail.READOUT else PlayerRail.IMPORT
                            } else Spacer(Modifier.width(38.dp))
                        }
                        PlayerCurtain(rail == PlayerRail.LOOP) {
                            Row(Modifier.fillMaxSize().horizontalScroll(rememberScrollState()), verticalAlignment = Alignment.CenterVertically) {
                                (if (editingPin != null) listOf(4, 8, 16, 32) else listOf(-1, 0, 4, 8, 16, 32)).forEach { bars ->
                                    val selected = if (editingPin != null) editingPin.bars == bars else if (bars == -1) !state.loopEnabled else state.loopEnabled && state.loopBars == bars
                                    val minimumBars = state.candidateId?.let { state.prepared[it]?.frames?.div(state.framesPerBar) } ?: 0.0
                                    val enabled = state.canLoop && (bars <= 0 || (bars >= minimumBars - .01 && (bars + (editingPin?.startBar ?: 0)) * state.framesPerBar <= state.durationFrames + 1))
                                    Column(Modifier.size(44.dp).clip(RoundedCornerShape(9.dp)).background(if (selected) violet.copy(alpha = .12f) else Color.Transparent)
                                        .clickable(enabled = enabled) { if (editingPin != null) state.resizePin(bars) else state.selectLoop(bars); rail = PlayerRail.READOUT; haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove) },
                                        horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                                        Text(when (bars) { -1 -> "→"; 0 -> "A–B"; else -> "$bars" }, fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                                            color = (if (selected) violet else pearl).copy(alpha = if (enabled) 1f else .3f))
                                        Text(when (bars) { -1 -> "Sans"; 0 -> "Libre"; else -> "mes." }, fontSize = 8.sp, color = secondary.copy(alpha = if (enabled) 1f else .3f))
                                    }
                                }
                            }
                        }
                    }
                    Box(Modifier.size(44.dp).waveTactileClick { volumeOpen = !volumeOpen }
                        .semantics { contentDescription = "Volume du lecteur Wave"; role = Role.Button; stateDescription = if (volumeOpen) "Déplié" else "Replié" },
                        contentAlignment = Alignment.Center) {
                        Box(Modifier.size(36.dp, 28.dp).hardwareSurface(6.dp, raised = true, reflection = .085f), contentAlignment = Alignment.Center) {
                            val scale by animateFloatAsState(if (volumeOpen) 1.15f else 1f, spring(dampingRatio = .7f), label = "Haut-parleur Wave")
                            Icon(if (state.outputGain == 0f) Icons.Default.VolumeOff else Icons.Default.VolumeUp, null,
                                tint = if (volumeOpen) violet else pearl, modifier = Modifier.size(17.dp).graphicsLayer { scaleX = scale; scaleY = scale })
                        }
                    }
                    Box(Modifier.size(44.dp), contentAlignment = Alignment.Center) {
                        WaveControl(Icons.Default.Repeat, if (rail == PlayerRail.LOOP) "Replier les réglages de boucle" else "Déplier les réglages de boucle", rail == PlayerRail.LOOP || state.loopEnabled) {
                            bases = false
                            rail = if (rail == PlayerRail.LOOP) PlayerRail.READOUT else PlayerRail.LOOP
                            haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                        }
                        if (state.loopEnabled) Text(if (state.loopBars > 0) "${state.loopBars}" else "AB", color = violet, fontSize = 7.sp,
                            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 1.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun PlayerCurtain(visible: Boolean, content: @Composable () -> Unit) {
    AnimatedVisibility(visible, modifier = Modifier.fillMaxSize(),
        enter = slideInHorizontally(tween(320, easing = curtain)) { it } + fadeIn(tween(100)),
        exit = slideOutHorizontally(tween(320, easing = curtain)) { it } + fadeOut(tween(150))) { content() }
}

private fun waveClock(frame: Long): String = "%02d:%02d".format(frame / 48_000 / 60, frame / 48_000 % 60)

@Composable
private fun WaveReferenceTimeline(peaks: List<Float>, progress: Float, looping: Boolean, free: Boolean,
    range: ClosedFloatingPointRange<Float>, cue: Float, onSeek: (Float) -> Unit,
    onRange: (ClosedFloatingPointRange<Float>) -> Unit,
    snap: (ClosedFloatingPointRange<Float>) -> ClosedFloatingPointRange<Float>, editable: Boolean,
    sourceId: String?, minimum: Float, onScrubBegin: () -> Unit, onScrubEnd: (Boolean) -> Unit, modifier: Modifier) {
    var draft by remember { mutableStateOf<ClosedFloatingPointRange<Float>?>(null) }
    var scrub by remember { mutableStateOf<Float?>(null) }
    val currentRange by rememberUpdatedState(range)
    val currentSeek by rememberUpdatedState(onSeek)
    val currentSelect by rememberUpdatedState(onRange)
    val currentSnap by rememberUpdatedState(snap)
    val begin by rememberUpdatedState(onScrubBegin)
    val end by rememberUpdatedState(onScrubEnd)
    val drawnRange = draft ?: range
    val playhead = scrub ?: progress
    Canvas(modifier.pointerInput(looping, free, editable, sourceId) {
        var startPointer = 0f
        var original = 0f..1f
        var edge = 0
        detectHorizontalDragGestures(onDragStart = { point ->
            startPointer = (point.x / size.width).coerceIn(0f, 1f); original = currentRange
            if (!looping) begin()
            val threshold = 22.dp.toPx() / size.width
            val da = abs(startPointer - original.start); val db = abs(startPointer - original.endInclusive)
            edge = if (!free) 0 else if (da <= threshold && db <= threshold)
                (if (point.y < size.height / 2) -1 else 1)
                else if (da <= threshold && da <= db) -1 else if (db <= threshold) 1 else 0
        }, onHorizontalDrag = { change, _ ->
            change.consume()
            val position = (change.position.x / size.width).coerceIn(0f, 1f)
            if (!looping) { scrub = position; currentSeek(position) } else if (editable) {
                val length = original.endInclusive - original.start
                draft = when (edge) {
                    -1 -> position.coerceAtMost(original.endInclusive - minimum).coerceAtLeast(0f)..original.endInclusive
                    1 -> original.start..position.coerceAtLeast(original.start + minimum).coerceAtMost(1f)
                    else -> { val start = (original.start + position - startPointer).coerceIn(0f, (1f - length).coerceAtLeast(0f)); currentSnap(start..start + length) }
                }
            }
        }, onDragEnd = { draft?.takeIf { it != currentRange }?.let(currentSelect); if (scrub != null) end(false); draft = null; scrub = null },
            onDragCancel = { if (scrub != null) end(true); draft = null; scrub = null })
    }.pointerInput(looping) { detectTapGestures { currentSeek((it.x / size.width).coerceIn(0f, 1f)) } }) {
        repeat(9) { drawLine(Color.White.copy(alpha = .06f), Offset(size.width * it / 8, 0f), Offset(size.width * it / 8, size.height), 1f) }
        if (looping) drawRect(violet.copy(alpha = .12f), Offset(drawnRange.start * size.width, 0f), Size((drawnRange.endInclusive - drawnRange.start) * size.width, size.height))
        peaks.forEachIndexed { i, peak ->
            val x = size.width * i / peaks.size
            val h = max(1f, peak * size.height * .40f)
            drawLine(if (i.toFloat() / peaks.size < playhead) violet.copy(alpha = .8f) else Color(0xFF74717D), Offset(x, size.height / 2 - h), Offset(x, size.height / 2 + h), 2f, StrokeCap.Round)
        }
        if (looping) listOf(drawnRange.start, drawnRange.endInclusive).forEach {
            drawLine(violet, Offset(it * size.width, 0f), Offset(it * size.width, size.height), 2f)
            drawCircle(violet, 3.dp.toPx(), Offset((it * size.width).coerceIn(3.dp.toPx(), size.width - 3.dp.toPx()), size.height / 2))
        }
        if (cue > 0f) drawCircle(violet.copy(alpha = .75f), 3.dp.toPx(), Offset(cue.coerceIn(0f, 1f) * size.width, 3.dp.toPx()))
        drawLine(pearl, Offset(playhead * size.width, 0f), Offset(playhead * size.width, size.height), 1.5f)
    }
}
