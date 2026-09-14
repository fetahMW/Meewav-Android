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
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import java.io.IOException
import kotlin.time.Duration.Companion.seconds

class MeewavAuthRepository(context: Context) {
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

    suspend fun signIn(email: String, password: String) {
        auth.signInWith(Email) { this.email = email.trim(); this.password = password }
    }

    suspend fun signUp(name: String, email: String, password: String) {
        val available = checkNotNull(client).postgrest.rpc("is_profile_username_available", buildJsonObject {
            put("p_username", name.trim().lowercase())
        }).decodeAs<Boolean>()
        if (!available) throw UserMessageException("Ce nom d’utilisateur est déjà utilisé. Choisis-en un autre.")
        auth.signUpWith(Email, redirectUrl = AuthPolicy.SIGNUP_REDIRECT) {
            this.email = email.trim()
            this.password = password
            data = buildJsonObject {
                put("username", name.trim())
                // Avatar and musical scene remain pending until their native onboarding exists.
                put("onboarding_completed", false)
                put("is_ghost_mode", true)
                put("show_on_public_profile", false)
            }
        }
    }

    suspend fun requestRecovery(email: String) = auth.resetPasswordForEmail(email.trim(), redirectUrl = AuthPolicy.RECOVERY_REDIRECT)
    suspend fun updatePassword(password: String) { auth.updateUser { this.password = password } }
    suspend fun exchangeCode(code: String) { auth.exchangeCodeForSession(code) }
    suspend fun signOut() { auth.signOut(scope = SignOutScope.LOCAL) }

    class UserMessageException(message: String) : Exception(message)

    companion object {
        /** Never render raw provider payloads, URLs or credentials in UI/logs. */
        fun messageFor(error: Exception): String = when (error) {
            is UserMessageException -> error.message.orEmpty()
            is AuthRestException -> when (error.error) {
                "invalid_credentials" -> "L’adresse e-mail ou le mot de passe est incorrect."
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
