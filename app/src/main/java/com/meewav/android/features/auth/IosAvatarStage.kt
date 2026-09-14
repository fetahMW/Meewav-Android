package com.meewav.android.features.auth

import android.graphics.Bitmap
import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.PageSize
import androidx.compose.foundation.pager.PagerState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawWithCache
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.exp
import kotlin.math.pow
import kotlin.math.sign

/** Port natif de SaturnCarouselLayout et StagePlatformRenderer (iOS main aea7251).
 * Les 28 PNG HD Android restent utilisés ; aucun moteur Web ni minuterie de rendu continue.
 */
@Composable
internal fun IosAvatarStage(pager: PagerState, modifier: Modifier = Modifier, enabled: Boolean = true) {
    var lightTarget by remember { mutableFloatStateOf(.14f) }
    LaunchedEffect(pager.isScrollInProgress) {
        if (pager.isScrollInProgress) lightTarget = .14f
        else {
            lightTarget = 1.08f
            delay(160)
            lightTarget = 1f
        }
    }
    val light = animateFloatAsState(lightTarget, tween(220), label = "Projecteurs du plateau")
    BoxWithConstraints(modifier.clipToBounds()) {
        val railScale = (maxWidth / 375.dp).coerceAtMost(1.15f)
        val firstGap = 108.5.dp * railScale
        val avatarSize = minOf(144.dp * railScale, maxHeight - 32.dp)
        Box(Modifier.fillMaxSize().drawWithCache {
            // Trois textures natives mises en cache à la résolution réelle de l'écran.
            // Seule leur intensité est animée : pas de reconstruction des flous à chaque frame.
            val beams = renderStageLayer(size.width, size.height, 0).asImageBitmap()
            val platform = renderStageLayer(size.width, size.height, 1).asImageBitmap()
            val rim = renderStageLayer(size.width, size.height, 2).asImageBitmap()
            onDrawBehind {
                drawImage(beams, alpha = light.value.coerceIn(0f, 1f))
                drawImage(platform)
                drawImage(rim, alpha = (.24f + .76f * light.value).coerceIn(0f, 1f))
            }
        })
        HorizontalPager(pager, pageSize = PageSize.Fixed(firstGap),
            beyondViewportPageCount = 2, overscrollEffect = null, userScrollEnabled = enabled,
            contentPadding = PaddingValues(horizontal = (maxWidth - firstGap) / 2),
            modifier = Modifier.fillMaxSize()) { page ->
            val avatar = AvatarCatalog.profiles[page % AvatarCatalog.profiles.size]
            val stageHeight = maxHeight
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Image(painterResource(avatar.image), avatar.name,
                    Modifier.requiredSize(avatarSize).graphicsLayer {
                        val offset = (page - pager.currentPage).toFloat() - pager.currentPageOffsetFraction
                        val distance = abs(offset)
                        val factor = when {
                            distance <= 1 -> 1f - .54f * distance
                            distance <= 2 -> .46f - .14f * (distance - 1)
                            else -> .32f - .10f * (distance - 2).coerceAtMost(1f)
                        }
                        scaleX = factor
                        scaleY = factor
                        val railX = when {
                            distance <= 1 -> 108.5f * distance
                            distance <= 2 -> 108.5f + 73.5f * (distance - 1)
                            else -> 182f + 66f * (distance - 2)
                        }
                        translationX = (railX * sign(offset) - 108.5f * offset) * railScale * density
                        val railY = if (distance <= 1) 26f * distance
                            else 26f + 24f * (distance - 1).coerceAtMost(1f)
                        // Les pieds centraux reposent sur l'ellipse ; les voisins suivent le rail iOS.
                        translationY = (stageHeight.toPx() / 2 - 26.dp.toPx() * railScale - avatarSize.toPx() / 2) +
                            railY * railScale * density
                        rotationZ = sign(offset) * 22.92f * exp(-((distance - .75f) / .45f).pow(2)) *
                            (distance / .2f).coerceIn(0f, 1f)
                        // Les trois personnages centraux restent pleinement opaques.
                        alpha = if (distance <= 2.35f) 1f else (1f - (distance - 2.35f) / .95f).coerceIn(0f, 1f)
                    }, contentScale = ContentScale.Fit)
            }
        }
    }
}

