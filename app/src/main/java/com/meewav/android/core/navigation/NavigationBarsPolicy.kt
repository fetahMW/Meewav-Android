package com.meewav.android.core.navigation

enum class NavigationDockMode(val wire: String) {
    APP("app"), SYSTEM("system");

    companion object {
        fun fromWire(value: String?): NavigationDockMode? = entries.firstOrNull { it.wire == value }
    }
}

data class NavigationBarsPolicy(val showStatus: Boolean, val showNavigation: Boolean)

/** A missing dock is a temporary display override, never a preference change. */
fun navigationBarsPolicy(mode: NavigationDockMode, dockAvailable: Boolean, immersiveStatus: Boolean) =
    NavigationBarsPolicy(showStatus = !immersiveStatus,
        showNavigation = mode == NavigationDockMode.SYSTEM || !dockAvailable)
