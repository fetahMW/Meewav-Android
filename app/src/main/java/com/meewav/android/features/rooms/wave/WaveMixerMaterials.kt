package com.meewav.android.features.rooms.wave

import android.os.Build
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ImageShader
import androidx.compose.ui.graphics.Paint
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Shader
import androidx.compose.ui.graphics.ShaderBrush
import androidx.compose.ui.graphics.TileMode
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipPath
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.unit.Dp
import kotlin.math.max

private fun rgba(hex: Long, alpha: Float): Color = Color(hex).copy(alpha = alpha)
private fun white(a: Float): Color = Color.White.copy(alpha = a)

private class TileBrush(private val shader: Shader) : ShaderBrush() {
    override fun createShader(size: Size): Shader = shader
}

private fun noiseBrush(): Brush {
    val shader = ImageShader(WaveMixerNoise.tile, TileMode.Repeated, TileMode.Repeated)
    return TileBrush(shader)
}

private fun softlightOrSrcOver(): BlendMode =
    if (Build.VERSION.SDK_INT >= 29) BlendMode.Softlight else BlendMode.SrcOver

/** Ombre douce portée — BlurMaskFilter via le canvas natif. */
private fun DrawScope.softShadow(
    topLeft: Offset,
    size: Size,
    corner: Float,
    blur: Float,
    color: Color,
    dy: Float = 0f,
) {
    if (blur <= 0f || size.width <= 0f || size.height <= 0f) return
    val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color.toArgb()
        maskFilter = android.graphics.BlurMaskFilter(blur, android.graphics.BlurMaskFilter.Blur.NORMAL)
    }
    drawContext.canvas.nativeCanvas.drawRoundRect(
        topLeft.x, topLeft.y + dy, topLeft.x + size.width, topLeft.y + dy + size.height,
        corner, corner, paint)
}

private fun roundRectPath(size: Size, corner: Float): Path =
    Path().apply { addRoundRect(RoundRect(Rect(Offset.Zero, size), CornerRadius(corner))) }

/* ------------------------------------------------------------------------- */
/* A. Fond d'écran `ClasseWebMixerSurfaceBackground`                          */
/* ------------------------------------------------------------------------- */

fun Modifier.mixerSurfaceBackground(): Modifier = drawBehind {
    val w = size.width; val h = size.height
    // 1. Dégradé diagonal topStart → bottomEnd.
    drawRect(
        Brush.linearGradient(
            0f to WaveMixerTheme.bg0, 0.28f to WaveMixerTheme.bg1,
            0.68f to WaveMixerTheme.bg2, 1f to WaveMixerTheme.bg3,
            start = Offset(0f, 0f), end = Offset(w, h)
        )
    )
    // 2. Reflet rasant horizontal.
    drawRect(
        Brush.linearGradient(
            0f to white(0.032f), 0.018f to white(0.009f), 0.07f to Color.Transparent,
            0.93f to Color.Transparent, 0.985f to white(0.005f), 1f to white(0.016f),
            start = Offset(0f, 0f), end = Offset(w, 0f)
        )
    )
    // 3. Bruit tuilé ~1,6 %.
    drawRect(noiseBrush(), alpha = 0.016f, blendMode = softlightOrSrcOver())
    // 4. Liseré haut 1 px physique.
    drawRect(
        Brush.horizontalGradient(0f to white(0.065f), 0.5f to white(0.018f), 1f to Color.Transparent),
        topLeft = Offset(0f, 0f), size = Size(w, 1f)
    )
}

/* ------------------------------------------------------------------------- */
/* A-bis. Fond de la zone mixeur — variante « gris foncé » (demande utilisateur) */
/* ------------------------------------------------------------------------- */

