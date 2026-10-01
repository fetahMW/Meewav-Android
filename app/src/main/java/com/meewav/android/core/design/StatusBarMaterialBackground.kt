package com.meewav.android.core.design

import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.LayerDrawable
import android.view.Gravity

/** Keeps the status material inside its visible inset, including fullscreen. */
internal class StatusBarMaterialBackground(material: Drawable, baseColor: Int) :
    LayerDrawable(arrayOf(ColorDrawable(baseColor), material)) {
    private var topInset = 0

    init {
        setLayerGravity(1, Gravity.TOP or Gravity.FILL_HORIZONTAL)
        setLayerHeight(1, 0)
    }

    fun updateTopInset(inset: Int) {
        val height = inset.coerceAtLeast(0)
        if (height == topInset) return
        topInset = height
        setLayerHeight(1, height)
        // Updating layer dimensions does not itself recalculate child bounds.
        // Force that calculation even when the window size has not changed.
        onBoundsChange(bounds)
        invalidateSelf()
    }
}
