package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.border
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Near-black translucent input capsule with a restrained grey reflection. */
internal fun Modifier.chatComposerGlass(
    key: Boolean = false,
    focused: Boolean = false,
): Modifier {
    val shape = RoundedCornerShape(if (key) 16.dp else 100.dp)
    return clip(shape).drawWithCache {
        val radius = if (key) 16.dp.toPx() else size.height / 2f
        val face = if (key) {
            Brush.verticalGradient(
                0f to WaveMixerTheme.capsuleAccent.copy(alpha = if (focused) .88f else .70f),
                .55f to Color(0xFF50318A),
                1f to Color(0xFF342055),
            )
        } else {
            Brush.verticalGradient(
                0f to Color(0xFF202125).copy(alpha = .88f),
                .5f to Color(0xFF131417).copy(alpha = .86f),
                1f to Color(0xFF0C0D10).copy(alpha = .90f),
            )
        }
        val reflection = Brush.radialGradient(
            listOf(Color.White.copy(alpha = if (key) .10f else .025f), Color.Transparent),
            center = Offset(size.width * .25f, -size.height), radius = size.width.coerceAtLeast(size.height),
        )
        onDrawBehind {
            drawRoundRect(face, cornerRadius = CornerRadius(radius))
            drawRoundRect(reflection, cornerRadius = CornerRadius(radius))
        }
    }.border(
        .7.dp,
        Brush.verticalGradient(listOf(
            (if (key) WaveMixerTheme.capsuleAccentSoft else Color.White).copy(alpha = if (key) .24f else .15f),
            Color.White.copy(alpha = .07f),
            Color.White.copy(alpha = .12f),
        )),
        shape,
    )
}
