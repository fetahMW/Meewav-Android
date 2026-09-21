package com.meewav.android.features.rooms

import com.meewav.android.features.messaging.MessagingActivity

/** Local Web sources, native session and shared dock navigation. */
class RoomsActivity : MessagingActivity() {
    private var nativeControls: com.meewav.android.features.rooms.wave.RoomViewerNativeControls? = null
    override val assetSurface = "rooms"
    override val defaultRoute = "/rooms"
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        nativeControls = com.meewav.android.features.rooms.wave.RoomViewerNativeControls(this, web, container)
    }
    override fun onNativeRoomControl(uri: android.net.Uri): Boolean = nativeControls?.handle(uri) ?: false
    override fun onDestroy() { nativeControls?.close(); nativeControls = null; super.onDestroy() }
}
