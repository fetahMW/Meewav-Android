package com.meewav.android.features.rooms

import com.meewav.android.features.messaging.MessagingActivity

/** Local Web sources, native session and shared dock navigation. */
class RoomsActivity : MessagingActivity() {
    override val assetSurface = "rooms"
    override val defaultRoute = "/rooms"
}
