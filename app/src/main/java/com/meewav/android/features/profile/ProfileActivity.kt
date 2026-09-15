package com.meewav.android.features.profile

import com.meewav.android.features.messaging.MessagingActivity

/** Shares the local-document, session, media and file-picker bridge with Messaging. */
class ProfileActivity : MessagingActivity() {
    override val assetSurface = "profile"
    override val defaultRoute = "/profile"
}
