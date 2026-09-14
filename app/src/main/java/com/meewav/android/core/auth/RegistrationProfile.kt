package com.meewav.android.core.auth

import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.ResolverStyle

/** Mirrors AuthSignUpPayload and SupabaseAuthService.metadata in the native iOS client. */
data class RegistrationProfile(
    val username: String,
    val avatarIcon: String,
    val avatarName: String,
    val realArtist: Boolean,
    val birthDate: String,
    val city: String,
    val postalCode: String,
    val country: String,
) {
    fun metadata() = buildJsonObject {
        put("username", username.trim())
        put("artist_type", if (realArtist) "REEL" else "IA")
        put("avatar_url", avatarIcon)
        put("avatar_name", avatarName)
        normalizedBirthDate(birthDate)?.let { put("birth_date", it) }
        put("city", city.trim())
        postalCode.trim().takeIf { it.isNotEmpty() }?.let { put("postal_code", it) }
        put("country", country.trim())
        put("is_ghost_mode", true)
        put("show_on_public_profile", false)
        // Shared Web onboarding still needs a resolved musical scene and profile completion.
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
