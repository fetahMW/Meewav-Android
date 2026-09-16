package com.meewav.android.features.scene

import com.meewav.android.features.messaging.MessagingActivity

/** Local Web sources, native session, file picker and media lifecycle. */
class SceneActivity : MessagingActivity() {
    override val assetSurface = "scene"
    override val defaultRoute = "/scene"
}
