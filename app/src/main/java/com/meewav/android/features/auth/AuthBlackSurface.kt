package com.meewav.android.features.auth

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/** Auth-only black glass: a recessed input or the existing polished scene key. */
internal fun Modifier.authBlackSurface(
    recessed: Boolean = false,
    focused: Boolean = false,
    enabled: Boolean = true,
): Modifier = alpha(if (enabled) 1f else .45f)
    .shadow(if (recessed) 0.dp else 2.dp, RoundedCornerShape(14.dp), clip = false)
    .drawWithCache {
        val radius = CornerRadius(14.dp.toPx())
        val face = Brush.verticalGradient(if (recessed)
            listOf(Color(0xFF161619), Color(0xFF0D0D10), Color(0xFF08080A))
        else listOf(Color(0xFF1B1B1F), Color(0xFF101013), Color(0xFF070709)))
        val reflection = Brush.linearGradient(
            0f to Color.White.copy(alpha = if (recessed) .045f else .09f),
            .28f to Color.White.copy(alpha = .015f), .55f to Color.Transparent,
            start = Offset.Zero, end = Offset(size.width, size.height),
        )
        val rim = Brush.linearGradient(listOf(
            Color.White.copy(alpha = if (focused) .22f else .17f),
            Color.White.copy(alpha = .055f),
            if (focused) Color(0xFFA98EF0).copy(alpha = .55f) else Color.White.copy(alpha = .09f),
        ), end = Offset(size.width, size.height))
        val focusLight = Brush.horizontalGradient(listOf(
            Color.Transparent, Color(0xFFA98EF0).copy(alpha = .8f), Color.Transparent,
        ))
        onDrawBehind {
            drawRoundRect(face, cornerRadius = radius)
            drawRoundRect(reflection, cornerRadius = radius)
            val inset = .5.dp.toPx()
            if (size.width > inset * 2 && size.height > inset * 2) {
                drawRoundRect(rim, topLeft = Offset(inset, inset),
                    size = Size(size.width - inset * 2, size.height - inset * 2),
                    cornerRadius = CornerRadius(radius.x - inset), style = Stroke(1.dp.toPx()))
                if (focused) drawLine(focusLight,
                    start = Offset(radius.x, size.height - inset),
                    end = Offset(size.width - radius.x, size.height - inset), strokeWidth = 1.dp.toPx())
            }
        }
    }
