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
import androidx.compose.animation.core.*
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
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.zIndex
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.Dp
import kotlinx.coroutines.delay
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch
import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.exp
import kotlin.math.pow
import kotlin.math.sign
import kotlin.math.sin
import kotlin.math.cos
import kotlin.math.PI

internal val AuthWindowLowerExtension = 28.dp
internal val AuthStageOverlap = 22.dp
internal fun authStageHeight(panelHeight: Dp) = ((panelHeight - AuthWindowLowerExtension) * .28f).coerceIn(120.dp, 180.dp)

@Composable
internal fun IosStageBackdrop(modifier: Modifier, light: () -> Float = { .14f },
                              sweepPhase: (() -> Float)? = null,
                              leftLight: () -> Float = light, rightLight: () -> Float = light,
                              violetLight: () -> Float = { 0f }, fourSpotOrbit: Boolean = false) {
    Box(modifier.drawWithCache {
        val platform = renderStageLayer(size.width, size.height, 1).asImageBitmap()
        val rim = renderStageLayer(size.width, size.height, 2).asImageBitmap()
        val washes = listOf(-1, 1).map { renderRearProjector(size.width, size.height, it, lensOnly = false).asImageBitmap() }
        val lenses = listOf(-1, 1).map { renderRearProjector(size.width, size.height, it, lensOnly = true).asImageBitmap() }
        val violets = listOf(-1, 1).map { renderCrossedVioletBeam(size.width, size.height, it, front = fourSpotOrbit).asImageBitmap() }
        val frontBodies = if (fourSpotOrbit) renderFrontVioletSpots(size.width, size.height, false).asImageBitmap() else null
        val frontLenses = if (fourSpotOrbit) renderFrontVioletSpots(size.width, size.height, true).asImageBitmap() else null
        onDrawBehind {
            val scale = size.width / 375f
            for (index in 0..1) {
                val side = if (index == 0) -1f else 1f
                val origin = Offset(size.width / 2f + side * 185f * .32f * scale,
                    size.height - (26f + 82f * .06f) * scale)
                val phase = (sweepPhase?.invoke() ?: 0f) * PI.toFloat() / 180f
                val angle = side * (1.8f + 3.2f * sin(phase + index * .8f))
                val intensity = (if (index == 0) leftLight() else rightLight()).coerceIn(0f, 1f)
                val violetOrigin = if (fourSpotOrbit) Offset(size.width / 2f + side * 185f * .24f * scale,
                    size.height - 21f * scale) else origin
                val violetPhase = -phase + index * 2.3f + 1.1f
                withTransform({
                    if (fourSpotOrbit) {
                        rotate(4.5f * sin(violetPhase), violetOrigin)
                        this.scale(1f, 1f + .055f * cos(violetPhase), violetOrigin)
                    } else rotate(-side * (1f + 2.2f * sin(phase + index * .8f)), origin)
                }) {
                    drawImage(violets[index], alpha = violetLight().coerceIn(0f, 1f))
                }
                // Pan + inclinaison déphasés : la lumière décrit une petite ellipse sur le mur.
                // Le pivot reste la lentille ; ni le socle ni le corps ne tourne autour du plateau.
                withTransform({
                    if (fourSpotOrbit) {
                        val whitePhase = phase + index * 2.6f
                        rotate(4.8f * sin(whitePhase), origin)
                        this.scale(1f, 1f + .05f * cos(whitePhase), origin)
                    } else rotate(angle, origin)
                }) {
                    drawImage(washes[index], alpha = intensity)
                }
            }
            drawImage(platform)
            drawImage(rim, alpha = (.24f + .76f * light()).coerceIn(0f, 1f))
            drawImage(lenses[0], alpha = leftLight().coerceIn(0f, 1f))
            drawImage(lenses[1], alpha = rightLight().coerceIn(0f, 1f))
            frontBodies?.let { drawImage(it) }
            frontLenses?.let { drawImage(it, alpha = violetLight().coerceIn(0f, 1f)) }
        }
    })
}

/** Port natif de SaturnCarouselLayout et StagePlatformRenderer (iOS main aea7251).
 * Les 28 PNG HD Android restent utilisés ; les textures du plateau sont mises en cache.
 */