fun Modifier.mixerBodyBackground(): Modifier = drawBehind {
    val w = size.width; val h = size.height
    // 1. Dégradé diagonal gris foncé (plus clair que le fond principal).
    drawRect(
        Brush.linearGradient(
            0f to WaveMixerTheme.bodyBg0, 0.28f to WaveMixerTheme.bodyBg1,
            0.68f to WaveMixerTheme.bodyBg2, 1f to WaveMixerTheme.bodyBg3,
            start = Offset(0f, 0f), end = Offset(w, h)
        )
    )
    // 2. Reflet rasant horizontal.
    drawRect(
        Brush.linearGradient(
            0f to white(0.05f), 0.018f to white(0.014f), 0.07f to Color.Transparent,
            0.93f to Color.Transparent, 0.985f to white(0.008f), 1f to white(0.02f),
            start = Offset(0f, 0f), end = Offset(w, 0f)
        )
    )
    // 3. Bruit tuilé ~1,6 %.
    drawRect(noiseBrush(), alpha = 0.016f, blendMode = softlightOrSrcOver())
}

/* ------------------------------------------------------------------------- */
/* Réflection elliptique `ClasseHardwareReflection`                           */
/* ------------------------------------------------------------------------- */

private fun hardwareReflectionBrush(intensity: Float, w: Float, h: Float): Brush =
    Brush.radialGradient(
        0f to white(intensity), 0.18f to white(intensity * 0.82f),
        0.38f to white(intensity * 0.46f), 0.58f to white(intensity * 0.19f),
        0.80f to white(intensity * 0.045f), 1f to Color.Transparent,
        center = Offset(w * 0.20f, -h * 0.18f), radius = max(w, h) * 0.85f
    )

/* ------------------------------------------------------------------------- */
/* B. Chrome « hardware » `ClasseHardwareSurface`                             */
/* ------------------------------------------------------------------------- */

