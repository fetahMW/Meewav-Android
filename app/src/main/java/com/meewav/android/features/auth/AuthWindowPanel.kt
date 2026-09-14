package com.meewav.android.features.auth

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/** Shape and palette from iOS LoginWindowChromeView / AuthLoginWindowShape. */
@Composable
internal fun AuthWindowPanel(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) {
    Column(modifier.drawWithCache {
        val sx = size.width / 337f
        val sy = size.height / 489f
        val path = Path().apply {
            fun curve(x1: Float, y1: Float, x2: Float, y2: Float, x: Float, y: Float) =
                cubicTo(x1 * sx, y1 * sy, x2 * sx, y2 * sy, x * sx, y * sy)
            moveTo(sx, 48 * sy)
            curve(1f,29f,14f,17f,34f,15f)
            curve(48f,14f,55f,7f,69f,5f)
            curve(84f,3f,92f,14f,105f,17f)
            curve(123f,22f,135f,10f,149f,7f)
            curve(158f,5f,164f,11f,168.5f,11f)
            curve(173f,11f,179f,5f,188f,7f)
            curve(202f,10f,214f,22f,232f,17f)
            curve(245f,14f,253f,3f,268f,5f)
            curve(282f,7f,289f,14f,303f,15f)
            curve(323f,17f,336f,29f,336f,48f)
            lineTo(336*sx,395*sy)
            curve(336f,431f,314f,451f,280f,451f)
            curve(260f,451f,241f,453f,220f,453f)
            curve(196f,453f,184f,461f,168.5f,461f)
            curve(153f,461f,141f,453f,117f,453f)
            curve(96f,453f,77f,451f,57f,451f)
            curve(24f,451f,1f,431f,1f,395f)
            close()
        }
        val fill = Brush.linearGradient(
            0f to Color(0xFF211F29), .24f to Color(0xFF16161D), .53f to Color(0xFF0B0B10),
            .76f to Color(0xFF0A0910), 1f to Color(0xFF0A0910),
            start = Offset(30*sx,40*sy), end = Offset(310*sx,475*sy))
        val topLight = Brush.radialGradient(listOf(Color(0x6B9B57FF), Color.Transparent), Offset(168.5f*sx,4.75f*sy), 251.25f*sx)
        val bottomLight = Brush.radialGradient(listOf(Color(0x61A65CFF), Color.Transparent), Offset(222.1f*sx,465.67f*sy), 184.25f*sx)
        val edge = Brush.linearGradient(listOf(Color(0xFFEFE5FF), Color(0xFFB068FF), Color(0xFF8850FF), Color(0xFFD470FF)))
        onDrawBehind {
            drawPath(path, Color(0x0F9B63FF), style = Stroke(10.dp.toPx()))
            drawPath(path, Color(0x189B63FF), style = Stroke(5.dp.toPx()))
            drawPath(path, fill)
            drawPath(path, topLight)
            drawPath(path, bottomLight)
            drawPath(path, edge, style = Stroke(1.1f*sx))
        }
    }.padding(start = 25.dp, end = 25.dp, top = 32.dp, bottom = 52.dp), content = content)
}

@Composable
internal fun LoginStage() {
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Canvas(Modifier.width(185.dp).height(62.dp)) {
            val ellipse = Size(size.width * .82f, size.height * .40f)
            val origin = Offset(size.width * .09f, size.height * .30f)
            drawOval(Brush.radialGradient(listOf(Color(0x665F3B9A), Color.Transparent)),
                topLeft = Offset(0f, size.height * .18f), size = Size(size.width, size.height * .67f))
            drawOval(Brush.verticalGradient(listOf(Color(0xFF322739), Color(0xFF09070D))), origin, ellipse)
            drawOval(Color(0xFF7850B1), origin, ellipse, style = Stroke(1.dp.toPx()))
            drawOval(Color(0x66C9A5F5), origin + Offset(4.dp.toPx(), 3.dp.toPx()),
                Size(ellipse.width - 8.dp.toPx(), ellipse.height - 6.dp.toPx()), style = Stroke(.6.dp.toPx()))
        }
    }
}