@Composable
internal fun IosAvatarStage(pager: PagerState, modifier: Modifier = Modifier, enabled: Boolean = true,
                            confirmation: () -> Float = { 0f }) {
    val plateLight = remember { Animatable(.14f) }
    val leftLight = remember { Animatable(0f) }
    val rightLight = remember { Animatable(0f) }
    val violetLight = remember { Animatable(0f) }
    // Chaque nouveau geste annule la séquence précédente, sans flash ni retard accumulé.
    LaunchedEffect(pager.isScrollInProgress, pager.settledPage) {
        coroutineScope {
            if (pager.isScrollInProgress) {
                launch { plateLight.animateTo(.14f, tween(100)) }
                launch { leftLight.animateTo(0f, tween(100)) }
                launch { rightLight.animateTo(0f, tween(100)) }
                launch { violetLight.animateTo(0f, tween(100)) }
            } else {
                launch { plateLight.animateTo(1f, tween(140, easing = LinearOutSlowInEasing)) }
                launch {
                    leftLight.animateTo(0f, tween(60))
                    delay(15)
                    leftLight.animateTo(.94f, tween(170, easing = LinearOutSlowInEasing))
                }
                launch {
                    rightLight.animateTo(0f, tween(60))
                    delay(90)
                    rightLight.animateTo(.94f, tween(180, easing = LinearOutSlowInEasing))
                }
                launch {
                    violetLight.animateTo(0f, tween(60))
                    delay(290)
                    violetLight.animateTo(.85f, tween(160, easing = LinearOutSlowInEasing))
                }
            }
        }
    }
    val motion = rememberInfiniteTransition(label = "Faisceaux Avatar")
    val sweep = motion.animateFloat(0f, 360f,
        infiniteRepeatable(tween(16000, easing = LinearEasing)), label = "Balayage des faisceaux")
    // Les images ne sont pas des enfants du pager : son viewport ne doit pas les découper.
    BoxWithConstraints(modifier) {
        val railScale = (maxWidth / 375.dp).coerceAtMost(1.15f)
        val firstGap = 108.5.dp * railScale
        val avatarSize = minOf(144.dp * railScale, maxHeight - 32.dp)
        IosStageBackdrop(Modifier.fillMaxSize(), light = {
            plateLight.value + .12f * confirmationPulse(confirmation())
        }, sweepPhase = { sweep.value },
            leftLight = { leftLight.value + .06f * confirmationPulse(confirmation()) },
            rightLight = { rightLight.value + .06f * confirmationPulse(confirmation()) },
            violetLight = { violetLight.value })
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

/** Compression brève, expansion ample et retour amorti ; le bord supérieur reste au plateau. */
internal fun confirmationWindowScale(progress: Float): Float {
    fun smooth(t: Float): Float = t * t * (3f - 2f * t)
    return when {
        progress < .08f -> 1f - .01f * smooth(interval(progress, 0f, .08f))
        progress < .24f -> .99f + .035f * smooth(interval(progress, .08f, .24f))
        else -> 1.025f - .025f * smooth(interval(progress, .24f, .70f))
    }
}

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

// Repère commun 375 dp ; le plateau iOS est dessiné dans son repère 185 × 82.
private fun renderStageLayer(width: Float, height: Float, layer: Int): Bitmap {
    val bitmap = Bitmap.createBitmap(ceil(width).toInt().coerceAtLeast(1),
        ceil(height).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val scale = width / 375f
    canvas.scale(scale, scale)
    val floor = height / scale - 26f
    canvas.save()
    canvas.translate((375f - 185f) / 2, floor - 82f * .68f)
    val w = 185f
    val h = 82f
    val main = RectF(w * .09f, h * .555f, w * .91f, h * .805f)
    val inner = RectF(w * .14f, h * .588f, w * .86f, h * .748f)
    when (layer) {
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
    if (layer == 1) {
        for (side in listOf(-1, 1)) {
            val x = 187.5f + side * 185f * .32f
            val y = floor - 82f * .06f
            canvas.drawRoundRect(RectF(x - 4.5f, y - 3f, x + 4.5f, y + 2.5f), 2.5f, 2.5f,
                stagePaint(shader = stageGradient(x, y - 3f, x, y + 3f, "#38383F", "#07070A")))
            canvas.drawOval(RectF(x - 2.8f, y - 2f, x + 2.8f, y), stagePaint(Color.parseColor("#35353A")))
        }
    }
    return bitmap
}

/** Projection blanche diffuse, calculée une fois ; la texture du mur reste visible dessous. */
private fun renderRearProjector(width: Float, height: Float, side: Int, lensOnly: Boolean): Bitmap {
    val bitmap = Bitmap.createBitmap(ceil(width).toInt().coerceAtLeast(1),
        ceil(height).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val scale = width / 375f
    canvas.scale(scale, scale)
    val x = 187.5f + side * 185f * .32f
    val y = height / scale - 26f - 82f * .06f
    if (lensOnly) {
        canvas.drawCircle(x, y - 1f, 8f, stagePaint(shader = RadialGradient(x, y - 1f, 8f,
            intArrayOf(Color.parseColor("#72FFFFFF"), Color.TRANSPARENT), null, Shader.TileMode.CLAMP)))
        canvas.drawOval(RectF(x - 2.4f, y - 1.9f, x + 2.4f, y - .2f), stagePaint(Color.parseColor("#F0FFFFFF")))
        return bitmap
    }
    val length = (y - 14f).coerceIn(56f, 130f)
    val targetX = x + side * 10f
    val targetY = y - length
    val wallCenterY = targetY + 34f
    val wallRadiusY = minOf(56f, wallCenterY - 4f)
    canvas.save()
    canvas.translate(targetX, wallCenterY)
    canvas.scale(1f, wallRadiusY / 38f)
    canvas.drawCircle(0f, 0f, 38f, stagePaint(shader = RadialGradient(0f, 0f, 38f,
        intArrayOf(Color.parseColor("#36FFFFFF"), Color.parseColor("#16FFFFFF"), Color.TRANSPARENT),
        floatArrayOf(0f, .45f, 1f), Shader.TileMode.CLAMP)))
    canvas.restore()
    val haze = Path().apply {
        moveTo(x - 1.5f, y - 1f)
        cubicTo(x - 8f, y - length * .45f, targetX - 22f, targetY + 22f, targetX - 27f, targetY + 8f)
        quadTo(targetX, targetY - 6f, targetX + 27f, targetY + 8f)
        cubicTo(targetX + 22f, targetY + 22f, x + 8f, y - length * .45f, x + 1.5f, y - 1f)
        close()
    }
    canvas.drawPath(haze, stagePaint(shader = stageGradient(x, y, targetX, targetY,
        "#48FFFFFF", "#1CFFFFFF", "#00FFFFFF"), blur = 7f))
    return bitmap
}

/** Deux accents courts se croisent derrière les personnages, depuis les spots arrière existants. */
private fun renderCrossedVioletBeam(width: Float, height: Float, side: Int, front: Boolean = false): Bitmap {
    val bitmap = Bitmap.createBitmap(ceil(width).toInt().coerceAtLeast(1),
        ceil(height).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val scale = width / 375f
    canvas.scale(scale, scale)
    val x = 187.5f + side * 185f * if (front) .24f else .32f
    val y = height / scale - 26f + if (front) 5f else -82f * .06f
    val targetX = 187.5f - side * 25f
    val targetY = y - (y - 18f).coerceIn(48f, 108f)
    val midX = (x + targetX) / 2f
    val midY = (y + targetY) / 2f
    val beam = Path().apply {
        moveTo(x - 1.5f, y - 1f)
        quadTo(midX - 8f, midY, targetX - 14f, targetY)
        quadTo(targetX, targetY - 5f, targetX + 14f, targetY)
        quadTo(midX + 8f, midY, x + 1.5f, y - 1f)
        close()
    }
    canvas.drawPath(beam, stagePaint(shader = stageGradient(x, y, targetX, targetY,
        "#6A9B63FF", "#429B63FF", "#009B63FF"), blur = 4f))
    return bitmap
}

/** Les deux lentilles violettes de Bienvenue reposent sur l'avant de l'ellipse. */
private fun renderFrontVioletSpots(width: Float, height: Float, lit: Boolean): Bitmap {
    val bitmap = Bitmap.createBitmap(ceil(width).toInt().coerceAtLeast(1),
        ceil(height).toInt().coerceAtLeast(1), Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val scale = width / 375f
    canvas.scale(scale, scale)
    val y = height / scale - 21f
    for (side in listOf(-1, 1)) {
        val x = 187.5f + side * 185f * .24f
        if (lit) {
            canvas.drawCircle(x, y - 1f, 8f, stagePaint(shader = RadialGradient(x, y - 1f, 8f,
                intArrayOf(Color.parseColor("#889B63FF"), Color.TRANSPARENT), null, Shader.TileMode.CLAMP)))
            canvas.drawOval(RectF(x - 2.4f, y - 1.9f, x + 2.4f, y - .2f), stagePaint(Color.parseColor("#EBCFAAFF")))
        } else {
            canvas.drawRoundRect(RectF(x - 4.5f, y - 3f, x + 4.5f, y + 2.5f), 2.5f, 2.5f,
                stagePaint(shader = stageGradient(x, y - 3f, x, y + 3f, "#38383F", "#07070A")))
        }
    }
    return bitmap
}

/** Contour de LoginWindowChromeView, même repère et mêmes courbes que le main iOS. */
internal fun renderIosStageWindow(width: Float, height: Float, margin: Int, illuminationOnly: Boolean = false): Bitmap {
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
    if (illuminationOnly) {
        // Lumière diffuse sur la surface et autour de son vrai contour, sans anneau ajouté.
        canvas.drawPath(shape, stagePaint(Color.parseColor("#706E43C2"), stroke = 10f, blur = 12f))
        canvas.save()
        canvas.clipPath(shape)
        canvas.drawPaint(stagePaint(shader = RadialGradient(168.5f, 160f, 360f,
            intArrayOf(Color.parseColor("#357F59CC"), Color.parseColor("#145137A1"), Color.TRANSPARENT),
            floatArrayOf(0f, .65f, 1f), Shader.TileMode.CLAMP)))
        canvas.restore()
        return bitmap
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
