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
import androidx.compose.foundation.Canvas as ComposeCanvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.zIndex
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import kotlinx.coroutines.delay
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.exp
import kotlin.math.pow
import kotlin.math.sign
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.PI

internal val AuthWindowLowerExtension = 28.dp
internal val AuthStageOverlap = 22.dp
internal fun authStageHeight(panelHeight: Dp) = ((panelHeight - AuthWindowLowerExtension) * .28f).coerceIn(120.dp, 180.dp)

@Composable
internal fun IosStageBackdrop(modifier: Modifier, light: () -> Float = { .14f }, showBeams: Boolean = false,
                              orbit: (() -> Float)? = null) {
    Box(modifier.drawWithCache {
        val beams = if (showBeams) renderStageLayer(size.width, size.height, 0).asImageBitmap() else null
        val platform = renderStageLayer(size.width, size.height, 1, staticSpots = orbit == null).asImageBitmap()
        val rim = renderStageLayer(size.width, size.height, 2, staticSpots = orbit == null).asImageBitmap()
        onDrawBehind {
            val scale = size.width / 375f
            val phase = orbit?.invoke()
            val spots = if (phase == null) emptyList() else List(4) { index ->
                val angle = (phase + index * 90f) * PI.toFloat() / 180f
                Offset(size.width / 2f + cos(angle) * 59f * scale,
                    size.height - 26f * scale + sin(angle) * 7f * scale)
            }
            spots.forEach { origin ->
                val top = Offset(size.width / 2f + (origin.x - size.width / 2f) * .35f,
                    origin.y - 74f * scale)
                val beam = androidx.compose.ui.graphics.Path().apply {
                    moveTo(origin.x - 2f * scale, origin.y)
                    lineTo(top.x - 13f * scale, top.y)
                    lineTo(top.x + 13f * scale, top.y)
                    lineTo(origin.x + 2f * scale, origin.y)
                    close()
                }
                drawPath(beam, Brush.linearGradient(listOf(ComposeColor(0x668F55FF), ComposeColor.Transparent),
                    start = origin, end = top))
            }
            beams?.let { drawImage(it, alpha = light().coerceIn(0f, 1f)) }
            drawImage(platform)
            drawImage(rim, alpha = (.24f + .76f * light()).coerceIn(0f, 1f))
            spots.forEach { origin ->
                drawCircle(Brush.radialGradient(listOf(ComposeColor(0xBBAA76FF), ComposeColor.Transparent),
                    center = origin, radius = 9f * scale), radius = 9f * scale, center = origin)
                drawOval(ComposeColor(0xFFF0E6FF), topLeft = origin - Offset(2.5f * scale, 1.3f * scale),
                    size = Size(5f * scale, 2.6f * scale))
            }
        }
    })
}

/** Port natif de SaturnCarouselLayout et StagePlatformRenderer (iOS main aea7251).
 * Les 28 PNG HD Android restent utilisés ; aucun moteur Web ni minuterie de rendu continue.
 */
@Composable
internal fun IosAvatarStage(pager: PagerState, modifier: Modifier = Modifier, enabled: Boolean = true,
                            confirmation: () -> Float = { 0f }) {
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
    // Les images ne sont pas des enfants du pager : son viewport ne doit pas les découper.
    BoxWithConstraints(modifier) {
        val railScale = (maxWidth / 375.dp).coerceAtMost(1.15f)
        val firstGap = 108.5.dp * railScale
        val avatarSize = minOf(144.dp * railScale, maxHeight - 32.dp)
        IosStageBackdrop(Modifier.fillMaxSize(), light = {
            light.value + .22f * confirmationPulse(confirmation())
        }, showBeams = true)
        IosStageConfirmationPulse(Modifier.fillMaxSize(), confirmation)
        HorizontalPager(pager, pageSize = PageSize.Fixed(firstGap),
            beyondViewportPageCount = 2, overscrollEffect = null, userScrollEnabled = enabled,
            contentPadding = PaddingValues(horizontal = (maxWidth - firstGap) / 2),
            modifier = Modifier.fillMaxSize()) { _ -> Box(Modifier.fillMaxSize()) }
        for (relativePage in -3..3) {
            val page = pager.currentPage + relativePage
            if (page !in 0 until pager.pageCount) continue
            key(page) {
            val avatar = AvatarCatalog.profiles[page % AvatarCatalog.profiles.size]
            val stageHeight = maxHeight
            Box(Modifier.fillMaxSize().zIndex(10f - abs(relativePage)), contentAlignment = Alignment.Center) {
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
                        translationX = railX * sign(offset) * railScale * density
                        val railY = if (distance <= 1) 26f * distance
                            else 26f + 24f * (distance - 1).coerceAtMost(1f)
                        // Les pieds centraux reposent sur l'ellipse ; les voisins suivent le rail iOS.
                        translationY = (stageHeight.toPx() / 2 - 26.dp.toPx() * railScale - avatarSize.toPx() / 2) +
                            (railY + 6f * (distance / 2f).coerceIn(0f, 1f)) * railScale * density
                        rotationZ = sign(offset) * 22.92f * exp(-((distance - .75f) / .45f).pow(2)) *
                            (distance / .2f).coerceIn(0f, 1f)
                        // Les trois personnages centraux restent pleinement opaques.
                        alpha = if (distance <= 2.35f) 1f else (1f - (distance - 2.35f) / .95f).coerceIn(0f, 1f)
                        val motion = avatarConfirmationMotion(confirmation(), offset)
                        translationX += motion.x * railScale * density
                        translationY += motion.y * railScale * density
                        rotationZ += motion.rotation
                        scaleX *= motion.scale
                        scaleY *= motion.scale
                        alpha *= motion.alpha
                    }, contentScale = ContentScale.Fit)
            }
            }
        }
    }
}

