package com.meewav.android.core.design

import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.Rect
import android.graphics.Shader
import android.graphics.drawable.Drawable

/** Full-bleed primary CTA face for native system-bar backgrounds.
 * Keep colors/stops in sync with polishedPrimarySurface and --mw-primary-face.
 * Shaders are rebuilt only when the inset's bounds change, never per frame.
 */
internal class PolishedPrimaryBarDrawable : Drawable() {
    private val face = Paint(Paint.ANTI_ALIAS_FLAG or Paint.DITHER_FLAG)
    private val reflection = Paint(Paint.ANTI_ALIAS_FLAG)
    private val lowerLight = Paint(Paint.ANTI_ALIAS_FLAG)
    private val paints = arrayOf(face, reflection, lowerLight)

    override fun onBoundsChange(bounds: Rect) {
        if (bounds.isEmpty) return
        val left = bounds.left.toFloat()
        val top = bounds.top.toFloat()
        val right = bounds.right.toFloat()
        val bottom = bounds.bottom.toFloat()
        face.shader = LinearGradient(left, top, left, bottom,
            intArrayOf(0xFF2B2341.toInt(), 0xFF1D1531.toInt(), 0xFF5137A1.toInt()),
            floatArrayOf(0f, .5f, 1f), Shader.TileMode.CLAMP)
        reflection.shader = LinearGradient(left, top, right, bottom,
            intArrayOf(0x29FFFFFF, 0x08FFFFFF, 0x00FFFFFF),
            floatArrayOf(0f, .26f, .48f), Shader.TileMode.CLAMP)
        lowerLight.shader = LinearGradient(left, top, left, bottom,
            intArrayOf(0x00A98EF0, 0x00A98EF0, 0x29A98EF0),
            floatArrayOf(0f, .76f, 1f), Shader.TileMode.CLAMP)
    }

    override fun draw(canvas: Canvas) {
        if (bounds.isEmpty) return
        for (paint in paints) canvas.drawRect(bounds, paint)
    }

    override fun setAlpha(alpha: Int) {
        for (paint in paints) paint.alpha = alpha
        invalidateSelf()
    }

    override fun setColorFilter(colorFilter: ColorFilter?) {
        for (paint in paints) paint.colorFilter = colorFilter
        invalidateSelf()
    }

    @Suppress("DEPRECATION", "OVERRIDE_DEPRECATION")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT
}
