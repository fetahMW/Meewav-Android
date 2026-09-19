package com.meewav.android.features.rooms.wave

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

internal val WaveDuelIcon: ImageVector = ImageVector.Builder(
    name = "Épées croisées", defaultWidth = 24.dp, defaultHeight = 24.dp,
    viewportWidth = 24f, viewportHeight = 24f
).apply {
    path(fill = null, stroke = SolidColor(Color.White), strokeLineWidth = 1.7f,
        strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round) {
        moveTo(4f, 3f); lineTo(8f, 4f); lineTo(18f, 15f); lineTo(15f, 18f)
        lineTo(4f, 8f); close()
        moveTo(14f, 19f); lineTo(19f, 14f)
        moveTo(17f, 17f); lineTo(21f, 21f)
        moveTo(20f, 3f); lineTo(16f, 4f); lineTo(13.5f, 7f)
        moveTo(20f, 3f); lineTo(20f, 8f); lineTo(17f, 10.5f)
        moveTo(10.5f, 13.5f); lineTo(6f, 18f); lineTo(3f, 21f)
        moveTo(5f, 14f); lineTo(10f, 19f)
    }
}.build()
