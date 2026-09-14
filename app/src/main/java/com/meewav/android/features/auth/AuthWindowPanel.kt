package com.meewav.android.features.auth

import android.graphics.Bitmap
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import kotlin.math.ceil
import kotlin.math.roundToInt

/** Base Web AuthPanelChrome : sommet abaissé et courbe inférieure moins profonde. */
@Composable
internal fun AuthWindowPanel(modifier: Modifier = Modifier, panelHeight: Dp = 640.dp,
                             compact: Boolean = false, scrollKey: Any? = null,
                             footer: (@Composable () -> Unit)? = null,
                             allowScroll: Boolean = true,
                             iosStageWindow: Boolean = false,
                             illumination: (() -> Float)? = null,
                             contentViewportHeight: Dp? = null,
                             content: @Composable ColumnScope.() -> Unit) {
    val scroll = rememberScrollState()
    LaunchedEffect(scrollKey) { scroll.scrollTo(0) }
    // Le cadre reste fixe ; seuls les formulaires longs défilent dans sa zone intérieure.
    Box(modifier.height(panelHeight)
            .drawWithCache {
                val margin = ceil(32f * size.width / 413f).toInt()
                // Les flous sont peints une fois à la taille d'affichage, pas à chaque image.
                val chrome = (if (iosStageWindow) renderIosStageWindow(size.width, size.height, margin)
                    else renderWebPanel(size.width, size.height, margin)).asImageBitmap()
                val glow = if (iosStageWindow && illumination != null)
                    renderIosStageWindow(size.width, size.height, margin, illuminationOnly = true).asImageBitmap() else null
                onDrawBehind {
                    val origin = Offset(-margin.toFloat(), -margin.toFloat())
                    drawImage(chrome, origin)
                    glow?.let { drawImage(it, origin, alpha = illumination?.invoke()?.coerceIn(0f, 1f) ?: 0f) }
                }
            }
            .padding(start = 28.dp, end = 28.dp,
                top = if (compact) 30.dp else 38.dp,
                bottom = if (iosStageWindow) 32.dp else if (compact) 40.dp else 52.dp)) {
        // Le clavier réduit la zone utile du formulaire, jamais la vitre dessinée.
        val contentModifier = if (contentViewportHeight == null) Modifier.fillMaxSize() else
            Modifier.fillMaxWidth().height((contentViewportHeight -
                (if (compact) 30.dp else 38.dp) -
                (if (iosStageWindow) 32.dp else if (compact) 40.dp else 52.dp)).coerceAtLeast(0.dp))
        Column(contentModifier) {
            Column(Modifier.weight(1f).then(if (allowScroll) Modifier.verticalScroll(scroll) else Modifier), content = content)
            if (footer != null) {
                Spacer(Modifier.height(12.dp))
                footer()
            }
        }
    }
}

