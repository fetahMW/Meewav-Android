package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R

private fun white(a: Float) = Color.White.copy(alpha = a)

/* ------------------------------------------------------------------------- */
/* Fader vertical — rail fin + remplissage violet + thumb pilule blanche.      */
/* ------------------------------------------------------------------------- */

@Composable
fun WaveFader(
    value: Float,
    onValueChange: (Float) -> Unit,
    muted: Boolean,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(modifier) {
        val h = constraints.maxHeight.toFloat()
        val level = value.coerceIn(0f, 1f)
        // Géométrie mesurée sur la référence iOS (pilule plus haute que large).
        val railW = 2.dp
        val fillW = 7.dp
        val thumbW = 16.dp
        val thumbH = 30.dp
        val thumbCenterY = h * (1f - level)

        Box(
            Modifier
                .fillMaxSize()
                .pointerInput(muted) {
                    if (muted) return@pointerInput
                    detectVerticalDragGestures { change, _ ->
                        change.consume()
                        onValueChange((1f - change.position.y / h).coerceIn(0f, 1f))
                    }
                }
                .pointerInput(muted) {
                    if (muted) return@pointerInput
                    detectTapGestures { p -> onValueChange((1f - p.y / h).coerceIn(0f, 1f)) }
                }
                .drawBehind {
                    val cx = size.width / 2f
                    val railPx = railW.toPx(); val fillPx = fillW.toPx()
                    val thumbWPx = thumbW.toPx(); val thumbHPx = thumbH.toPx()
                    // Rail : ligne fine pleine hauteur, blanc ~0.11.
                    drawRoundRect(
                        white(0.11f),
                        topLeft = Offset(cx - railPx / 2f, 0f),
                        size = Size(railPx, size.height),
                        cornerRadius = CornerRadius(railPx / 2f)
                    )
                    // Remplissage violet depuis le bas jusqu'au centre du thumb.
                    val fillColor = if (muted) white(0.14f) else WaveMixerTheme.faderViolet
                    val fillTop = thumbCenterY.coerceIn(0f, size.height)
                    if (fillTop < size.height) {
                        drawRoundRect(
                            fillColor,
                            topLeft = Offset(cx - fillPx / 2f, fillTop),
                            size = Size(fillPx, size.height - fillTop),
                            cornerRadius = CornerRadius(fillPx / 2f)
                        )
                    }
                    // Ombre douce du thumb.
                    drawRoundRect(
                        Color.Black.copy(alpha = 0.45f),
                        topLeft = Offset(cx - thumbWPx / 2f, thumbCenterY - thumbHPx / 2f + 1.5f * density),
                        size = Size(thumbWPx, thumbHPx),
                        cornerRadius = CornerRadius(thumbWPx / 2f)
                    )
                    // Thumb pilule perle adoucie (moins éblouissante que le blanc pur).
                    drawRoundRect(
                        Brush.verticalGradient(0f to Color(0xFFD6D8DE), 1f to Color(0xFFAFB3BC)),
                        topLeft = Offset(cx - thumbWPx / 2f, thumbCenterY - thumbHPx / 2f),
                        size = Size(thumbWPx, thumbHPx),
                        cornerRadius = CornerRadius(thumbWPx / 2f)
                    )
                    // Stries de grip usinées dans le cap (comme un fader hardware).
                    val gripW = thumbWPx * 0.52f
                    val gripH = 1f * density
                    val gripGap = 4f * density
                    for (i in -1..1) {
                        val gy = thumbCenterY + i * gripGap
                        drawRoundRect(
                            Color(0xFF5A5E66).copy(alpha = 0.55f),
                            topLeft = Offset(cx - gripW / 2f, gy - gripH / 2f),
                            size = Size(gripW, gripH),
                            cornerRadius = CornerRadius(gripH / 2f)
                        )
                    }
                }
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Vu-mètre 4dp — rail blanc 0.06 + remplissage dégradé depuis le bas.        */
/* ------------------------------------------------------------------------- */

@Composable
fun WaveMeter(level: Float, modifier: Modifier = Modifier) {
    val lvl = level.coerceIn(0f, 1f)
    Box(
        modifier
            .fillMaxHeight()
            .width(6.dp)
            .drawBehind {
                // Échelle à segments : petits rectangles empilés, allumés jusqu'au niveau.
                val segH = 4f * density
                val gap = 2f * density
                val pitch = segH + gap
                val n = ((size.height + gap) / pitch).toInt().coerceAtLeast(1)
                val litH = size.height * lvl
                val r = size.width / 2f
                for (i in 0 until n) {
                    val dist = i * pitch
                    val segTop = size.height - dist - segH
                    val lit = dist < litH
                    val color = if (lit) meterColorAt(dist / size.height) else white(0.06f)
                    drawRoundRect(
                        color,
                        topLeft = Offset(0f, segTop),
                        size = Size(size.width, segH),
                        cornerRadius = CornerRadius(r)
                    )
                }
            }
    )
}

/** Échantillonne le dégradé du vu-mètre : bleu en bas (t=0) → rose en haut (t=1). */
private fun meterColorAt(t: Float): Color {
    val stops = WaveMixerTheme.meterStops
    val tc = t.coerceIn(0f, 1f)
    var lo = stops.first()
    var hi = stops.last()
    for (s in stops) {
        if (s.first <= tc) lo = s
        if (s.first >= tc) { hi = s; break }
    }
    val span = hi.first - lo.first
    val f = if (span <= 0f) 0f else (tc - lo.first) / span
    return lerp(lo.second, hi.second, f.coerceIn(0f, 1f))
}

/* ------------------------------------------------------------------------- */
/* Bouton mute 44×24 — matériau B regular r6, icône semibold.                  */
/* ------------------------------------------------------------------------- */

@Composable
fun WaveMuteButton(
    isMic: Boolean,
    muted: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier
            .size(44.dp, 24.dp)
            .clip(RoundedCornerShape(6.dp))
            .hardwareSurface(6.dp, raised = true, reflection = 0.085f)
            .clickable(onClick = onToggle),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = if (isMic) {
                if (muted) WaveIcons.MicOff else WaveIcons.Mic
            } else {
                if (muted) WaveIcons.VolumeOff else WaveIcons.VolumeUp
            },
            contentDescription = null,
            tint = if (muted) WaveMixerTheme.red else white(0.74f),
            modifier = Modifier.size(11.dp)
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Strip canal (Micro / Audio) — variante studio webMixer.                     */
/* ------------------------------------------------------------------------- */

@Composable
fun WaveChannelStrip(
    label: String,
    icon: ImageVector,
    gain: Float,
    muted: Boolean,
    isMic: Boolean,
    portraitRes: Int? = null,
    showHeader: Boolean = true,
    onGainChange: (Float) -> Unit,
    onToggleMute: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (showHeader) Row(
            modifier = Modifier.height(32.dp).fillMaxWidth(),
            horizontalArrangement = if (portraitRes != null) Arrangement.Start else Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (portraitRes != null) {
                Image(
                    painter = painterResource(portraitRes),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                )
            } else {
                Icon(icon, null, tint = white(0.86f), modifier = Modifier.size(11.dp))
            }
            Spacer(Modifier.width(5.dp))
            Text(
                label,
                color = white(0.86f),
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = WaveMixerTheme.fontFamily,
                maxLines = 1
            )
        }
        // Fader seul, centré — le vu-mètre est retiré pour alléger l'interface mobile.
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.Center
        ) {
            WaveFader(
                value = gain,
                onValueChange = onGainChange,
                muted = muted,
                modifier = Modifier.width(28.dp).fillMaxHeight()
            )
        }
        WaveMuteButton(isMic = isMic, muted = muted, onToggle = onToggleMute)
    }
}

/* ------------------------------------------------------------------------- */
/* Châssis noir Hi-Fi partagé avec la navbar et le lecteur.                  */
/* ------------------------------------------------------------------------- */

@Composable
fun HiFiBlackCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 12.dp,
    content: @Composable () -> Unit,
) {
    val shape = RoundedCornerShape(cornerRadius)
    Box(modifier.hifiBlackSurface(cornerRadius).clip(shape)) {
        content()
    }
}

/* ------------------------------------------------------------------------- */
/* Bouton power — icône power 9sp sur matériau D / capsule active.             */
/* ------------------------------------------------------------------------- */

@Composable
fun PowerButton(on: Boolean, onToggle: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier
            .size(28.dp, 24.dp)
            .clip(RoundedCornerShape(9.dp))
            .satinControl(8.dp)
            .clickable(onClick = onToggle),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            WaveIcons.Power, null,
            tint = if (on) WaveMixerTheme.fxAccent else white(0.28f),
            modifier = Modifier.size(10.dp)
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Carte FX — en-tête (icône + titre + power) + contenu, matériau C.           */
/* ------------------------------------------------------------------------- */

@Composable
fun FxCard(
    title: String,
    icon: ImageVector,
    on: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Box(modifier) {
        HiFiBlackCard(Modifier.fillMaxSize(), cornerRadius = 12.dp) {
            Column(
                Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(24.dp, 22.dp), contentAlignment = Alignment.Center) {
                        Icon(
                            icon, null,
                            tint = if (on) WaveMixerTheme.fxAccent else white(0.30f),
                            modifier = Modifier.size(14.dp)
                        )
                    }
                    Spacer(Modifier.width(6.dp))
                    Text(
                        title,
                        color = white(if (on) 0.90f else 0.42f),
                        fontSize = 11.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
                    )
                    Spacer(Modifier.weight(1f))
                    PowerButton(on = on, onToggle = onToggle)
                }
                content()
            }
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Champ sélecteur Autotune — label au-dessus + boîte satin (valeur + chevron).*/
/* ------------------------------------------------------------------------- */

@Composable
fun TuneSelectorField(
    label: String,
    value: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(
            label, color = white(if (enabled) 0.60f else 0.32f), fontSize = 10.sp,
            fontWeight = FontWeight.Medium, fontFamily = WaveMixerTheme.fontFamily
        )
        Row(
            Modifier
                .fillMaxWidth()
                .height(30.dp)
                .clip(RoundedCornerShape(6.dp))
                .hardwareSurface(6.dp, raised = true, reflection = 0.085f)
                .clickable(onClick = onClick)
                .padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                value, color = white(if (enabled) 0.94f else 0.44f), fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily
            )
            Spacer(Modifier.weight(1f))
            Icon(WaveIcons.ChevronDown, null, tint = white(if (enabled) 0.50f else 0.25f), modifier = Modifier.size(8.dp))
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Slider Réverb — Douce/Large + piste capsule + thumb cercle blanc 18dp.      */
/* ------------------------------------------------------------------------- */

@Composable
fun ReverbSlider(
    value: Float,
    enabled: Boolean,
    onChange: (Float) -> Unit,
    modifier: Modifier = Modifier,
) {
    var dragging by remember { mutableStateOf(false) }
    val v = value.coerceIn(0f, 1f)
    Column(modifier) {
        Row(Modifier.fillMaxWidth()) {
            Text(
                "Douce", color = white(if (enabled) 0.38f + 0.50f * (1f - v) else 0.36f),
                fontSize = 10.sp, fontWeight = FontWeight.Medium,
                fontFamily = WaveMixerTheme.fontFamily
            )
            Spacer(Modifier.weight(1f))
            Text(
                "Large", color = white(if (enabled) 0.38f + 0.50f * v else 0.36f),
                fontSize = 10.sp, fontWeight = FontWeight.Medium,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        Spacer(Modifier.height(5.dp))
        BoxWithConstraints(
            Modifier
                .fillMaxWidth()
                .height(30.dp)
                .clip(RoundedCornerShape(6.dp))
                .hardwareSurface(6.dp, raised = true, reflection = 0.085f)
        ) {
            val w = constraints.maxWidth.toFloat()
            val d = LocalDensity.current
            val thumbPx = with(d) { 14.dp.toPx() }
            val padPx = with(d) { 8.dp.toPx() }
            val usable = (w - padPx * 2f - thumbPx).coerceAtLeast(1f)
            val cx = padPx + thumbPx / 2f + usable * v
            Box(
                Modifier
                    .fillMaxSize()
                    .pointerInput(enabled) {
                        if (!enabled) return@pointerInput
                        detectHorizontalDragGestures(
                            onDragStart = { dragging = true },
                            onDragEnd = { dragging = false },
                            onDragCancel = { dragging = false }
                        ) { change, _ ->
                            change.consume()
                            val uw = (w - padPx * 2f - thumbPx).coerceAtLeast(1f)
                            onChange(((change.position.x - padPx - thumbPx / 2f) / uw).coerceIn(0f, 1f))
                        }
                    }
                    .pointerInput(enabled) {
                        if (!enabled) return@pointerInput
                        detectTapGestures { p ->
                            val uw = (w - padPx * 2f - thumbPx).coerceAtLeast(1f)
                            onChange(((p.x - padPx - thumbPx / 2f) / uw).coerceIn(0f, 1f))
                        }
                    }
                    .drawBehind {
                        val cy = size.height / 2f
                        val trackH = 4.dp.toPx()
                        val left = padPx + thumbPx / 2f
                        val right = size.width - padPx - thumbPx / 2f
                        // Piste capsule blanc 0.10.
                        drawRoundRect(
                            white(0.10f),
                            topLeft = Offset(left, cy - trackH / 2f),
                            size = Size(right - left, trackH),
                            cornerRadius = CornerRadius(trackH / 2f)
                        )
                        // Remplissage violet jusqu'au thumb.
                        val fillW = (cx - left).coerceAtLeast(0f)
                        if (fillW > 0f) drawRoundRect(
                            if (enabled) WaveMixerTheme.faderViolet else Color(0xFF5B5D65),
                            topLeft = Offset(left, cy - trackH / 2f),
                            size = Size(fillW, trackH),
                            cornerRadius = CornerRadius(trackH / 2f)
                        )
                        // Thumb rect de fader : pilule perle + stries, ombre douce.
                        val scale = if (dragging) 1.06f else 1f
                        val tw = thumbPx * scale
                        val th = 20.dp.toPx() * scale
                        drawRoundRect(
                            Color.Black.copy(alpha = 0.30f),
                            topLeft = Offset(cx - tw / 2f, cy - th / 2f + 1f * density),
                            size = Size(tw, th),
                            cornerRadius = CornerRadius(tw / 2f)
                        )
                        drawRoundRect(
                            Brush.verticalGradient(
                                0f to if (enabled) Color(0xFFD6D8DE) else Color(0xFF80838B),
                                1f to if (enabled) Color(0xFFAFB3BC) else Color(0xFF62656D),
                            ),
                            topLeft = Offset(cx - tw / 2f, cy - th / 2f),
                            size = Size(tw, th),
                            cornerRadius = CornerRadius(tw / 2f)
                        )
                        // Stries de grip horizontales (même usinage que les faders).
                        val gripW = tw * 0.5f
                        val gripH = 0.9f * density
                        val gripGap = 3.2f * density
                        for (i in -1..1) {
                            val gy = cy + i * gripGap
                            drawRoundRect(
                                Color(0xFF5A5E66).copy(alpha = 0.55f),
                                topLeft = Offset(cx - gripW / 2f, gy - gripH / 2f),
                                size = Size(gripW, gripH),
                                cornerRadius = CornerRadius(gripH / 2f)
                            )
                        }
                    }
            )
        }
    }
}
