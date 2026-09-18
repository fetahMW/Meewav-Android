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
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

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
    var activeTab by remember { mutableStateOf(WaveTab.MIXEUR) }
    // Canaux.
    var micGain by remember { mutableStateOf(0.72f) }
    var audioGain by remember { mutableStateOf(0.62f) }
    var micMuted by remember { mutableStateOf(false) }
    var audioMuted by remember { mutableStateOf(false) }
    // FX.
    var isPro by remember { mutableStateOf(false) }
    var monitoring by remember { mutableStateOf(false) }
    var autotuneOn by remember { mutableStateOf(true) }
    var reverbOn by remember { mutableStateOf(true) }
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
    var extraLaneCount by remember { mutableStateOf(2) }
    // Sélecteur de fichier audio (bouton upload + lanes « Importer »).
    val importLauncher = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) {
            trackName = uri.lastPathSegment?.substringAfterLast('/')?.substringAfterLast(':')
            hasTrack = true
        }
    }
    val onImport: () -> Unit = { importLauncher.launch(arrayOf("audio/*")) }

    Box(Modifier.fillMaxSize().mixerSurfaceBackground()) {
        Column(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding()) {
            WaveHeader(title = "La Wave", onBack = onBack, onClose = onClose)
            WaveVideo(cameraOff = true)
            // Zone grise du mixeur : couvre la barre d'onglets ET le corps.
            Column(
                Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .mixerBodyBackground()
            ) {
                WaveTabBar(
                    active = activeTab,
                    onSelect = { activeTab = it },
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
                        isPlaying = isPlaying, onPlay = { isPlaying = !isPlaying },
                        loopOn = loopOn, onLoop = { loopOn = !loopOn },
                        multitrack = multitrack, onMultitrack = { multitrack = !multitrack },
                        hasTrack = hasTrack, trackName = trackName,
                        onImport = onImport,
                        extraLaneCount = extraLaneCount,
                        onAddLane = { extraLaneCount++ },
                        onRemoveLane = { if (extraLaneCount > 0) extraLaneCount-- },
                        onImportPack = onImport,
                    )
                    else -> WaveTabPlaceholder(activeTab)
                }
                }
            }
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Header — chevron.left / « La Wave » / xmark.                                */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveHeader(title: String, onBack: () -> Unit, onClose: () -> Unit) {
    Box(
        Modifier.fillMaxWidth().height(39.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            title,
            color = WaveMixerTheme.pearl,
            fontSize = 16.sp, fontWeight = FontWeight.Medium,
            fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
        )
        Row(Modifier.fillMaxSize()) {
            HeaderIconButton(icon = WaveIcons.ChevronLeft, onClick = onBack)
            Spacer(Modifier.weight(1f))
            HeaderIconButton(icon = WaveIcons.Close, onClick = onClose)
        }
    }
}

@Composable
private fun HeaderIconButton(icon: ImageVector, onClick: () -> Unit) {
    Box(
        Modifier
            .size(44.dp)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(icon, null, tint = Color.White, modifier = Modifier.size(17.dp))
    }
}

/* ------------------------------------------------------------------------- */
/* Panneau vidéo 16:9 — cellule clip r8 + camera-off + expand.                 */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveVideo(cameraOff: Boolean) {
    Box(
        Modifier
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
        if (cameraOff) {
            Column(
                Modifier.align(Alignment.Center),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Icon(
                    WaveIcons.CameraOff, null,
                    tint = Color.White,
                    modifier = Modifier
                        .size(34.dp)
                        .drawBehind {
                            // Lueur violette douce (radiale) sous l'icône.
                            drawCircle(
                                Brush.radialGradient(
                                    0f to WaveMixerTheme.capsuleAccent.copy(alpha = 0.45f),
                                    1f to Color.Transparent
                                ),
                                radius = size.minDimension * 1.5f
                            )
                        }
                )
                Text(
                    "CAMERA COUPEE",
                    color = white(0.55f),
                    fontSize = 10.sp, fontWeight = FontWeight.Bold,
                    fontFamily = WaveMixerTheme.fontFamily,
                    letterSpacing = 1.sp
                )
            }
        }
        // Bouton expand haut-droite.
        Box(
            Modifier
                .align(Alignment.TopEnd)
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
            .clip(shape)
            .hardwareSurface(17.dp, raised = false, reflection = 0.075f, silhouette = true, rimOpacity = 0.5f, shadowOpacity = 0.35f)
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
                label = "Micro", icon = WaveIcons.Mic,
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
        if (selector == null) {
            // Carte Autotune.
            FxCard(
                title = "Autotune", icon = WaveIcons.Waveform,
                on = autotuneOn, onToggle = onAutotune,
                modifier = Modifier.fillMaxWidth().weight(1f)
                    .alpha(if (autotuneOn) 1f else 0.55f)
            ) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TuneSelectorField(
                        label = "Clé", value = tuneKey,
                        onClick = { onSelector("key") },
                        modifier = Modifier.weight(0.40f)
                    )
                    TuneSelectorField(
                        label = "Gamme", value = tuneScale,
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
                    .alpha(if (reverbOn) 1f else 0.55f)
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
    MetalCard(modifier, cornerRadius = 12.dp) {
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
    onImport: () -> Unit,
    extraLaneCount: Int,
    onAddLane: () -> Unit,
    onRemoveLane: (Int) -> Unit,
    onImportPack: () -> Unit,
    expanded: Boolean,
    modifier: Modifier = Modifier,
) {
    MetalCard(modifier, cornerRadius = 12.dp) {
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
                        .then(if (privacyPublic) Modifier.roomsStudioCapsule(10.dp) else Modifier.satinControl(10.dp))
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
                        "0:00.000 / 0:00.000",
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
                    DeckMainLane(hasTrack = hasTrack, onImport = onImport)
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
private fun DeckMainLane(hasTrack: Boolean, onImport: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier
            .fillMaxWidth()
            .height(70.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(white(0.035f))
            .border(1.dp, white(0.07f), RoundedCornerShape(12.dp))
            .clickable(onClick = onImport),
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
        }
    }
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
                .satinControl(18.dp, isPlay = true)
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
