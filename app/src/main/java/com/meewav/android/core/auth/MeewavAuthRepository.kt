package com.meewav.android.core.auth

import android.content.Context
import com.meewav.android.BuildConfig
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.auth.FlowType
import io.github.jan.supabase.auth.SignOutScope
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.exception.AuthRestException
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.Apple
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive
import java.io.IOException
import kotlin.time.Duration.Companion.seconds

class MeewavAuthRepository(context: Context) {
    // Only the avatar choice survives an OAuth browser round trip. No password,
    // token, e-mail or private location is stored in this draft.
    private val draft = context.applicationContext.getSharedPreferences("onboarding_choice", Context.MODE_PRIVATE)
    val configured = AuthPolicy.configurationAvailable(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY)
    private val client = if (configured) createSupabaseClient(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY) {
        requestTimeout = 15.seconds
        install(Auth) {
            flowType = FlowType.PKCE
            scheme = "meewav-android"
            host = "auth-callback"
            sessionManager = EncryptedSessionManager(context.applicationContext)
        }
        install(Postgrest)
    } else null

    val auth get() = checkNotNull(client) { "L’authentification n’est pas configurée dans cette version." }.auth

    suspend fun signIn(identifier: String, password: String) {
        val trimmed = identifier.trim()
        val address = if (trimmed.contains('@')) trimmed else {
            checkNotNull(client).postgrest.rpc("resolve_profile_email_for_username", buildJsonObject {
                put("p_username", trimmed)
            }).decodeList<ProfileEmail>().firstOrNull()?.email?.takeIf { it.isNotBlank() }
                ?: throw UserMessageException("L’identifiant ou le mot de passe est incorrect.")
        }
        // Resolved addresses are never displayed or retained in the form state.
        auth.signInWith(Email) { this.email = address; this.password = password }
    }

    suspend fun signUp(profile: RegistrationProfile, email: String, password: String) {
        val available = checkNotNull(client).postgrest.rpc("is_profile_username_available", buildJsonObject {
            put("p_username", profile.username.trim().lowercase())
        }).decodeAs<Boolean>()
        if (!available) throw UserMessageException("Ce nom d’utilisateur est déjà utilisé. Choisis-en un autre.")
        auth.signUpWith(Email, redirectUrl = AuthPolicy.SIGNUP_REDIRECT) {
            this.email = email.trim()
            this.password = password
            data = profile.metadata()
        }
        if (auth.currentSessionOrNull() != null) completeRegistration(profile)
    }

    fun saveAvatarChoice(icon: String, real: Boolean) {
        CanonicalAvatar.forIcon(icon)
        draft.edit().putString("icon", icon).putBoolean("real", real).apply()
    }
    fun avatarChoice(): Pair<String, Boolean>? = draft.getString("icon", null)?.let { it to draft.getBoolean("real", true) }

    suspend fun ownerIdentity(): JsonObject {
        val backend = checkNotNull(client).postgrest
        val private = backend.rpc("get_my_private_profile").decodeAs<JsonObject>()
        val public = backend.from("profiles").select(io.github.jan.supabase.postgrest.query.Columns.list("avatar_style_key", "artist_type", "creator_type")) {
            filter { eq("id", checkNotNull(auth.currentUserOrNull()).id) }
        }.decodeList<JsonObject>().single()
        return JsonObject(private + public)
    }

    suspend fun completeRegistration(profile: RegistrationProfile) {
        val canonical = CanonicalAvatar.forIcon(profile.avatarIcon)
        val backend = checkNotNull(client).postgrest
        // The legacy AI/real value is kept independently from the profession.
        backend.from("profiles").update(buildJsonObject { put("artist_type", if (profile.realArtist) "REEL" else "IA") }) {
            filter { eq("id", checkNotNull(auth.currentUserOrNull()).id) }
        }
        backend.rpc("complete_onboarding", buildJsonObject {
            put("p_username", profile.username.trim().lowercase()); put("p_display_name", profile.username.trim())
            put("p_avatar_style_key", canonical.style); put("p_primary_role_key", canonical.role)
            put("p_city", profile.city.trim()); put("p_country_code", "FR")
            put("p_latitude", profile.sceneLatitude?.let { kotlinx.serialization.json.JsonPrimitive(it) } ?: JsonNull)
            put("p_longitude", profile.sceneLongitude?.let { kotlinx.serialization.json.JsonPrimitive(it) } ?: JsonNull)
            put("p_is_ghost_mode", !profile.visibleOnScene); put("p_show_on_public_profile", profile.visibleOnScene)
        })
        backend.rpc("update_my_public_discovery_profile", buildJsonObject {
            put("p_scene_name", profile.sceneName); put("p_commune_code", profile.communeCode)
            put("p_zone_id", profile.zoneId); put("p_district_name", profile.sceneName); put("p_avatar_icon_id", canonical.style)
        })
        // Update the common completion hint only after both server writes succeed.
        auth.updateUser { data = profile.metadata().let { JsonObject(it + ("onboarding_completed" to kotlinx.serialization.json.JsonPrimitive(true))) } }
        draft.edit().clear().apply()
    }

    suspend fun requestRecovery(email: String) = auth.resetPasswordForEmail(email.trim(), redirectUrl = AuthPolicy.RECOVERY_REDIRECT)
    suspend fun signInSocial(provider: SocialAuthProvider) {
        auth.awaitInitialization()
        when (provider) {
            SocialAuthProvider.Google -> auth.signInWith(Google, redirectUrl = AuthPolicy.OAUTH_REDIRECT)
            SocialAuthProvider.Apple -> auth.signInWith(Apple, redirectUrl = AuthPolicy.OAUTH_REDIRECT)
        }
    }
    suspend fun updatePassword(password: String) { auth.updateUser { this.password = password } }
    suspend fun exchangeCode(code: String) { auth.exchangeCodeForSession(code) }
    suspend fun signOut() { auth.signOut(scope = SignOutScope.LOCAL) }

    class UserMessageException(message: String) : Exception(message)

    @Serializable private data class ProfileEmail(val email: String? = null)

    companion object {
        /** Never render raw provider payloads, URLs or credentials in UI/logs. */
        fun messageFor(error: Exception): String = when (error) {
            is UserMessageException -> error.message.orEmpty()
            is AuthRestException -> when (error.error) {
                "invalid_credentials" -> "L’identifiant ou le mot de passe est incorrect."
                "email_not_confirmed" -> "Confirme ton adresse e-mail avant de te connecter."
                "user_already_exists", "email_exists" -> "Cette adresse est déjà utilisée. Essaie de te connecter."
                "weak_password" -> "Choisis un mot de passe plus solide."
                "over_email_send_rate_limit", "over_request_rate_limit" -> "Trop de demandes. Patiente un instant avant de réessayer."
                "otp_expired", "flow_state_expired", "bad_code_verifier" -> "Ce lien a expiré ou a été ouvert sur un autre appareil. Recommence depuis ce téléphone."
                else -> "La demande n’a pas abouti. Réessaie dans un instant."
            }
            is IOException -> "Connexion indisponible. Vérifie ton accès à Internet et réessaie."
            else -> "La demande n’a pas abouti. Vérifie ta connexion et réessaie."
        }
    }
}

enum class SocialAuthProvider { Google, Apple }
