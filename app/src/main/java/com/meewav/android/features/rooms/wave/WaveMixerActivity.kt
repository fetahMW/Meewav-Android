package com.meewav.android.features.rooms.wave

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

/**
 * Écran Room « La Wave » — rôle hôte, onglet **Mixeur**.
 * Portage natif Compose de la référence iOS `WaveReferenceHostRoomView` +
 * `PlaceChannelStrip` / `PlaceVocalPluginConsolePanel` (matériau « hardware dark »).
 */
class WaveMixerActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // L'écran de mixage reste visible et interactif par-dessus le keyguard
        // (validation sur appareil sans déverrouillage manuel).
        setShowWhenLocked(true)
        setTurnScreenOn(true)
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.rgb(7, 8, 9)),
        )
        setContent {
            WaveMixerScreen(
                room = RoomModule.fromRoute(intent.getStringExtra("roomType")) ?: RoomModule.WAVE,
                roomTitle = intent.getStringExtra("roomTitle"),
                cageProgram = intent.getStringExtra("cageProgram"), programScope = intent.getStringExtra("programScope") ?: "demo",
                onBack = { finish() }, onClose = { finish() })
        }
    }
}
