package com.meewav.android.core.auth

/** Explicit shared catalog keys: translated labels are never persistence identifiers. */
data class CanonicalAvatar(val style: String, val role: String) {
    companion object {
        private val catalog = mapOf(
            "UserFIcon" to ("avatar_3" to "viewer"), "UserIcon" to ("avatar_4" to "viewer"),
            "AccordeonIcon" to ("avatar_30" to "accordionist"), "MicroIcon" to ("avatar_24" to "vocalist"),
            "IngeSonIcon" to ("avatar_14" to "sound_engineer"), "BassisteIcon" to ("avatar_28" to "bassist"),
            "BeatboxerIcon" to ("avatar_26" to "beatboxer"), "BeatmakerIcon" to ("avatar_25" to "beatmaker"),
            "InstrCuivreIcon" to ("avatar_12" to "brass_instrumentalist"), "CompositeurIcon" to ("avatar_21" to "composer"),
            "DansseurIcon" to ("avatar_20" to "dancer"), "Dansseuse2Icon" to ("avatar_19" to "dancer"),
            "DjIcon" to ("avatar_17" to "dj"), "BatteurIcon" to ("avatar_27" to "drummer"),
            "GuitareElecIcon" to ("avatar_15" to "electric_guitarist"), "OrgaEventIcon" to ("avatar_9" to "stage_organization"),
            "GuitareIcon" to ("avatar_16" to "acoustic_guitarist"), "ManagerIcon" to ("avatar_10" to "manager"),
            "PercussionIcon" to ("avatar_8" to "percussionist"), "PianisteIcon" to ("avatar_7" to "pianist"),
            "LabelIcon" to ("avatar_11" to "label"), "StudioIcon" to ("avatar_5" to "studio"),
            "InstrCordesIcon" to ("avatar_31" to "strings_instrumentalist"), "SynthetiseurIcon" to ("avatar_6" to "sound_designer"),
            "ProffesseurIcon" to ("avatar_22" to "vocal_coach"), "ViolonIcon" to ("avatar_1" to "violinist"),
            "ClippeurIcon" to ("avatar_2" to "videomaker"), "InstrVentIcon" to ("avatar_13" to "wind_instrumentalist"),
        )
        fun forIcon(icon: String): CanonicalAvatar = requireNotNull(catalog[icon]) { "Unknown avatar" }.let { CanonicalAvatar(it.first, it.second) }
        fun iconForStyle(style: String?): String? = catalog.entries.firstOrNull { it.value.first == style }?.key
    }
}