fun Modifier.hardwareSurface(
    cornerRadius: Dp,
    raised: Boolean = false,
    reflection: Float = 0.10f,
    silhouette: Boolean = false,
    rimOpacity: Float = 1f,
    shadowOpacity: Float = 1f,
    tint: Color? = null,
    rimFadeHeight: Dp? = null,
): Modifier = drawBehind {
    val w = size.width; val h = size.height
    if (w <= 0f || h <= 0f) return@drawBehind
    val r = cornerRadius.toPx().coerceAtMost(minOf(w, h) / 2f)
    val px = 1f // ~1 px physique (density>=1 sur la cible).

    // Ombres : noir 0.40 r0.5 y0.5 + noir 0.30 r(raised?3:4) y2.
    softShadow(Offset.Zero, size, r, 1f, Color.Black.copy(alpha = 0.40f * shadowOpacity), dy = 0.5f * density)
    softShadow(Offset.Zero, size, r, (if (raised) 3f else 4f) * density, Color.Black.copy(alpha = 0.30f * shadowOpacity), dy = 2f * density)

    // Face : dégradé vertical.
    drawRoundRect(
        Brush.verticalGradient(
            0f to (if (raised) Color(0xFF111315) else Color(0xFF0B0D0F)),
            0.53f to (if (raised) Color(0xFF080A0C) else Color(0xFF060708)),
            1f to Color(0xFF040506)
        ),
        cornerRadius = CornerRadius(r)
    )
    if (tint != null) drawRoundRect(tint.copy(alpha = 0.14f), cornerRadius = CornerRadius(r))

    // Reflet elliptique clipé.
    drawRoundRect(hardwareReflectionBrush(reflection, w, h), cornerRadius = CornerRadius(r))

    clipPath(roundRectPath(size, r)) {
        // Specularité haute 16dp si silhouette.
        if (silhouette) {
            drawRect(
                Brush.verticalGradient(
                    0f to white(0.055f), 0.25f to white(0.023f), 0.65f to white(0.007f), 1f to Color.Transparent
                ),
                topLeft = Offset.Zero, size = Size(w, 16f * density)
            )
        }
        // Sheen vertical.
        drawRect(
            Brush.verticalGradient(
                0f to white(if (raised) 0.035f else 0.022f), 0.18f to white(0.008f), 0.38f to Color.Transparent
            )
        )
        // Bruit.
        drawRect(noiseBrush(), alpha = 0.009f, blendMode = softlightOrSrcOver())
    }

    // Rim : (a) liseré externe 1.5px diagonal.
    val rimBrush = if (silhouette) {
        Brush.linearGradient(
            0f to white(0.55f), 0.27f to white(0.25f), 0.66f to white(0.13f), 1f to white(0.23f),
            start = Offset(0f, 0f), end = Offset(w, h)
        )
    } else {
        Brush.linearGradient(
            0f to Color(0xFFFAFBFC).copy(alpha = 0.48f),
            0.27f to Color(0xFFAAAFB7).copy(alpha = 0.22f),
            0.66f to Color(0xFF373A3F).copy(alpha = 0.36f),
            1f to Color(0xFFB6BBC2).copy(alpha = 0.22f),
            start = Offset(0f, 0f), end = Offset(w, h)
        )
    }
    val rimModifier = if (rimFadeHeight != null) rimOpacity else rimOpacity
    drawRoundRect(rimBrush, cornerRadius = CornerRadius(r), style = Stroke(width = px * 1.5f), alpha = rimModifier)
    // (b) groove noir à inset 1.5px.
    val gInset = px * 1.5f
    drawRoundRect(
        Color.Black.copy(alpha = 0.70f),
        topLeft = Offset(gInset, gInset), size = Size(w - gInset * 2, h - gInset * 2),
        cornerRadius = CornerRadius((r - gInset).coerceAtLeast(0f)),
        style = Stroke(width = px)
    )
    // (c) biseau interne à inset 2.5px.
    val bInset = px * 2.5f
    drawRoundRect(
        Brush.verticalGradient(
            0f to white(if (raised) 0.18f else 0.12f), 0.32f to white(0.035f),
            0.60f to Color.Transparent, 1f to Color.Black.copy(alpha = 0.75f)
        ),
        topLeft = Offset(bInset, bInset), size = Size(w - bInset * 2, h - bInset * 2),
        cornerRadius = CornerRadius((r - bInset).coerceAtLeast(0f)),
        style = Stroke(width = px)
    )
    if (tint != null) {
        drawRoundRect(tint.copy(alpha = 0.60f), cornerRadius = CornerRadius(r), style = Stroke(width = px * 1.5f))
    }
}

/* ------------------------------------------------------------------------- */
/* C. Métal brossé — image PNG `wave_hardware_metal` teintée ×0.48.           */
/*    (Appliqué comme fond d'une Box : voir WaveMixerControls.metalCard)      */
/* ------------------------------------------------------------------------- */

/* ------------------------------------------------------------------------- */
/* D. Petit contrôle satiné `WaveWebSurface` (.control)                        */
/* ------------------------------------------------------------------------- */

