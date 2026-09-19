package com.meewav.android.features.rooms.wave

/** Room-specific identity. Chat, mixer, director and guests always use the same components. */
enum class RoomModule(val route: String, val label: String, val toolsLabel: String) {
    WAVE("wave", "La Wave", "Wave"),
    CAGE("cage", "La Cage", "Cage"),
    PLACE("place", "La Place", "Place"),
    CLASSE("classe", "La Classe", "Classe"),
    LOGE("loge", "La Loge", "Loge"),
    SCENE("scene", "La Scène", "Scène");

    companion object {
        fun fromRoute(route: String?) = entries.firstOrNull { it.route == route }
    }
}
