package com.meewav.android.features.rooms.wave

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

/** Outline paper plane, matching the messaging send control. */
internal val ChatSendIcon: ImageVector = ImageVector.Builder(
    name = "ChatSend", defaultWidth = 24.dp, defaultHeight = 24.dp,
    viewportWidth = 24f, viewportHeight = 24f, autoMirror = true,
).apply {
    path(stroke = SolidColor(Color.Black), strokeLineWidth = 1.75f,
        strokeLineCap = StrokeCap.Round, strokeLineJoin = StrokeJoin.Round) {
        moveTo(22f, 2f)
        lineTo(15f, 22f)
        lineTo(11f, 13f)
        lineTo(2f, 9f)
        close()
        moveTo(22f, 2f)
        lineTo(11f, 13f)
    }
}.build()
