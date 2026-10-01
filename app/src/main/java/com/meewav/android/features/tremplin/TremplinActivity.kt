package com.meewav.android.features.tremplin

import android.graphics.drawable.Drawable
import com.meewav.android.features.messaging.MessagingActivity
import com.meewav.android.core.design.PolishedPrimaryBarDrawable

/** Reuses the Profile's trusted local document, native session and media bridge. */
class TremplinActivity : MessagingActivity() {
    override val assetSurface = "tremplin"
    override val defaultRoute = "/tremplin"
    override fun createStatusBarBackground(): Drawable = PolishedPrimaryBarDrawable()
}
