package com.meewav.android.core.auth

import java.net.URI
import java.net.URLDecoder

object AuthPolicy {
    const val SIGNUP_REDIRECT = "meewav-android://auth-callback/signup"
    const val RECOVERY_REDIRECT = "meewav-android://auth-callback/recovery"
    const val OAUTH_REDIRECT = "meewav-android://auth-callback/oauth"

    fun emailError(email: String): String? =
        if (Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(email.trim())) null
        else "Entre une adresse e-mail valide."

    fun signupError(name: String, email: String, password: String, confirmation: String): String? = when {
        name.trim().codePointCount(0, name.trim().length) < 3 -> "Choisis un nom d’utilisateur d’au moins 3 caractères."
        name.trim().codePointCount(0, name.trim().length) > 20 -> "Le nom d’utilisateur est limité à 20 caractères."
        emailError(email) != null -> emailError(email)
        password.length < 6 -> "Choisis un mot de passe d’au moins 6 caractères."
        password != confirmation -> "Les mots de passe ne correspondent pas."
        else -> null
    }

    fun configurationAvailable(url: String, key: String): Boolean = runCatching {
        val uri = URI(url)
        uri.scheme == "https" && !uri.host.isNullOrBlank() && uri.userInfo == null &&
            uri.query == null && uri.fragment == null && key.startsWith("sb_publishable_") &&
            key.length > "sb_publishable_".length
    }.getOrDefault(false)

    data class Callback(val code: String, val recovery: Boolean)

    /** Only PKCE codes on our exact callback are accepted, never tokens in a fragment. */
    fun callback(raw: String): Callback? = runCatching {
        val uri = URI(raw)
        if (uri.scheme != "meewav-android" || uri.host != "auth-callback" ||
            uri.port != -1 || uri.userInfo != null || uri.fragment != null ||
            uri.path !in setOf("/signup", "/recovery", "/oauth")) return null
        val parameters = uri.rawQuery.orEmpty().split("&").map {
            val pair = it.split("=", limit = 2)
            URLDecoder.decode(pair[0], "UTF-8") to URLDecoder.decode(pair.getOrElse(1) { "" }, "UTF-8")
        }
        if (parameters.any { it.first == "error" }) return null
        val codes = parameters.filter { it.first == "code" }
        val code = codes.singleOrNull()?.second ?: return null
        if (code.isBlank() || code.length > 4096) return null
        Callback(code, uri.path == "/recovery")
    }.getOrNull()
}
