package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.*
import androidx.compose.ui.unit.dp

/** Same pearl cap, engraved grip and violet rail as WaveFader; independent output. */
@Composable
internal fun WaveOutputFader(value: Float, onChange: (Float) -> Unit, modifier: Modifier = Modifier) {
    val change by rememberUpdatedState(onChange)
    Canvas(modifier.semantics {
        contentDescription = "Volume Wave"; progressBarRangeInfo = ProgressBarRangeInfo(value, 0f..1f)
        setProgress { change(it.coerceIn(0f, 1f)); true }
    }.pointerInput(Unit) {
        detectHorizontalDragGestures { event, _ -> event.consume(); change(((event.position.x - 15.dp.toPx()) / (size.width - 30.dp.toPx()).coerceAtLeast(1f)).coerceIn(0f, 1f)) }
    }.pointerInput(Unit) {
        detectTapGestures { change(((it.x - 15.dp.toPx()) / (size.width - 30.dp.toPx()).coerceAtLeast(1f)).coerceIn(0f, 1f)) }
    }) {
        val inset = 15.dp.toPx(); val y = size.height / 2; val x = inset + (size.width - 2 * inset).coerceAtLeast(0f) * value
        drawLine(Color.White.copy(alpha = .11f), Offset(inset, y), Offset(size.width - inset, y), 2.dp.toPx(), StrokeCap.Round)
        drawLine(WaveMixerTheme.faderViolet, Offset(inset, y), Offset(x, y), 7.dp.toPx(), StrokeCap.Round)
        val cap = Size(30.dp.toPx(), 16.dp.toPx())
        drawRoundRect(Brush.verticalGradient(listOf(Color(0xFFD6D8DE), Color(0xFFAFB3BC))), Offset(x - cap.width / 2, y - cap.height / 2), cap, CornerRadius(8.dp.toPx()))
        for (i in -1..1) drawLine(Color(0xFF5A5E66).copy(alpha = .55f), Offset(x + i * 4.dp.toPx(), y - 4.dp.toPx()), Offset(x + i * 4.dp.toPx(), y + 4.dp.toPx()), 1.dp.toPx())
    }
}