// Repère commun 375 dp ; le plateau iOS est dessiné dans son repère 185 × 82.
private fun renderStageLayer(width: Float, height: Float, layer: Int): Bitmap {
    val bitmap = Bitmap.createBitmap(ceil(width).toInt().coerceAtLeast(1),
        ceil(height).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val scale = width / 375f
    canvas.scale(scale, scale)
    val floor = height / scale - 26f
    if (layer == 0) {
        // Projecteurs arrière du sommet de LoginWindowChromeView (90/337 et 247/337).
        for (side in listOf(-1, 1)) {
            val originX = 187.5f + side * 87.35f
            canvas.save()
            canvas.translate(originX, floor + 23f)
            canvas.rotate(side * 12.6f)
            val ray = Path().apply {
                moveTo(-3f, 0f); lineTo(-25f, -166f)
                quadTo(0f, -190f, 25f, -166f); lineTo(3f, 0f); close()
            }
            canvas.drawPath(ray, stagePaint(shader = stageGradient(0f, 0f, 0f, -180f,
                "#77FFFFFF", "#25FFFFFF", "#00FFFFFF"), blur = 9f))
            canvas.restore()
        }
    }
    canvas.save()
    canvas.translate((375f - 185f) / 2, floor - 82f * .68f)
    val w = 185f
    val h = 82f
    val main = RectF(w * .09f, h * .555f, w * .91f, h * .805f)
    val inner = RectF(w * .14f, h * .588f, w * .86f, h * .748f)
    when (layer) {
        0 -> {
            for (side in listOf(-1, 1)) {
                val originX = w * if (side < 0) .18f else .82f
                val targetX = w * if (side < 0) .4f else .6f
                val ray = Path().apply {
                    moveTo(originX - 3f, h * .58f)
                    lineTo(targetX - w * .10f, -h * .5f)
                    quadTo(targetX, -h * .65f, targetX + w * .10f, -h * .5f)
                    lineTo(originX + 3f, h * .58f); close()
                }
                canvas.drawPath(ray, stagePaint(shader = stageGradient(originX, h * .58f, targetX, -h * .65f,
                    "#808D45FF", "#298D45FF", "#008D45FF"), blur = 2.6f))
            }
        }
        1 -> {
            canvas.drawOval(main, stagePaint(shader = stageGradient(0f, main.top, 0f, main.bottom,
                "#1C1725", "#0A0710", "#030204")))
            canvas.drawOval(inner, stagePaint(shader = stageGradient(0f, inner.top, 0f, inner.bottom,
                "#16111E", "#050408")))
            canvas.drawOval(main, stagePaint(Color.parseColor("#514265"), stroke = .8f))
        }
        2 -> {
            canvas.drawOval(RectF(w * .07f, h * .59f, w * .93f, h * .87f),
                stagePaint(Color.parseColor("#608D45FF"), blur = 9f))
            val rim = stageGradient(main.left, main.top, main.right, main.bottom,
                "#9A3DFF", "#C27AFF", "#E4C4FF", "#C7FFFFFF")
            canvas.drawOval(main, stagePaint(shader = rim, stroke = 4f, blur = 2.8f))
            canvas.drawOval(main, stagePaint(shader = rim, stroke = 1.3f))
            canvas.drawOval(inner, stagePaint(Color.parseColor("#80FFFFFF"), stroke = .7f))
            val lip = Path().apply {
                moveTo(w * .11f, h * .69f)
                quadTo(w * .5f, h * .87f, w * .89f, h * .69f)
            }
            val lipColor = stageGradient(0f, 0f, w, 0f, "#008D45FF", "#C78D45FF", "#D1FFFFFF", "#008D45FF")
            canvas.drawPath(lip, stagePaint(shader = lipColor, stroke = 5f, blur = 4f))
            canvas.drawPath(lip, stagePaint(shader = lipColor, stroke = 1.5f))
        }
    }
    canvas.restore()
    if (layer == 1 || layer == 2) {
        for (side in listOf(-1, 1)) {
            for (rear in listOf(false, true)) {
                val x = 187.5f + side * if (rear) 87.35f else 185f * .32f
                val y = floor + if (rear) 23f else -82f * .10f
                val rect = RectF(x - 6f, y - 3f, x + 6f, y + 3f)
                if (layer == 1) canvas.drawRoundRect(rect, 3f, 3f,
                    stagePaint(shader = stageGradient(x, y - 3f, x, y + 3f, "#40304E", "#0A0710")))
                else {
                    canvas.drawCircle(x, y - 1f, 8f, stagePaint(shader = RadialGradient(x, y - 1f, 8f,
                        intArrayOf(Color.parseColor("#DDBC8AFF"), Color.TRANSPARENT), null, Shader.TileMode.CLAMP)))
                    canvas.drawOval(RectF(x - 3f, y - 2f, x + 3f, y), stagePaint(Color.parseColor("#F2E5FF")))
                }
            }
        }
    }
    return bitmap
}

/** Contour de LoginWindowChromeView, même repère et mêmes courbes que le main iOS. */
internal fun renderIosStageWindow(width: Float, height: Float, margin: Int): Bitmap {
    val bitmap = Bitmap.createBitmap(ceil(width).toInt().coerceAtLeast(1) + margin * 2,
        ceil(height).toInt().coerceAtLeast(1) + margin * 2, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.translate(margin.toFloat(), margin.toFloat())
    canvas.scale(width / 337f, height / 489f)
    val shape = Path().apply {
        moveTo(1f, 48f)
        cubicTo(1f, 29f, 14f, 17f, 34f, 15f)
        cubicTo(48f, 14f, 55f, 7f, 69f, 5f)
        cubicTo(84f, 3f, 92f, 14f, 105f, 17f)
        cubicTo(123f, 22f, 135f, 10f, 149f, 7f)
        cubicTo(158f, 5f, 164f, 11f, 168.5f, 11f)
        cubicTo(173f, 11f, 179f, 5f, 188f, 7f)
        cubicTo(202f, 10f, 214f, 22f, 232f, 17f)
        cubicTo(245f, 14f, 253f, 3f, 268f, 5f)
        cubicTo(282f, 7f, 289f, 14f, 303f, 15f)
        cubicTo(323f, 17f, 336f, 29f, 336f, 48f)
        lineTo(336f, 395f)
        cubicTo(336f, 431f, 314f, 451f, 280f, 451f)
        cubicTo(260f, 451f, 241f, 453f, 220f, 453f)
        cubicTo(196f, 453f, 184f, 461f, 168.5f, 461f)
        cubicTo(153f, 461f, 141f, 453f, 117f, 453f)
        cubicTo(96f, 453f, 77f, 451f, 57f, 451f)
        cubicTo(24f, 451f, 1f, 431f, 1f, 395f)
        close()
    }
    canvas.drawPath(shape, stagePaint(shader = stageGradient(30f, 40f, 310f, 475f,
        "#1C1824", "#16161D", "#0B0811", "#08060D", "#0A0910")))
    canvas.save()
    canvas.clipPath(shape)
    canvas.drawPaint(stagePaint(shader = RadialGradient(168.5f, 4.75f, 251.25f,
        intArrayOf(Color.parseColor("#6B9B57FF"), Color.parseColor("#297844D7"), Color.TRANSPARENT),
        floatArrayOf(0f, .5f, 1f), Shader.TileMode.CLAMP)))
    canvas.drawPaint(stagePaint(shader = RadialGradient(222.1f, 465.67f, 184.25f,
        intArrayOf(Color.parseColor("#61A65CFF"), Color.TRANSPARENT), null, Shader.TileMode.CLAMP)))
    canvas.restore()
    canvas.drawPath(shape, stagePaint(Color.parseColor("#5C9A5CFF"), stroke = 3.2f, blur = 5f))
    canvas.drawPath(shape, stagePaint(shader = stageGradient(0f, 7.24f, 334.8f, 490.4f,
        "#EFE5FF", "#B068FF", "#8850FF", "#D470FF"), stroke = 1.1f))
    return bitmap
}

private fun stageGradient(x1: Float, y1: Float, x2: Float, y2: Float, vararg colors: String) =
    LinearGradient(x1, y1, x2, y2, colors.map(Color::parseColor).toIntArray(), null, Shader.TileMode.CLAMP)

private fun stagePaint(color: Int = Color.WHITE, shader: Shader? = null, stroke: Float = 0f, blur: Float = 0f) =
    Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color
        this.shader = shader
        if (stroke > 0f) { style = Paint.Style.STROKE; strokeWidth = stroke; strokeCap = Paint.Cap.ROUND }
        if (blur > 0f) maskFilter = BlurMaskFilter(blur, BlurMaskFilter.Blur.NORMAL)
    }
