package com.meewav.android.features.rooms.wave

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Native adaptation of place-chat-composer-glass.css. Static reflections, no blur of text. */
internal fun Modifier.chatComposerGlass(
    inner: Boolean = false,
    key: Boolean = false,
    focused: Boolean = false,
): Modifier = clip(RoundedCornerShape(if (key) 16.dp else 100.dp)).drawWithCache {
    val lit = key && focused
    val radius = if (key) 16.dp.toPx() else size.height / 2f
    val edge = Brush.linearGradient(
        colors = when {
            lit -> listOf(Color(0xFFD9D3FF), Color(0xFF9690EB), Color(0xFF5B50D9), Color(0xFFC2B2FF))
            inner -> listOf(Color(0xFF7F90AA), Color(0xFF323A4B), Color(0xFF181D27), Color(0xFF44415D))
            key -> listOf(Color(0xFF8A99B5), Color(0xFF394356), Color(0xFF1B1F2C), Color(0xFF46435F))
            else -> listOf(Color(0xFF77758E), Color(0xFF202330), Color(0xFF171B26), Color(0xFF62697E))
        },
        start = Offset.Zero, end = Offset(size.width * .6f, size.height),
    )
    val face = when {
        lit -> Brush.linearGradient(listOf(Color(0xFF554BFF), Color(0xFF3020C4), Color(0xFF1D107E), Color(0xFF4330CC)), end = Offset(size.width, size.height))
        inner -> Brush.verticalGradient(0f to Color(0xFF121620), .48f to Color(0xFF040507), 1f to Color(0xFF090B11))
        key -> Brush.linearGradient(listOf(Color(0xFF1D2330), Color(0xFF080A10), Color(0xFF030407), Color(0xFF101018)), end = Offset(size.width, size.height))
        else -> Brush.verticalGradient(0f to Color(0xFF10121A), .46f to Color(0xFF020305), 1f to Color(0xFF06080D))
    }
    val reflection = Brush.radialGradient(
        listOf(if (lit) Color(0xB0E9E5FF) else if (inner) Color(0x7AADC3E4) else Color(0x239BAEC9), Color.Transparent),
        center = Offset(size.width * .15f, -size.height * .7f),
        radius = size.width * .7f,
    )
    val violet = Brush.radialGradient(
        listOf(if (lit) Color(0xFFB39AFF) else Color(0xFF5945DE).copy(alpha = if (focused) .44f else .13f), Color.Transparent),
        center = Offset(size.width, size.height * 1.1f), radius = size.width * (if (key) .65f else .25f),
    )
    val inset = .8.dp.toPx()
    onDrawBehind {
        drawRoundRect(edge, cornerRadius = CornerRadius(radius))
        val innerSize = Size((size.width - inset * 2).coerceAtLeast(0f), (size.height - inset * 2).coerceAtLeast(0f))
        val corner = CornerRadius((radius - inset).coerceAtLeast(0f))
        drawRoundRect(face, Offset(inset, inset), innerSize, corner)
        drawRoundRect(reflection, Offset(inset, inset), innerSize, corner)
        if (!inner) drawRoundRect(violet, Offset(inset, inset), innerSize, corner)
    }
}
