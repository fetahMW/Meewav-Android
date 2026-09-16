package com.meewav.android.features.tremplin

import com.meewav.android.features.messaging.MessagingActivity

/** Reuses the Profile's trusted local document, native session and media bridge. */
class TremplinActivity : MessagingActivity() {
    override val assetSurface = "tremplin"
    override val defaultRoute = "/tremplin"
}
