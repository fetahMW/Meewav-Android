package com.meewav.android.features.market

import com.meewav.android.features.messaging.MessagingActivity

/** Local Web sources, native session, file picker and media lifecycle. */
class MarketActivity : MessagingActivity() {
    override val assetSurface = "market"
    override val defaultRoute = "/market"
}