fun Modifier.satinControl(
    cornerRadius: Dp,
    selected: Boolean = false,
    isPlay: Boolean = false,
): Modifier = drawBehind {
    val w = size.width; val h = size.height
    if (w <= 0f || h <= 0f) return@drawBehind
    val r = cornerRadius.toPx().coerceAtMost(minOf(w, h) / 2f)
    val px = 1f

    // Ombre : noir 0.52 r4 y3.
    softShadow(Offset.Zero, size, r, 4f * density, Color.Black.copy(alpha = 0.52f), dy = 3f * density)
    // Liseré externe noir à −0.6.
    drawRoundRect(
        Color.Black.copy(alpha = 0.92f),
        topLeft = Offset(-0.6f * density, -0.6f * density),
        size = Size(w + 1.2f * density, h + 1.2f * density),
        cornerRadius = CornerRadius(r + 0.6f * density),
        style = Stroke(width = 0.6f * density)
    )
    // Fill vertical.
    val fillBrush = if (isPlay) {
        Brush.verticalGradient(
            0f to Color(0xFF27292D), 0.17f to Color(0xFF191B1F), 0.65f to Color(0xFF101114),
            0.96f to Color(0xFF181A1E), 1f to Color(0xFF0B0C0E)
        )
    } else {
        Brush.verticalGradient(0f to Color(0xFF1A1C1F), 0.53f to Color(0xFF090A0B), 1f to Color(0xFF020202))
    }
    drawRoundRect(fillBrush, cornerRadius = CornerRadius(r))
    if (selected) drawRoundRect(WaveMixerTheme.violetSoft.copy(alpha = 0.12f), cornerRadius = CornerRadius(r))

    clipPath(roundRectPath(size, r)) {
        // Inner shadow haut : blanc 0.28 y1.
        drawRect(
            Brush.verticalGradient(0f to white(0.28f), 0.10f to Color.Transparent),
            topLeft = Offset.Zero, size = Size(w, h * 0.22f)
        )
        // Inner shadow bas : noir 0.96 y−2.
        drawRect(
            Brush.verticalGradient(0f to Color.Transparent, 1f to Color.Black.copy(alpha = 0.96f)),
            topLeft = Offset(0f, h * 0.72f), size = Size(w, h * 0.28f)
        )
        // Sheen diagonal.
        drawRect(
            Brush.linearGradient(
                0f to white(0.065f), 0.36f to white(0.014f), 0.51f to Color.Transparent,
                start = Offset(0f, 0f), end = Offset(w, h)
            )
        )
    }
    // Stroke 1dp diagonal.
    drawRoundRect(
        Brush.linearGradient(
            0f to Color(0xFFF8F9FB).copy(alpha = 0.44f),
            0.44f to Color(0xFF8B919A).copy(alpha = 0.18f),
            0.70f to Color(0xFF3E4147).copy(alpha = 0.07f),
            1f to Color(0xFFB7BBC2).copy(alpha = 0.22f),
            start = Offset(0f, 0f), end = Offset(w, h)
        ),
        cornerRadius = CornerRadius(r), style = Stroke(width = px)
    )
    if (selected) {
        drawRoundRect(
            WaveMixerTheme.violetSoft.copy(alpha = 0.40f),
            cornerRadius = CornerRadius(r), style = Stroke(width = 0.8f * density)
        )
    }
}

/* ------------------------------------------------------------------------- */
/* E. Capsule active violette `ClasseStudioActiveCapsule` — r13                */
/* ------------------------------------------------------------------------- */

fun Modifier.activeCapsule(cornerRadius: Dp): Modifier = drawBehind {
    val w = size.width; val h = size.height
    if (w <= 0f || h <= 0f) return@drawBehind
    val r = cornerRadius.toPx().coerceAtMost(minOf(w, h) / 2f)

    // Capsule épurée et moderne : remplissage violet propre + liseré fin.
    drawRoundRect(
        WaveMixerTheme.capsuleAccent.copy(alpha = 0.22f),
        cornerRadius = CornerRadius(r)
    )
    drawRoundRect(
        WaveMixerTheme.capsuleAccent.copy(alpha = 0.40f),
        cornerRadius = CornerRadius(r), style = Stroke(width = 0.6f * density)
    )
}

/* ------------------------------------------------------------------------- */
/* E-bis. Capsule Simple/Pro `RoomsStudioActiveCapsule`                        */
/* ------------------------------------------------------------------------- */

fun Modifier.roomsStudioCapsule(cornerRadius: Dp? = null): Modifier = drawBehind {
    val r = cornerRadius?.toPx() ?: (size.height / 2f)
    drawRoundRect(
        WaveMixerTheme.capsuleAccent.copy(alpha = 0.22f), cornerRadius = CornerRadius(r)
    )
    drawRoundRect(
        WaveMixerTheme.capsuleAccent.copy(alpha = 0.38f),
        cornerRadius = CornerRadius(r), style = Stroke(width = 1f * density)
    )
}
