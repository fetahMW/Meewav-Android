package com.meewav.android.features.rooms.wave

import android.view.HapticFeedbackConstants
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.requiredHeight
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

private fun white(a: Float) = Color.White.copy(alpha = a)

enum class WaveTab(val label: String, val icon: ImageVector) {
    CHAT("Chat", WaveIcons.Chat),
    MIXEUR("Mixeur", WaveIcons.Tune),
    WAVE("Wave", WaveIcons.Waveform),
    INVITES("Invités", WaveIcons.Group),
}

/* ------------------------------------------------------------------------- */
/* Écran « La Wave » — rôle hôte, onglet Mixeur.                               */
/* ------------------------------------------------------------------------- */

@Composable
fun WaveMixerScreen(onBack: () -> Unit = {}, onClose: () -> Unit = {}) {
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    var activeTab by remember { mutableStateOf(WaveTab.MIXEUR) }
    // Keep the highlighted snapshot even if the live feed trims old messages or tabs change.
    var pinnedChatMessage by remember { mutableStateOf<WaveChatMessage?>(null) }
    var waveNotificationsRead by remember { mutableStateOf(false) }
    val guestState = remember { WaveGuestState() }
    // Canaux.
    var micGain by remember { mutableStateOf(0.72f) }
    var audioGain by remember { mutableStateOf(0.62f) }
    var micMuted by remember { mutableStateOf(false) }
    var audioMuted by remember { mutableStateOf(false) }
    // FX.
    var isPro by remember { mutableStateOf(false) }
    var monitoring by remember { mutableStateOf(false) }
    var autotuneOn by remember { mutableStateOf(false) }
    var reverbOn by remember { mutableStateOf(false) }
    var reverbValue by remember { mutableStateOf(0.15f) }
    var tuneKey by remember { mutableStateOf("A") }
    var tuneScale by remember { mutableStateOf("Mineur") }
    var selector by remember { mutableStateOf<String?>(null) } // "key" | "scale"
    // Deck.
    var privacyPublic by remember { mutableStateOf(false) }
    var isPlaying by remember { mutableStateOf(false) }
    var loopOn by remember { mutableStateOf(false) }
    var multitrack by remember { mutableStateOf(false) }
    // Piste principale + multipiste.
    var hasTrack by remember { mutableStateOf(false) }
    var trackName by remember { mutableStateOf<String?>(null) }
    var trackUri by remember { mutableStateOf<android.net.Uri?>(null) }
    var trackDurationMs by remember { mutableStateOf(0L) }
    var trackSamples by remember { mutableStateOf<List<WaveformSample>>(emptyList()) }
    var trackAnalyzing by remember { mutableStateOf(false) }
    var playProgress by remember { mutableStateOf(0f) }
    var extraLaneCount by remember { mutableStateOf(2) }
    val context = LocalContext.current
    // Sélecteur de fichier audio (bouton upload + lanes « Importer »).
    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            // Nom réel du fichier via le provider (pas l'id de document).
            trackName = runCatching {
                context.contentResolver.query(
                    uri, arrayOf(android.provider.OpenableColumns.DISPLAY_NAME),
                    null, null, null
                )?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
            }.getOrNull() ?: uri.lastPathSegment?.substringAfterLast('/')
            trackUri = uri
            // Durée réelle via MediaMetadataRetriever.
            trackDurationMs = runCatching {
                val mmr = android.media.MediaMetadataRetriever()
                mmr.setDataSource(context, uri)
                val d = mmr.extractMetadata(android.media.MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull() ?: 0L
                mmr.release()
                d
            }.getOrDefault(0L)
            trackSamples = emptyList()
            trackAnalyzing = true
            playProgress = 0f
            hasTrack = true
        }
    }
    // Waveform réelle — decode PCM + buckets min/max/RMS (MWAudioAnalysis iOS).
    LaunchedEffect(trackUri) {
        val uri = trackUri ?: return@LaunchedEffect
        val decoded = withContext(Dispatchers.IO) {
            WaveAudioAnalysis.analyze(context, uri)
        }
        trackSamples = decoded
        trackAnalyzing = false
    }
    // Lecture réelle — MediaPlayer sur l'URI importée (son audible).
    var mediaPlayer by remember { mutableStateOf<android.media.MediaPlayer?>(null) }
    DisposableEffect(trackUri) {
        onDispose { mediaPlayer?.release(); mediaPlayer = null }
    }
    val onTogglePlay: () -> Unit = {
        if (!hasTrack) {
            isPlaying = !isPlaying
        } else if (isPlaying) {
            mediaPlayer?.pause()
            isPlaying = false
        } else {
            val mp = mediaPlayer ?: trackUri?.let { u ->
                runCatching {
                    android.media.MediaPlayer().apply {
                        setDataSource(context, u)
                        prepare()
                        setOnCompletionListener {
                            isPlaying = false; playProgress = 0f
                            seekTo(0); pause()
                        }
                    }
                }.getOrNull()
            }
            mediaPlayer = mp
            if (mp != null) {
                mp.start()
                isPlaying = true
            } else {
                isPlaying = false
            }
        }
    }
    // Progression réelle : currentPosition -> playProgress (ticker 50 ms).
    LaunchedEffect(isPlaying) {
        while (isPlaying) {
            val mp = mediaPlayer
            if (mp != null && trackDurationMs > 0) {
                playProgress = (mp.currentPosition.toFloat() / trackDurationMs).coerceIn(0f, 1f)
            }
            delay(50)
        }
    }
    val onImport: () -> Unit = { importLauncher.launch(arrayOf("audio/*")) }
    var showLeaveConfirm by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().mixerSurfaceBackground()) {
        BoxWithConstraints(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding()) {
        // Insets follow the Samsung IME animation directly, with no second animation.
        // Crop the existing preview only when Chat needs room; keep the video mounted.
        val fullVideoHeight = maxWidth * 9f / 16f
        val videoViewportHeight = if (activeTab == WaveTab.CHAT)
            (maxHeight - 305.dp).coerceIn(0.dp, fullVideoHeight) else fullVideoHeight
        Column(Modifier.fillMaxSize()) {
            WaveHeader(title = "Freestyle session — Luma invite", onBack = { showLeaveConfirm = true }, onClose = { showLeaveConfirm = true })
            Box(Modifier.fillMaxWidth().height(videoViewportHeight).clipToBounds()) {
                WaveGuestStage(guestState, interactive = activeTab == WaveTab.INVITES) {
                    WaveVideo(cameraOff = true, modifier = if (guestState.onStage.isEmpty())
                        Modifier.requiredHeight(fullVideoHeight) else Modifier.fillMaxSize())
                }
            }
            // Zone grise du mixeur : couvre la barre d'onglets ET le corps.
            Column(
                Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .mixerBodyBackground()
            ) {
                WaveTabBar(
                    active = activeTab,
                    onSelect = {
                        if (it != WaveTab.CHAT) {
                            focusManager.clearFocus()
                            keyboardController?.hide()
                        }
                        activeTab = it
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp)
                        .padding(top = 8.dp)
                        .height(49.dp)
                )
                Box(
                    Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 12.dp)
                ) {
                when (activeTab) {
                    WaveTab.MIXEUR -> MixerBody(
                        micGain = micGain, audioGain = audioGain,
                        micMuted = micMuted, audioMuted = audioMuted,
                        onMicGain = { micGain = it }, onAudioGain = { audioGain = it },
                        onMicMute = { micMuted = !micMuted }, onAudioMute = { audioMuted = !audioMuted },
                        isPro = isPro, onProChange = { isPro = it },
                        monitoring = monitoring, onMonitoring = { monitoring = !monitoring },
                        autotuneOn = autotuneOn, onAutotune = { autotuneOn = !autotuneOn },
                        reverbOn = reverbOn, onReverb = { reverbOn = !reverbOn },
                        reverbValue = reverbValue, onReverbValue = { reverbValue = it },
                        tuneKey = tuneKey, tuneScale = tuneScale,
                        selector = selector, onSelector = { selector = it },
                        onSelectKey = { tuneKey = it; selector = null },
                        onSelectScale = { tuneScale = it; selector = null },
                        privacyPublic = privacyPublic, onPrivacy = { privacyPublic = !privacyPublic },
                        isPlaying = isPlaying, onPlay = onTogglePlay,
                        loopOn = loopOn, onLoop = { loopOn = !loopOn },
                        multitrack = multitrack, onMultitrack = { multitrack = !multitrack },
                        hasTrack = hasTrack, trackName = trackName,
                        trackDurationMs = trackDurationMs, trackSamples = trackSamples,
                        playProgress = playProgress,
                        onImport = onImport,
                        extraLaneCount = extraLaneCount,
                        onAddLane = { extraLaneCount++ },
                        onRemoveLane = { if (extraLaneCount > 0) extraLaneCount-- },
                        onImportPack = onImport,
                    )
                    WaveTab.CHAT -> WaveChatPanel(
                        Modifier.fillMaxSize(), pinnedMessage = pinnedChatMessage,
                        onPinMessage = { pinnedChatMessage = it },
                        notificationsRead = waveNotificationsRead,
                        onReadNotifications = { waveNotificationsRead = true },
                    )
                    WaveTab.INVITES -> WaveGuestsPanel(guestState, Modifier.fillMaxSize())
                    else -> WaveTabPlaceholder(activeTab)
                }
                }
            }
        }
        }
        WaveGuestDragOverlay(guestState)
        if (showLeaveConfirm) {
            AlertDialog(
                onDismissRequest = { showLeaveConfirm = false },
                containerColor = Color(0xFF14121C),
                title = {
                    Text(
                        "Quitter le live ?",
                        color = WaveMixerTheme.pearl,
                        fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = WaveMixerTheme.fontFamily
                    )
                },
                text = {
                    Text(
                        "Tu es sur le point de quitter le live.",
                        color = white(0.72f),
                        fontSize = 13.sp,
                        fontFamily = WaveMixerTheme.fontFamily
                    )
                },
                confirmButton = {
                    Text(
                        "Quitter",
                        color = Color(0xFFFF536C),
                        fontSize = 13.sp, fontWeight = FontWeight.Bold,
                        fontFamily = WaveMixerTheme.fontFamily,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { showLeaveConfirm = false; onClose() }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                },
                dismissButton = {
                    Text(
                        "Rester",
                        color = WaveMixerTheme.pearl,
                        fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = WaveMixerTheme.fontFamily,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { showLeaveConfirm = false }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            )
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Header — chevron.left / « La Wave » / xmark.                                */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveHeader(title: String, onBack: () -> Unit, onClose: () -> Unit) {
    Box(Modifier.fillMaxWidth().height(44.dp).padding(horizontal = 6.dp)) {
        // Chevron retour à gauche.
        Box(
            Modifier
                .align(Alignment.CenterStart)
                .size(36.dp)
                .clickable(onClick = onBack),
            contentAlignment = Alignment.Center
        ) {
            Icon(WaveIcons.ChevronLeft, null, tint = Color.White, modifier = Modifier.size(17.dp))
        }
        Text(
            title, color = WaveMixerTheme.pearl,
            fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
            fontFamily = WaveMixerTheme.fontFamily, maxLines = 1,
            modifier = Modifier.align(Alignment.Center)
        )
        // Share + croix — prévient avant de quitter le live.
        Row(
            Modifier.align(Alignment.CenterEnd),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier
                    .size(36.dp)
                    .clickable { },
                contentAlignment = Alignment.Center
            ) {
                Icon(WaveIcons.Share, null, tint = Color.White, modifier = Modifier.size(15.dp))
            }
            Box(
                Modifier
                    .size(36.dp)
                    .clickable(onClick = onClose),
                contentAlignment = Alignment.Center
            ) {
                Icon(WaveIcons.Close, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun HeaderCounter(value: String, tint: Color? = null, icon: ImageVector? = null, imageRes: Int? = null) {
    Row(
        Modifier.padding(horizontal = 4.dp).height(26.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (imageRes != null) {
            Image(painterResource(imageRes), null, modifier = Modifier.size(14.dp))
        } else if (icon != null && tint != null) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(12.dp))
        }
        Spacer(Modifier.width(4.dp))
        Text(
            value, color = white(0.88f),
            fontSize = 10.sp, fontWeight = FontWeight.Bold,
            fontFamily = WaveMixerTheme.fontFamily
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Panneau vidéo 16:9 — cellule clip r8 + camera-off + expand.                 */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveVideo(cameraOff: Boolean, modifier: Modifier = Modifier) {
    // Chronomètre fictif qui défile depuis l'ouverture de l'écran.
    var elapsed by remember { mutableStateOf(12L * 60L + 47L) }
    LaunchedEffect(Unit) {
        while (true) { delay(1000L); elapsed++ }
    }
    val clock = "%02d:%02d:%02d".format(elapsed / 3600, (elapsed % 3600) / 60, elapsed % 60)

    Box(
        modifier
            .fillMaxWidth()
            .aspectRatio(16f / 9f)
            .padding(0.dp)
            .drawBehind {
                // Halo blanc 0.11 r10 + 0.045 r22 autour de la cellule.
                drawRoundRect(white(0.045f), cornerRadius = CornerRadius(22.dp.toPx()))
                drawRoundRect(white(0.11f), cornerRadius = CornerRadius(10.dp.toPx()))
            }
            .padding(0.5.dp)
            .clip(RoundedCornerShape(8.dp))
            .mixerSurfaceBackground()
            .drawBehind {
                // Cheveux blanc 0.16 (0.7dp) en haut et bas.
                val lw = 0.7.dp.toPx()
                drawRect(white(0.16f), size = Size(size.width, lw))
                drawRect(white(0.16f), topLeft = Offset(0f, size.height - lw), size = Size(size.width, lw))
            }
    ) {
        // Retour vidéo — boucle muette (démo : dj-turntable / landscape-dj).
        AndroidView(
            factory = { ctx ->
                android.widget.VideoView(ctx).apply {
                    setVideoURI(android.net.Uri.parse("android.resource://" + ctx.packageName + "/" + R.raw.wave_live_loop))
                    setOnPreparedListener { mp ->
                        mp.isLooping = true
                        mp.setVolume(0f, 0f)
                        start()
                    }
                }
            },
            modifier = Modifier.fillMaxSize()
        )
        // Chip chrono — haut-gauche, verre sombre translucide + point rouge.
        Row(
            Modifier
                .align(Alignment.TopStart)
                .padding(top = 8.dp, start = 10.dp)
                .clip(RoundedCornerShape(50))
                .background(Color(0xFF04040A).copy(alpha = 0.48f))
                .border(1.dp, white(0.10f), RoundedCornerShape(50))
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier.size(6.dp).drawBehind {
                    drawCircle(Color(0xFFFF536C).copy(alpha = 0.25f), radius = size.minDimension / 2f)
                    drawCircle(Color(0xFFFF536C), radius = size.minDimension * 0.32f)
                }
            )
            Spacer(Modifier.width(5.dp))
            Text(
                clock, color = Color.White,
                fontSize = 9.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.6.sp,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        // Chip « LA WAVE » — haut-droite, recette rooms-home-card__room-type (accent #27C2D1).
        Row(
            Modifier
                .align(Alignment.TopEnd)
                .padding(top = 8.dp, end = 10.dp)
                .clip(RoundedCornerShape(50))
                .background(Color(0xFF060712).copy(alpha = 0.52f))
                .background(Color(0xFF27C2D1).copy(alpha = 0.10f))
                .border(1.dp, Color(0xFF27C2D1).copy(alpha = 0.42f), RoundedCornerShape(50))
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "LA WAVE", color = Color(0xFF27C2D1),
                fontSize = 8.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        // Bouton expand — coin inférieur droit.
        Box(
            Modifier
                .align(Alignment.BottomEnd)
                .padding(8.dp)
                .size(34.dp)
                .clip(CircleShape)
                .background(black44())
                .border(0.5.dp, white(0.10f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(WaveIcons.Expand, null, tint = Color.White, modifier = Modifier.size(12.dp))
        }
    }
}

private fun black44() = Color.Black.copy(alpha = 0.44f)

/* ------------------------------------------------------------------------- */
/* Tab bar — capsule chrome navigation subdued + capsule active animée.        */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveTabBar(
    active: WaveTab,
    onSelect: (WaveTab) -> Unit,
    modifier: Modifier = Modifier,
) {
    val view = LocalView.current
    val shape = RoundedCornerShape(17.dp)
    Box(
        modifier
            .hifiBlackSurface(17.dp)
            .clip(shape)
            .padding(3.dp)
    ) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val slot = maxWidth / 4f
            val capsuleX by animateDpAsState(targetValue = slot * active.ordinal, label = "tab")
            // Capsule active glissante.
            Box(
                Modifier
                    .offset(x = capsuleX)
                    .width(slot)
                    .fillMaxHeight()
                    .activeCapsule(13.dp)
            )
            Row(Modifier.fillMaxSize()) {
                WaveTab.entries.forEach { tab ->
                    val isActive = tab == active
                    Box(
                        Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                onSelect(tab)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                tab.icon, null,
                                tint = if (isActive) WaveMixerTheme.violetSoft else WaveMixerTheme.secondary,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(Modifier.width(5.dp))
                            Text(
                                tab.label,
                                color = if (isActive) WaveMixerTheme.pearl else WaveMixerTheme.secondary,
                                fontSize = 10.5.sp,
                                fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Medium,
                                fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
                            )
                        }
                    }
                }
            }
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Corps du Mixeur — strips alignés + diviseur + colonne FX + deck.            */
/* ------------------------------------------------------------------------- */

@Composable
private fun MixerBody(
    micGain: Float, audioGain: Float, micMuted: Boolean, audioMuted: Boolean,
    onMicGain: (Float) -> Unit, onAudioGain: (Float) -> Unit,
    onMicMute: () -> Unit, onAudioMute: () -> Unit,
    isPro: Boolean, onProChange: (Boolean) -> Unit,
    monitoring: Boolean, onMonitoring: () -> Unit,
    autotuneOn: Boolean, onAutotune: () -> Unit,
    reverbOn: Boolean, onReverb: () -> Unit,
    reverbValue: Float, onReverbValue: (Float) -> Unit,
    tuneKey: String, tuneScale: String,
    selector: String?, onSelector: (String?) -> Unit,
    onSelectKey: (String) -> Unit, onSelectScale: (String) -> Unit,
    privacyPublic: Boolean, onPrivacy: () -> Unit,
    isPlaying: Boolean, onPlay: () -> Unit,
    loopOn: Boolean, onLoop: () -> Unit,
    multitrack: Boolean, onMultitrack: () -> Unit,
    hasTrack: Boolean, trackName: String?,
    trackDurationMs: Long, trackSamples: List<WaveformSample>, playProgress: Float, trackAnalyzing: Boolean = false,
    onImport: () -> Unit,
    extraLaneCount: Int,
    onAddLane: () -> Unit,
    onRemoveLane: (Int) -> Unit,
    onImportPack: () -> Unit,
) {
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
        // Région haute : strips + diviseur + FX.
        BoxWithConstraints(Modifier.fillMaxWidth().weight(1f).padding(top = 10.dp)) {
            val cw = maxWidth
            val slot = (cw - 6.dp) / 4f
            // Strip Micro sous le slot Chat, Audio sous le slot Mixeur.
            WaveChannelStrip(
                label = "Luma", icon = WaveIcons.Mic,
                portraitRes = R.drawable.wave_artist_luma,
                gain = micGain, muted = micMuted, isMic = true,
                onGainChange = onMicGain, onToggleMute = onMicMute,
                modifier = Modifier.offset(x = 3.dp).width(slot).fillMaxHeight()
            )
            WaveChannelStrip(
                label = "Audio", icon = WaveIcons.MusicNote,
                gain = audioGain, muted = audioMuted, isMic = false,
                onGainChange = onAudioGain, onToggleMute = onAudioMute,
                modifier = Modifier.offset(x = 3.dp + slot).width(slot).fillMaxHeight()
            )
            // Séparateur vertical centré, blanc 0.07, marges v6.
            Box(
                Modifier
                    .offset(x = cw / 2f - 0.5.dp)
                    .width(1.dp)
                    .fillMaxHeight()
                    .padding(vertical = 6.dp)
                    .background(white(0.07f))
            )
            // Colonne FX (moitié droite, inset 16 depuis le diviseur).
            FxColumn(
                isPro = isPro, onProChange = onProChange,
                monitoring = monitoring, onMonitoring = onMonitoring,
                autotuneOn = autotuneOn, onAutotune = onAutotune,
                reverbOn = reverbOn, onReverb = onReverb,
                reverbValue = reverbValue, onReverbValue = onReverbValue,
                tuneKey = tuneKey, tuneScale = tuneScale,
                selector = selector, onSelector = onSelector,
                onSelectKey = onSelectKey, onSelectScale = onSelectScale,
                modifier = Modifier
                    .offset(x = cw / 2f + 16.dp)
                    .width(cw / 2f - 16.dp)
                    .fillMaxHeight()
            )
        }
        // Deck ancré en bas (mode compact).
        MixerDeck(
            privacyPublic = privacyPublic, onPrivacy = onPrivacy,
            isPlaying = isPlaying, onPlay = onPlay,
            loopOn = loopOn, onLoop = onLoop,
            multitrack = multitrack, onMultitrack = onMultitrack,
            hasTrack = hasTrack, trackName = trackName,
            trackDurationMs = trackDurationMs, trackSamples = trackSamples, playProgress = playProgress, trackAnalyzing = trackAnalyzing,
            onImport = onImport,
            extraLaneCount = extraLaneCount,
            onAddLane = onAddLane, onRemoveLane = onRemoveLane, onImportPack = onImportPack,
            expanded = false,
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp, bottom = 4.dp)
        )
        }
        // Feuille multipiste déployée — glisse du bas jusqu'à la navbar du haut.
        AnimatedVisibility(
            visible = multitrack,
            modifier = Modifier.fillMaxSize(),
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
        ) {
            MixerDeck(
                privacyPublic = privacyPublic, onPrivacy = onPrivacy,
                isPlaying = isPlaying, onPlay = onPlay,
                loopOn = loopOn, onLoop = onLoop,
                multitrack = multitrack, onMultitrack = onMultitrack,
                hasTrack = hasTrack, trackName = trackName,
                trackDurationMs = trackDurationMs, trackSamples = trackSamples, playProgress = playProgress, trackAnalyzing = trackAnalyzing,
                onImport = onImport,
                extraLaneCount = extraLaneCount,
                onAddLane = onAddLane, onRemoveLane = onRemoveLane, onImportPack = onImportPack,
                expanded = true,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 4.dp)
            )
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Colonne FX — cluster utilitaire + cartes / panneau sélecteur.               */
/* ------------------------------------------------------------------------- */

@Composable
private fun FxColumn(
    isPro: Boolean, onProChange: (Boolean) -> Unit,
    monitoring: Boolean, onMonitoring: () -> Unit,
    autotuneOn: Boolean, onAutotune: () -> Unit,
    reverbOn: Boolean, onReverb: () -> Unit,
    reverbValue: Float, onReverbValue: (Float) -> Unit,
    tuneKey: String, tuneScale: String,
    selector: String?, onSelector: (String?) -> Unit,
    onSelectKey: (String) -> Unit, onSelectScale: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Rangée utilitaire h32, alignée à droite : [Simple|Pro] + casque.
        Row(
            Modifier.fillMaxWidth().height(32.dp),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            SimpleProToggle(isPro = isPro, onChange = onProChange)
            Spacer(Modifier.width(8.dp))
            HeadphoneButton(enabled = monitoring, onToggle = onMonitoring)
        }
        if (isPro) {
            ProPluginsPanel(Modifier.fillMaxWidth().weight(1f))
        } else if (selector == null) {
            // Carte Autotune.
            FxCard(
                title = "Autotune", icon = WaveIcons.Waveform,
                on = autotuneOn, onToggle = onAutotune,
                modifier = Modifier.fillMaxWidth().weight(1f)
            ) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TuneSelectorField(
                        label = "Clé", value = tuneKey,
                        enabled = autotuneOn,
                        onClick = { onSelector("key") },
                        modifier = Modifier.weight(0.40f)
                    )
                    TuneSelectorField(
                        label = "Gamme", value = tuneScale,
                        enabled = autotuneOn,
                        onClick = { onSelector("scale") },
                        modifier = Modifier.weight(0.60f)
                    )
                }
            }
            // Carte Réverb.
            FxCard(
                title = "Réverb", icon = WaveIcons.Reverb,
                on = reverbOn, onToggle = onReverb,
                modifier = Modifier.fillMaxWidth().weight(1f)
            ) {
                ReverbSlider(value = reverbValue, enabled = reverbOn, onChange = onReverbValue)
            }
        } else {
            TuneSelectorPanel(
                kind = selector,
                currentKey = tuneKey, currentScale = tuneScale,
                onSelectKey = onSelectKey, onSelectScale = onSelectScale,
                onClose = { onSelector(null) },
                modifier = Modifier.fillMaxWidth().weight(1f)
            )
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Panneau Pro — Effets voix + ajout de plugin (parité iOS proPanel).          */
/* ------------------------------------------------------------------------- */

@Composable
private fun ProPluginsPanel(modifier: Modifier = Modifier) {
    Column(
        modifier.verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            "Effets voix",
            color = white(0.86f),
            fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
            fontFamily = WaveMixerTheme.fontFamily
        )
        Row(
            Modifier
                .fillMaxWidth()
                .height(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .satinControl(10.dp)
                .clickable { },
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(WaveIcons.Add, null, tint = white(0.88f), modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                "Ajouter un plugin",
                color = white(0.88f),
                fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        Text(
            "Aucun plugin disponible.",
            color = white(0.48f),
            fontSize = 10.sp, fontWeight = FontWeight.Bold,
            fontFamily = WaveMixerTheme.fontFamily,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Toggle Simple/Pro — capsule E-bis sur l'option active.                      */
/* ------------------------------------------------------------------------- */

@Composable
private fun SimpleProToggle(isPro: Boolean, onChange: (Boolean) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.CenterVertically) {
        ProOption(label = "Simple", active = !isPro, onClick = { onChange(false) })
        ProOption(label = "Pro", active = isPro, onClick = { onChange(true) })
    }
}

@Composable
private fun ProOption(label: String, active: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .height(26.dp)
            .then(if (active) Modifier.roomsStudioCapsule() else Modifier)
            .clip(RoundedCornerShape(13.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            label,
            color = if (active) Color.White else white(0.46f),
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.SemiBold else FontWeight.Medium,
            fontFamily = WaveMixerTheme.fontFamily
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Bouton casque (monitoring) — matériau B regular / capsule E.                */
/* ------------------------------------------------------------------------- */

@Composable
private fun HeadphoneButton(enabled: Boolean, onToggle: () -> Unit) {
    Box(
        Modifier
            .size(26.dp)
            .clip(CircleShape)
            .then(
                if (enabled) Modifier.activeCapsule(13.dp)
                else Modifier.hardwareSurface(13.dp, raised = true, reflection = 0.085f)
            )
            .clickable(onClick = onToggle),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            WaveIcons.Headphones, null,
            tint = if (enabled) Color.White else white(0.58f),
            modifier = Modifier.size(11.dp)
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Panneau sélecteur — grille de clés (4 col.) ou liste de gammes, matériau C. */
/* ------------------------------------------------------------------------- */

private val AUTOTUNE_KEYS = listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
private val AUTOTUNE_SCALES = listOf("Chromatique", "Majeur", "Mineur")

@Composable
private fun TuneSelectorPanel(
    kind: String,
    currentKey: String,
    currentScale: String,
    onSelectKey: (String) -> Unit,
    onSelectScale: (String) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    HiFiBlackCard(modifier, cornerRadius = 12.dp) {
        Column(Modifier.padding(9.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    if (kind == "key") "Clé" else "Gamme",
                    color = white(0.62f), fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily
                )
                Spacer(Modifier.weight(1f))
                Box(
                    Modifier.size(26.dp).clip(CircleShape).clickable(onClick = onClose),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(WaveIcons.Close, null, tint = white(0.62f), modifier = Modifier.size(11.dp))
                }
            }
            if (kind == "key") {
                AUTOTUNE_KEYS.chunked(4).forEach { row ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        row.forEach { key ->
                            SelectorOption(
                                label = key, selected = key == currentKey,
                                onClick = { onSelectKey(key) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        repeat(4 - row.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            } else {
                AUTOTUNE_SCALES.forEach { scale ->
                    SelectorOption(
                        label = scale, selected = scale == currentScale,
                        onClick = { onSelectScale(scale) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
private fun SelectorOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier
            .height(30.dp)
            .clip(RoundedCornerShape(8.dp))
            .satinControl(8.dp, selected = selected)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            label,
            color = if (selected) Color.White else white(0.86f),
            fontSize = 12.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
            fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Deck — transport + « Piste principale » + lane waveform/import.             */
/* ------------------------------------------------------------------------- */

@Composable
private fun MixerDeck(
    privacyPublic: Boolean, onPrivacy: () -> Unit,
    isPlaying: Boolean, onPlay: () -> Unit,
    loopOn: Boolean, onLoop: () -> Unit,
    multitrack: Boolean, onMultitrack: () -> Unit,
    hasTrack: Boolean, trackName: String?,
    trackDurationMs: Long, trackSamples: List<WaveformSample>, playProgress: Float, trackAnalyzing: Boolean = false,
    onImport: () -> Unit,
    extraLaneCount: Int,
    onAddLane: () -> Unit,
    onRemoveLane: (Int) -> Unit,
    onImportPack: () -> Unit,
    expanded: Boolean,
    modifier: Modifier = Modifier,
) {
    HiFiBlackCard(modifier, cornerRadius = 12.dp) {
        Column {
            // Transport h56.
            Row(
                Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Privé / Public.
                Box(
                    Modifier
                        .height(32.dp)
                        .width(54.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .then(if (privacyPublic) Modifier.roomsStudioCapsule(10.dp) else Modifier.hardwareSurface(6.dp, raised = true, reflection = 0.085f))
                        .clickable(onClick = onPrivacy),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        if (privacyPublic) "Public" else "Privé",
                        color = if (privacyPublic) white(0.86f) else white(0.28f),
                        fontSize = 12.sp, fontWeight = FontWeight.Medium,
                        fontFamily = WaveMixerTheme.fontFamily
                    )
                }
                DeckIconButton(icon = WaveIcons.Repeat, active = loopOn, onClick = onLoop)
                DeckIconButton(icon = WaveIcons.Previous, active = false, enabled = hasTrack, onClick = {})
                DeckPlayButton(isPlaying = isPlaying, enabled = hasTrack, onClick = onPlay)
                DeckIconButton(icon = WaveIcons.Next, active = false, enabled = hasTrack, onClick = {})
                DeckIconButton(icon = WaveIcons.Import, active = false, onClick = onImport)
                DeckIconButton(icon = WaveIcons.Layers, active = multitrack, onClick = onMultitrack)
            }
            // Hairline blanc 0.10.
            Box(Modifier.fillMaxWidth().height(0.5.dp).background(white(0.10f)))
            // Bande info h32.
            Row(
                Modifier
                    .fillMaxWidth()
                    .height(32.dp)
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    trackName ?: "Piste principale",
                    color = WaveMixerTheme.pearl, fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily,
                    maxLines = 1
                )
                Spacer(Modifier.weight(1f))
                if (hasTrack) {
                    Text(
                        "${formatTrackTime((trackDurationMs * playProgress).toLong())} / ${formatTrackTime(trackDurationMs)}",
                        color = WaveMixerTheme.secondary, fontSize = 10.sp,
                        fontWeight = FontWeight.Medium, fontFamily = WaveMixerTheme.fontFamily
                    )
                }
            }
            // Corps du deck : compact = lane unique ; déployé = lanes scrollables + toolbar.
            if (expanded) {
                Column(
                    Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    DeckMainLane(hasTrack = hasTrack, onImport = onImport, samples = trackSamples, progress = playProgress, analyzing = trackAnalyzing)
                    repeat(extraLaneCount) { index ->
                        DeckExtraLane(onImport = onImport, onRemove = { onRemoveLane(index) })
                    }
                }
                // Toolbar « Ajouter une piste » / « Dossier ou ZIP ».
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 8.dp)
                        .height(36.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    StudioPackButton(title = "Ajouter une piste", icon = WaveIcons.Add, onClick = onAddLane, modifier = Modifier.weight(1f))
                    StudioPackButton(title = "Dossier ou ZIP", icon = WaveIcons.Folder, onClick = onImportPack, modifier = Modifier.weight(1f))
                }
            } else {
                DeckMainLane(
                    hasTrack = hasTrack, onImport = onImport,
                    samples = trackSamples, progress = playProgress, analyzing = trackAnalyzing,
                    modifier = Modifier.padding(horizontal = 8.dp).padding(bottom = 8.dp)
                )
            }
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Lane « WaveStudioCardBackground » — fill white 0.035 + stroke 0.07, r12, h70 */
/* ------------------------------------------------------------------------- */

@Composable
private fun DeckMainLane(
    hasTrack: Boolean,
    onImport: () -> Unit,
    samples: List<WaveformSample> = emptyList(),
    progress: Float = 0f,
    analyzing: Boolean = false,
    modifier: Modifier = Modifier
) {
    Box(
        modifier
            .fillMaxWidth()
            .height(70.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(white(0.035f))
            .border(1.dp, white(0.07f), RoundedCornerShape(12.dp))
            .then(if (!hasTrack) Modifier.clickable(onClick = onImport) else Modifier),
        contentAlignment = Alignment.Center
    ) {
        if (!hasTrack) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(WaveIcons.Add, null, tint = white(0.86f), modifier = Modifier.size(13.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    "Importer un audio",
                    color = white(0.86f), fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily
                )
            }
        } else if (analyzing || samples.isEmpty()) {
            Text(
                if (analyzing) "Analyse du son…" else "Waveform indisponible",
                color = white(0.55f), fontSize = 11.sp,
                fontWeight = FontWeight.Medium, fontFamily = WaveMixerTheme.fontFamily
            )
        } else {
            // MWDetailedAudioWaveform : traits très fins, peak + rms, jouée en accent.
            Canvas(Modifier.fillMaxSize().padding(horizontal = 10.dp, vertical = 3.dp)) {
                val maxColumns = maxOf(128, (size.width * 3f).toInt())
                val count = minOf(samples.size, maxColumns)
                val step = size.width / count
                val barW = maxOf(0.35f, step * 0.72f)
                val centerY = size.height * 0.5f
                val half = maxOf(1f, size.height * 0.50f)
                val gain = 1.5f
                val progressX = size.width * progress.coerceIn(0f, 1f)
                drawLine(white(0.08f), Offset(0f, centerY), Offset(size.width, centerY), 1f)
                for (i in 0 until count) {
                    // Aggregation iOS : min des min, max des max, moyenne des rms.
                    val s0 = (i.toLong() * samples.size / count).toInt()
                    val s1 = maxOf(s0 + 1, ((i + 1).toLong() * samples.size / count).toInt().coerceAtMost(samples.size))
                    var mn = 0f; var mx = 0f; var rs = 0f; var rc = 0
                    for (j in s0 until s1) {
                        val s = samples[j]
                        mn = minOf(mn, s.minPeak); mx = maxOf(mx, s.maxPeak); rs += s.rms; rc++
                    }
                    val rms = if (rc > 0) rs / rc else 0f
                    val x = i * step + (step - barW) * 0.5f
                    val played = x <= progressX
                    // Barre RMS (lueur de fond).
                    val rmsH = maxOf(1f, minOf(1f, rms * gain) * half)
                    drawRoundRect(
                        color = if (played) WaveMixerTheme.faderViolet.copy(alpha = 0.30f) else white(0.11f),
                        topLeft = Offset(x, centerY - rmsH),
                        size = Size(barW, rmsH * 2f),
                        cornerRadius = CornerRadius(maxOf(0.5f, barW * 0.5f))
                    )
                    // Trait peak fin par-dessus.
                    val top = centerY - minOf(1f, maxOf(mx, 0f) * gain) * half
                    val bottom = centerY + minOf(1f, maxOf(kotlin.math.abs(mn), 0f) * gain) * half
                    drawRoundRect(
                        color = if (played) WaveMixerTheme.faderViolet else white(0.30f),
                        topLeft = Offset(x, minOf(top, bottom)),
                        size = Size(barW, maxOf(1.4f, kotlin.math.abs(bottom - top))),
                        cornerRadius = CornerRadius(maxOf(0.5f, barW * 0.5f))
                    )
                }
            }
        }
    }
}

private fun formatTrackTime(ms: Long): String {
    val s = (ms / 1000).coerceAtLeast(0)
    return "%d:%02d".format(s / 60, s % 60)
}

@Composable
private fun DeckExtraLane(onImport: () -> Unit, onRemove: () -> Unit) {
    Box(
        Modifier
            .fillMaxWidth()
            .height(70.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(white(0.035f))
            .border(1.dp, white(0.07f), RoundedCornerShape(12.dp))
    ) {
        // Contenu centré « + Importer », inset droite pour la croix.
        Row(
            Modifier
                .fillMaxSize()
                .clickable(onClick = onImport)
                .padding(end = 18.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(WaveIcons.Add, null, tint = white(0.86f), modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(8.dp))
            Text(
                "Importer",
                color = white(0.86f), fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily
            )
        }
        // Croix « retirer la piste » en haut à droite.
        Box(
            Modifier
                .align(Alignment.TopEnd)
                .padding(8.dp)
                .size(22.dp)
                .clip(CircleShape)
                .background(white(0.06f))
                .clickable(onClick = onRemove),
            contentAlignment = Alignment.Center
        ) {
            Icon(WaveIcons.Close, null, tint = white(0.52f), modifier = Modifier.size(8.dp))
        }
    }
}

@Composable
private fun StudioPackButton(title: String, icon: ImageVector, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier
            .height(36.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(white(0.035f))
            .border(1.dp, white(0.07f), RoundedCornerShape(10.dp))
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = white(0.90f), modifier = Modifier.size(12.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                title,
                color = white(0.90f), fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily,
                maxLines = 1
            )
        }
    }
}

@Composable
private fun DeckIconButton(
    icon: ImageVector,
    active: Boolean,
    onClick: () -> Unit,
    enabled: Boolean = true,
) {
    Box(
        Modifier
            .size(44.dp)
            .alpha(if (enabled) 1f else 0.5f)
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Box(
            Modifier
                .size(32.dp)
                .clip(RoundedCornerShape(10.dp))
                .then(if (active) Modifier.background(WaveMixerTheme.violetSoft.copy(alpha = 0.13f)) else Modifier),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                icon, null,
                tint = if (active) WaveMixerTheme.violetSoft else WaveMixerTheme.pearl.copy(alpha = 0.88f),
                modifier = Modifier.size(17.dp)
            )
        }
    }
}

@Composable
private fun DeckPlayButton(isPlaying: Boolean, enabled: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .size(44.dp)
            .clickable(enabled = enabled, onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Box(
            Modifier
                .size(36.dp)
                .clip(CircleShape)
                .hardwareSurface(18.dp, raised = true, reflection = 0.085f)
                .alpha(if (enabled) 1f else 0.4f),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                if (isPlaying) WaveIcons.Pause else WaveIcons.Play, null,
                tint = WaveMixerTheme.pearl,
                modifier = Modifier
                    .size(16.dp)
                    .offset(x = if (isPlaying) 0.dp else 1.dp)
            )
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Placeholder pour les onglets non-Mixeur (hors périmètre de la spec).        */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveTabPlaceholder(tab: WaveTab) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(tab.icon, null, tint = WaveMixerTheme.muted, modifier = Modifier.size(28.dp))
            Text(
                tab.label, color = WaveMixerTheme.muted, fontSize = 13.sp,
                fontWeight = FontWeight.Medium, fontFamily = WaveMixerTheme.fontFamily
            )
        }
    }
}