internal fun confirmationPulse(progress: Float): Float =
    (easeOut(interval(progress, .02f, .18f)) - easeOut(interval(progress, .18f, .52f))).coerceAtLeast(0f)

private fun interval(value: Float, from: Float, to: Float) = ((value - from) / (to - from)).coerceIn(0f, 1f)
private fun easeOut(value: Float) = 1f - (1f - value).pow(3)

private data class AvatarConfirmationMotion(val x: Float = 0f, val y: Float = 0f,
    val rotation: Float = 0f, val scale: Float = 1f, val alpha: Float = 1f)

/** Trajectoires de SaturnAvatarSlotView : impulsion latérale, puis chute accélérée. */
private fun avatarConfirmationMotion(progress: Float, offset: Float): AvatarConfirmationMotion {
    val p = progress.coerceIn(0f, 1f)
    if (p == 0f) return AvatarConfirmationMotion()
    val distance = abs(offset)
    if (distance < .18f) {
        val lock = easeOut(interval(p, .05f, .28f))
        val settle = easeOut(interval(p, .28f, .56f))
        return AvatarConfirmationMotion(y = -1.6f * lock + 1.4f * settle,
            scale = (1f + .026f * lock - .018f * settle).coerceAtLeast(1f))
    }
    val side = sign(offset)
    if (distance < 1.5f) {
        val kick = easeOut(interval(p, 0f, .24f))
        val fall = interval(p, .24f, 1f).pow(5)
        val rotation = if (p <= .34f) .16f * p / .34f else .16f + .42f * (p - .34f) / .66f
        val compression = easeOut(interval(p, .20f, .34f)) - easeOut(interval(p, .34f, .52f))
        return AvatarConfirmationMotion(
            x = side * (31f * kick + 53f * fall), y = -9f * kick + 879f * fall,
            rotation = side * rotation * 180f / Math.PI.toFloat(), scale = 1f - .055f * compression,
            alpha = 1f - .42f * easeOut(interval(p, .72f, .96f)))
    }
    val local = interval(p, ((distance - 1.5f) * .025f).coerceIn(0f, .09f), 1f)
    val fall = local.pow(2)
    return AvatarConfirmationMotion(x = side * (14f + distance.coerceAtMost(4.5f) * 3.2f) * fall,
        y = 840f * fall, rotation = side * .42f * local * 180f / Math.PI.toFloat(),
        alpha = 1f - .36f * easeOut(interval(local, .70f, .98f)))
}

@Composable
private fun IosStageConfirmationPulse(modifier: Modifier, progress: () -> Float) {
    ComposeCanvas(modifier) {
        val p = progress()
        if (p > .001f && p < .72f) {
            val s = size.width / 375f
            val expansion = easeOut(interval(p, .03f, .42f))
            val fade = 1f - easeOut(interval(p, .18f, .64f))
            val width = (152f + 58f * expansion) * s
            val height = (22f + 22f * expansion) * s
            drawOval(Brush.horizontalGradient(listOf(ComposeColor(0xFF5137A1), ComposeColor.White, ComposeColor(0xFF8162B7))),
                topLeft = Offset((size.width - width) / 2, size.height - 26f * s - height / 2),
                size = Size(width, height), alpha = .55f * fade, style = Stroke(1.8f * s))
        }
    }
}

