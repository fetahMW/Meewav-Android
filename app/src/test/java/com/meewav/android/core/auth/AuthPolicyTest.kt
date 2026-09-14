package com.meewav.android.core.auth

import org.junit.Assert.*
import org.junit.Test

class AuthPolicyTest {
    @Test fun `configuration refuses cleartext and privileged keys`() {
        assertTrue(AuthPolicy.configurationAvailable("https://example.supabase.co", "sb_publishable_example"))
        assertFalse(AuthPolicy.configurationAvailable("http://example.supabase.co", "sb_publishable_example"))
        assertFalse(AuthPolicy.configurationAvailable("https://example.supabase.co", "sb_secret_example"))
        assertFalse(AuthPolicy.configurationAvailable("https://user:password@example.supabase.co", "sb_publishable_example"))
        assertFalse(AuthPolicy.configurationAvailable("https://example.supabase.co?token=x", "sb_publishable_example"))
        assertFalse(AuthPolicy.configurationAvailable("", ""))
    }

    @Test fun `only exact owned PKCE redirects are accepted`() {
        assertEquals(AuthPolicy.Callback("one-time-code", true), AuthPolicy.callback("meewav-android://auth-callback/recovery?code=one-time-code"))
        assertEquals(AuthPolicy.Callback("code", false), AuthPolicy.callback("meewav-android://auth-callback/signup?code=code"))
        listOf(
            "https://auth-callback/recovery?code=x",
            "meewav-android://auth-callback.example/recovery?code=x",
            "meewav-android://attacker@auth-callback/recovery?code=x",
            "meewav-android://auth-callback:123/recovery?code=x",
            "meewav-android://auth-callback/elsewhere?code=x",
            "meewav-android://auth-callback/recovery?code=x&code=y",
            "meewav-android://auth-callback/recovery?code=x&error=access_denied",
            "meewav-android://auth-callback/recovery#access_token=token",
            "meewav-android://auth-callback/recovery?code=",
            "malformed link",
        ).forEach { assertNull(it, AuthPolicy.callback(it)) }
    }

    @Test fun `signup follows existing six character policy and checks confirmation`() {
        assertNull(AuthPolicy.signupError("Artiste", " artiste@example.org ", "abcdef", "abcdef"))
        assertNotNull(AuthPolicy.signupError("Artiste", "artiste@example.org", "abcde", "abcde"))
        assertNotNull(AuthPolicy.signupError("Artiste", "artiste@example.org", "abcdef", "different"))
        assertNotNull(AuthPolicy.signupError("", "artiste@example.org", "abcdef", "abcdef"))
        assertNotNull(AuthPolicy.signupError("a".repeat(21), "artiste@example.org", "abcdef", "abcdef"))
        assertNotNull(AuthPolicy.signupError("Artiste", "not an email", "abcdef", "abcdef"))
    }
}