private fun renderWebPanel(width: Float, height: Float, margin: Int): Bitmap {
    val bitmap = Bitmap.createBitmap(
        ceil(width).toInt().coerceAtLeast(1) + margin * 2,
        ceil(height).toInt().coerceAtLeast(1) + margin * 2,
        Bitmap.Config.ARGB_8888,
    )
    val canvas = Canvas(bitmap)
    canvas.translate(margin.toFloat(), margin.toFloat())
    canvas.scale(width / 413f, height / 600f)

    // Flancs du SVG Web ; relief supérieur réduit de moitié et arc bas de profondeur 18.
    val shape = Path().apply {
        moveTo(4f, 56.7774f)
        cubicTo(4f, 42.6659f, 16.1072f, 31.5421f, 30.2028f, 32.2135f)
        cubicTo(51.7791f, 33.2412f, 82.423f, 33.7889f, 105.25f, 30.5f)
        cubicTo(146.124f, 27.6f, 165.204f, 16f, 206.5f, 16f)
        cubicTo(247.796f, 16f, 266.876f, 27.6f, 307.75f, 30.5f)
        cubicTo(330.577f, 33.7889f, 361.221f, 33.2412f, 382.797f, 32.2135f)
        cubicTo(396.893f, 31.5421f, 409f, 42.6659f, 409f, 56.7774f)
        cubicTo(415.5f, 183f, 415.5f, 435f, 409f, 562f)
        cubicTo(409f, 572.08f, 322f, 580f, 206.5f, 580f)
        cubicTo(91f, 580f, 4f, 572.08f, 4f, 562f)
        cubicTo(-2.5f, 435f, -2.5f, 183f, 4f, 56.7774f)
        close()
    }
    val bottomArc = Path().apply {
        moveTo(409f, 562f)
        cubicTo(409f, 572.08f, 322f, 580f, 206.5f, 580f)
        cubicTo(91f, 580f, 4f, 572.08f, 4f, 562f)
    }
    val fill = RadialGradient(0f, 0f, 1f,
        colors("#16082C", "#0B0319", "#020105", "#020105", "#0C0317", "#17072F"),
        floatArrayOf(0f, .18f, .42f, .78f, .92f, 1f), Shader.TileMode.CLAMP).apply {
        setLocalMatrix(Matrix().apply { setScale(360f, 470f); postTranslate(206.5f, 120f) })
    }
    canvas.drawPath(shape, Paint(Paint.ANTI_ALIAS_FLAG).apply {
        shader = fill
        alpha = (255 * .94f).roundToInt()
    })

    fun stroke(path: Path = shape, shader: Shader? = null, color: Int = Color.WHITE,
               width: Float, opacity: Float, blur: Float = 0f) {
        canvas.drawPath(path, Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = width
            strokeCap = Paint.Cap.ROUND
            this.color = color
            this.shader = shader
            alpha = (255 * opacity).roundToInt()
            if (blur > 0f) maskFilter = BlurMaskFilter(blur, BlurMaskFilter.Blur.NORMAL)
        })
    }

    stroke(color = Color.parseColor("#4C1D95"), width = 18f, opacity = .10f, blur = 12f)
    stroke(shader = linear(30f, 0f, 383f, 580f,
        colors("#808B5CF6", "#5C9464F5", "#6B7C4FE0", "#619D78F0", "#618B5CF6", "#3DA78BF0"),
        0f, .16f, .38f, .64f, .84f, 1f), width = 4.1f, opacity = .30f, blur = 7.2f)
    stroke(shader = linear(24f, 8f, 386f, 576f,
        colors("#A78BF0", "#9464F5", "#8B5CF6", "#7544DF", "#9464F5", "#8B5CF6", "#A78BF0"),
        0f, .13f, .30f, .52f, .74f, .88f, 1f), width = 1.15f, opacity = .80f, blur = 1.7f)
    stroke(shader = linear(28f, 2f, 384f, 578f,
        colors("#B6A0F5", "#A78BF0", "#9D78F0", "#B6A0F5", "#A78BF0", "#9D78F0", "#B6A0F5"),
        0f, .14f, .32f, .52f, .72f, .88f, 1f), width = .46f, opacity = .76f)
    stroke(path = bottomArc, shader = linear(4f, 580f, 409f, 580f,
        colors("#008B5CF6", "#298B5CF6", "#579464F5", "#859D78F0", "#579464F5", "#298B5CF6", "#008B5CF6"),
        0f, .16f, .35f, .50f, .65f, .84f, 1f), width = 4.5f, opacity = .40f, blur = 7.2f)
    stroke(path = bottomArc, shader = linear(4f, 580f, 409f, 580f,
        colors("#008B5CF6", "#739D78F0", "#BAB6A0F5", "#BAB6A0F5", "#739D78F0", "#008B5CF6"),
        0f, .20f, .42f, .58f, .80f, 1f), width = .85f, opacity = .72f)
    return bitmap
}

private fun colors(vararg values: String) = values.map(Color::parseColor).toIntArray()

private fun linear(x1: Float, y1: Float, x2: Float, y2: Float, colors: IntArray, vararg stops: Float) =
    LinearGradient(x1, y1, x2, y2, colors, stops, Shader.TileMode.CLAMP)