// Repère commun 375 dp ; le plateau iOS est dessiné dans son repère 185 × 82.
private fun renderStageLayer(width: Float, height: Float, layer: Int, staticSpots: Boolean = true): Bitmap {
    val bitmap = Bitmap.createBitmap(ceil(width).toInt().coerceAtLeast(1),
        ceil(height).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val scale = width / 375f
    canvas.scale(scale, scale)
    val floor = height / scale - 26f
    if (layer == 0) {
        // Les deux projecteurs longs sont désormais sur l'ellipse, pas sur le formulaire.
        for (side in listOf(-1, 1)) {
            val originX = 187.5f + side * 185f * .24f
            canvas.save()
            canvas.translate(originX, floor + 5f)
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
                    moveTo(originX - 3f, h * .62f)
                    lineTo(targetX - w * .10f, -h * .5f)
                    quadTo(targetX, -h * .65f, targetX + w * .10f, -h * .5f)
                    lineTo(originX + 3f, h * .62f); close()
                }
                canvas.drawPath(ray, stagePaint(shader = stageGradient(originX, h * .62f, targetX, -h * .65f,
                    "#808D45FF", "#298D45FF", "#008D45FF"), blur = 2.6f))
            }
        }
        1 -> {
            canvas.drawOval(main, stagePaint(shader = stageGradient(0f, main.top, 0f, main.bottom,
                "#17171B", "#08080B", "#020204")))
            canvas.drawOval(inner, stagePaint(shader = stageGradient(0f, inner.top, 0f, inner.bottom,
                "#0D0D11", "#030305")))
            canvas.drawOval(main, stagePaint(Color.parseColor("#514265"), stroke = .8f))
        }
        2 -> {
            val rim = stageGradient(main.left, main.top, main.right, main.bottom,
                "#5137A1", "#7960B2", "#BEB4D5", "#A6FFFFFF")
            canvas.drawOval(main, stagePaint(shader = rim, stroke = 2f, blur = 2.2f))
            canvas.drawOval(main, stagePaint(shader = rim, stroke = .9f))
            canvas.drawOval(inner, stagePaint(Color.parseColor("#60FFFFFF"), stroke = .6f))
            val lip = Path().apply {
                moveTo(w * .11f, h * .69f)
                quadTo(w * .5f, h * .87f, w * .89f, h * .69f)
            }
            val lipColor = stageGradient(0f, 0f, w, 0f, "#005137A1", "#805137A1", "#A6FFFFFF", "#005137A1")
            canvas.drawPath(lip, stagePaint(shader = lipColor, stroke = 3f, blur = 3f))
            canvas.drawPath(lip, stagePaint(shader = lipColor, stroke = 1f))
        }
    }
    canvas.restore()
    if (staticSpots && (layer == 1 || layer == 2)) {
        for (side in listOf(-1, 1)) {
            for (rear in listOf(false, true)) {
                val x = 187.5f + side * 185f * if (rear) .24f else .32f
                val y = floor + if (rear) 5f else -82f * .06f
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
        "#2B1B5C", "#19122F", "#0B0816", "#080610", "#1A1234")))
    canvas.save()
    canvas.clipPath(shape)
    canvas.drawPaint(stagePaint(shader = RadialGradient(168.5f, 4.75f, 251.25f,
        intArrayOf(Color.parseColor("#995137A1"), Color.parseColor("#404E349F"), Color.TRANSPARENT),
        floatArrayOf(0f, .5f, 1f), Shader.TileMode.CLAMP)))
    canvas.drawPaint(stagePaint(shader = RadialGradient(222.1f, 465.67f, 184.25f,
        intArrayOf(Color.parseColor("#80372574"), Color.TRANSPARENT), null, Shader.TileMode.CLAMP)))
    canvas.restore()
    canvas.drawPath(shape, stagePaint(Color.parseColor("#665137A1"), stroke = 3.2f, blur = 5f))
    canvas.drawPath(shape, stagePaint(shader = stageGradient(0f, 7.24f, 334.8f, 490.4f,
        "#BDA3E5", "#7960B2", "#5137A1", "#8162B7"), stroke = 1.1f))
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
