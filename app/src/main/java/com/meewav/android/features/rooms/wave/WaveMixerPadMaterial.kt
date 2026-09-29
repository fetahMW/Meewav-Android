package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.dp

/** Windows place-pad-material.css: graphite keys, coloured glass when playing. */
internal fun Modifier.mixerPadSurface(accent: Color, active: Boolean, empty: Boolean = false): Modifier =
    shadow(if (active) 3.dp else 1.dp, RoundedCornerShape(12.dp), clip = false).drawWithCache {
        val light = lerp(accent, Color.White, .6f)
        val r = CornerRadius(12.dp.toPx())
        val face = Brush.verticalGradient(if (active) listOf(
            lerp(Color(0xFF252329), accent, .22f),
            lerp(Color(0xFF19151E), accent, .15f),
            lerp(Color(0xFF25202D), accent, .32f),
        ) else if (empty) listOf(Color(0xFF1C1B20), Color(0xFF100F13))
        else listOf(Color(0xFF29282E), Color(0xFF18171D), Color(0xFF111015)))
        val sheen = Brush.linearGradient(
            0f to Color.White.copy(alpha = if (active) .17f else .035f),
            .26f to Color.White.copy(alpha = if (active) .03f else .01f),
            .48f to Color.Transparent, end = Offset(size.width, size.height))
        val topLight = Brush.radialGradient(listOf(light.copy(alpha = .28f), Color.Transparent),
            center = Offset(size.width / 2, -size.height * .3f), radius = maxOf(size.width, size.height).coerceAtLeast(1f) * .9f)
        val rim = Brush.linearGradient(if (active) listOf(
            light.copy(alpha = .52f), accent.copy(alpha = .42f), Color(0xFF211F25).copy(alpha = .42f), light.copy(alpha = .55f),
        ) else listOf(accent.copy(alpha = if (empty) .09f else .17f),
            Color.White.copy(alpha = .025f), accent.copy(alpha = if (empty) .05f else .12f)), end = Offset(size.width, size.height))
        val foot = Brush.verticalGradient(0f to Color.Transparent, .82f to Color.Transparent, 1f to light.copy(alpha = .24f))
        onDrawBehind {
            if (size.width <= 1.dp.toPx() || size.height <= 1.dp.toPx()) return@onDrawBehind
            drawRoundRect(face, cornerRadius = r)
            if (active) drawRoundRect(topLight, cornerRadius = r)
            drawRoundRect(sheen, cornerRadius = r)
            if (active) drawRoundRect(foot, cornerRadius = r)
            val inset = .5.dp.toPx()
            drawRoundRect(rim, topLeft = Offset(inset, inset), size = Size(size.width - 2 * inset, size.height - 2 * inset),
                cornerRadius = CornerRadius(r.x - inset), style = Stroke(1.dp.toPx()))
        }
    }
