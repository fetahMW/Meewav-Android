package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.unit.dp

/** Graphite capsule matching messaging-source/mobile.css .mw-composer. */
internal fun Modifier.chatComposerGlass(
    key: Boolean = false,
    focused: Boolean = false,
): Modifier {
    val shape = RoundedCornerShape(if (key) 16.dp else 100.dp)
    return shadow(if (key) 0.dp else 6.dp, shape, clip = false).clip(shape).drawWithCache {
        val radius = if (key) 16.dp.toPx() else size.height / 2f
        val face = if (key) {
            Brush.verticalGradient(
                0f to WaveMixerTheme.capsuleAccent.copy(alpha = if (focused) .88f else .70f),
                .55f to Color(0xFF50318A),
                1f to Color(0xFF342055),
            )
        } else {
            SolidColor(Color(0xAA17191F))
        }
        val reflection = if (key) Brush.radialGradient(
            listOf(Color.White.copy(alpha = if (key) .10f else .025f), Color.Transparent),
            center = Offset(size.width * .25f, -size.height), radius = size.width.coerceAtLeast(size.height),
        ) else {
            // CSS linear-gradient(125deg): keep its direction on a wide capsule.
            val direction = Offset(.819152f, .573576f)
            val extent = size.width * direction.x + size.height * direction.y
            val center = Offset(size.width / 2f, size.height / 2f)
            Brush.linearGradient(0f to Color(0x15FFFFFF), .48f to Color(0x05FFFFFF),
                1f to Color(0x0BFFFFFF), start = center - direction * (extent / 2f),
                end = center + direction * (extent / 2f))
        }
        onDrawBehind {
            drawRoundRect(face, cornerRadius = CornerRadius(radius))
            drawRoundRect(reflection, cornerRadius = CornerRadius(radius))
        }
    }.border(
        if (key) .7.dp else 1.dp,
        if (!key) Brush.verticalGradient(0f to (if (focused) Color(0x88C5C1DD) else Color(0x4DEDF0F3)),
            .25f to (if (focused) Color(0x758E89B5) else Color(0x35C5CBD3)),
            1f to (if (focused) Color(0x758E89B5) else Color(0x35C5CBD3)))
        else Brush.verticalGradient(listOf(
            (if (key) WaveMixerTheme.capsuleAccentSoft else Color.White).copy(alpha = if (key) .24f else .15f),
            Color.White.copy(alpha = .07f),
            Color.White.copy(alpha = .12f),
        )),
        shape,
    )
}
