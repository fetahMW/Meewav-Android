package com.meewav.android.features.rooms.wave

import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.*
import androidx.compose.ui.unit.dp

/** Native rendering of web live-action-bar.css + --live-glass-rim (not the mixer material). */
internal fun Modifier.liveVideoShell() = drawWithCache {
    val radius = CornerRadius(size.height * .46f)
    val rim = Brush.linearGradient(0f to Color(0xCFEDF0FF), .18f to Color(0x66777B88),
        .35f to Color(0xFF181A22), .55f to Color(0x66B5B7C5), .83f to Color(0xCC9691A8),
        .94f to Color(0xB3D2C4FF), 1f to Color(0xFF3A394A), end = Offset(size.width, size.height))
    val body = Brush.verticalGradient(0f to Color(0xFF0A0B0E), .24f to Color(0xFF050608),
        .63f to Color(0xFF020304), 1f to Color(0xFF07080C))
    val inset = .8.dp.toPx()
    val path = Path().apply { addRoundRect(RoundRect(Rect(Offset.Zero, size), radius)) }
    onDrawBehind {
        drawRoundRect(rim, cornerRadius = radius)
        drawRoundRect(body, topLeft = Offset(inset, inset), size = Size(size.width - inset * 2, size.height - inset * 2),
            cornerRadius = CornerRadius(radius.x - inset))
        clipPath(path) {
            ellipseLight(.02f, .94f, .18f, .35f, Color(0x209680D6))
            ellipseLight(.98f, .94f, .16f, .30f, Color(0x209680D6))
            ellipseLight(.50f, 0f, .5f, .48f, Color(0x0BF1EDFF))
            ellipseLight(.31f, .025f, .26f, .05f, Color(0x42F6F0FF))
            ellipseLight(.90f, .975f, .27f, .04f, Color(0x4DBAA1F7))
            ellipseLight(.25f, 0f, .16f, .025f, Color(0x6BFCFAFF))
            ellipseLight(.80f, 1f, .10f, .025f, Color(0x45FFF1B3))
        }
    }
}

internal fun Modifier.liveVideoKey(selected: Boolean) = drawWithCache {
    val r = size.minDimension / 2
    val center = Offset(size.width / 2, size.height / 2)
    val rim = Brush.sweepGradient(listOf(Color(0xFF171C23), Color(0xBA66707B), Color(0xFF161921),
        Color(0xC29B83DF), Color(0xFF32333F), Color(0xFFF5F7FF), Color(0xFF272C34), Color(0xFF171C23)), center)
    val body = Brush.linearGradient(0f to Color(0xFF232529), .35f to Color(0xFF0C0E12),
        .72f to Color(0xFF040609), 1f to Color(0xFF111219), end = Offset(size.width * .7f, size.height))
    val lens = Brush.linearGradient(0f to Color(0xFF202227), .44f to Color(0xFF080A0E),
        .72f to Color(0xFF050609), 1f to Color(0xFF12141B), end = Offset(size.width * .7f, size.height))
    val edge = .85.dp.toPx()
    val lensRadius = r - size.width * .057f
    val path = Path().apply { addOval(Rect(center = center, radius = lensRadius)) }
    onDrawBehind {
        // Dark socket, reflective machined rim, recessed optical glass.
        drawCircle(Color(0xFF010203), r + 1.5.dp.toPx())
        drawCircle(Color(0x21696677), r + 2.dp.toPx(), style = Stroke(.6.dp.toPx()))
        rotate(30f, center) { drawCircle(rim, r) }
        drawCircle(body, r - edge)
        drawCircle(Color(0xFF010204), lensRadius + .7.dp.toPx())
        drawCircle(lens, lensRadius)
        clipPath(path) {
            ellipseLight(.28f, -.06f, .38f, .67f, Color(0x3AFFFFFF))
            ellipseLight(.58f, 1f, .68f, .15f, Color(0x22B5A4FA))
            ellipseLight(.30f, .06f, .30f, .08f, Color(0x70EDF2FF))
        }
        if (selected) drawCircle(Color(0xFFB69AD9), r, style = Stroke(.8.dp.toPx()))
    }
}

private fun DrawScope.ellipseLight(x: Float, y: Float, rx: Float, ry: Float, color: Color) {
    val center = Offset(size.width * x, size.height * y)
    val radius = size.width * rx
    withTransform({ scale(1f, size.height * ry / radius, center) }) {
        drawCircle(Brush.radialGradient(listOf(color, Color.Transparent), center, radius), radius, center)
    }
}
