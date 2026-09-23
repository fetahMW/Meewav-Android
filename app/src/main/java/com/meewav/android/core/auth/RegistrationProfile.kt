package com.meewav.android.core.auth

import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.ResolverStyle

/** iOS account metadata extended with the current Web musical-scene identifiers. */
data class RegistrationProfile(
    val username: String,
    val avatarIcon: String,
    val avatarName: String,
    val realArtist: Boolean,
    val birthDate: String,
    val city: String,
    val postalCode: String,
    val country: String,
    val communeCode: String = "",
    val zoneId: String = "",
    val sceneName: String = "",
    val sceneSource: String = "",
    val sceneLongitude: Double? = null,
    val sceneLatitude: Double? = null,
    val visibleOnScene: Boolean = false,
) {
    fun metadata() = buildJsonObject {
        val canonical = CanonicalAvatar.forIcon(avatarIcon)
        put("username", username.trim())
        put("avatar_style_key", canonical.style)
        put("avatar_icon_id", canonical.style)
        put("primary_role_key", canonical.role)
        put("creator_type", if (realArtist) "REEL" else "IA")
        put("artist_type", if (realArtist) "REEL" else "IA")
        // The selected style is the shared iOS/Web/Android identity. An Android
        // drawable name is not a URL and would mask that style in the profile.
        normalizedBirthDate(birthDate)?.let { put("birth_date", it) }
        put("city", city.trim())
        postalCode.trim().takeIf { it.isNotEmpty() }?.let { put("postal_code", it) }
        put("country", country.trim())
        put("country_code", "FR")
        put("is_ghost_mode", !visibleOnScene)
        put("show_on_public_profile", visibleOnScene)
        if (communeCode.isNotBlank() && zoneId.isNotBlank()) {
            put("commune_code", communeCode)
            put("zone_id", zoneId)
            put("district_id", zoneId)
            put("district_name", sceneName)
            put("scene_name", sceneName)
            put("scene_source", sceneSource)
            sceneLongitude?.let { put("longitude", it) }
            sceneLatitude?.let { put("latitude", it) }
        }
        // Selecting a scene locally does not complete the shared server onboarding.
        put("onboarding_completed", false)
    }

    companion object {
        fun normalizedBirthDate(value: String, today: LocalDate = LocalDate.now()): String? {
            if (value.isBlank()) return null
            return listOf("uuuu-MM-dd", "dd/MM/uuuu", "dd-MM-uuuu").firstNotNullOfOrNull { pattern ->
                runCatching {
                    LocalDate.parse(value.trim(), DateTimeFormatter.ofPattern(pattern).withResolverStyle(ResolverStyle.STRICT))
                        .takeIf { !it.isAfter(today) && it.year >= 1900 }?.toString()
                }.getOrNull()
            }
        }
    }
}
