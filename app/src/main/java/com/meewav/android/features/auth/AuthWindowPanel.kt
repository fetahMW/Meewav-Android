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
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
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
                             contentBottomPadding: Dp? = null,
                             bottomAlignContent: Boolean = false,
                             content: @Composable ColumnScope.() -> Unit) {
    val scroll = rememberScrollState()
    LaunchedEffect(scrollKey) { scroll.scrollTo(0) }
    val bottomPadding = contentBottomPadding
        ?: if (iosStageWindow) 32.dp else if (compact) 40.dp else 52.dp
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
                bottom = bottomPadding)) {
        // Le clavier réduit la zone utile du formulaire, jamais la vitre dessinée.
        val contentModifier = if (contentViewportHeight == null) Modifier.fillMaxSize() else
            Modifier.fillMaxWidth().height((contentViewportHeight -
                (if (compact) 30.dp else 38.dp) -
                bottomPadding).coerceAtLeast(0.dp))
        Column(contentModifier) {
            Column(Modifier.weight(1f)
                .then(if (bottomAlignContent) Modifier.wrapContentHeight(Alignment.Bottom) else Modifier)
                .then(if (allowScroll) Modifier.verticalScroll(scroll) else Modifier), content = content)
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

    // A dark bevel and a crisp silver-violet edge, with only a local reflected light.
    stroke(color = Color.BLACK, width = 2.6f, opacity = .46f, blur = 1.2f)
    stroke(color = Color.parseColor("#A98EF0"), width = 2.2f, opacity = .10f, blur = 3f)
    stroke(shader = linear(24f, 8f, 386f, 576f,
        colors("#D3C7F5", "#A98EF0", "#514A62", "#292431", "#807394", "#A98EF0"),
        0f, .16f, .38f, .64f, .84f, 1f), width = 1f, opacity = .72f)
    stroke(shader = linear(28f, 2f, 384f, 578f,
        colors("#B3F4F0FF", "#1AD3C7F5", "#00A98EF0", "#1FA98EF0", "#73DED3FC"),
        0f, .18f, .42f, .78f, 1f), width = .4f, opacity = .60f)
    stroke(path = bottomArc, shader = linear(4f, 580f, 409f, 580f,
        colors("#00A98EF0", "#29A98EF0", "#57A98EF0", "#85A98EF0", "#57A98EF0", "#29A98EF0", "#00A98EF0"),
        0f, .16f, .35f, .50f, .65f, .84f, 1f), width = 2f, opacity = .18f, blur = 3f)
    stroke(path = bottomArc, shader = linear(4f, 580f, 409f, 580f,
        colors("#00A98EF0", "#73A98EF0", "#BAD3C7F5", "#BAD3C7F5", "#73A98EF0", "#00A98EF0"),
        0f, .20f, .42f, .58f, .80f, 1f), width = .65f, opacity = .45f)
    return bitmap
}

private fun colors(vararg values: String) = values.map(Color::parseColor).toIntArray()

private fun linear(x1: Float, y1: Float, x2: Float, y2: Float, colors: IntArray, vararg stops: Float) =
    LinearGradient(x1, y1, x2, y2, colors, stops, Shader.TileMode.CLAMP)
