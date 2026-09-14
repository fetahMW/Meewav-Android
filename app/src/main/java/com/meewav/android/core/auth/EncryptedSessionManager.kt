package com.meewav.android.core.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import io.github.jan.supabase.auth.SessionManager
import io.github.jan.supabase.auth.user.UserSession
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** The session is encrypted by a non-exportable Android Keystore key; never backed up. */
class EncryptedSessionManager(context: Context) : SessionManager {
    private val preferences = context.getSharedPreferences("meewav_auth", Context.MODE_PRIVATE)
    private val mutex = Mutex()
    private val json = Json { ignoreUnknownKeys = true }
    private val alias = "meewav.auth.session.v1"

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(alias, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").apply {
            init(KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build())
        }.generateKey()
    }

    override suspend fun saveSession(session: UserSession) = withContext(Dispatchers.IO) {
        mutex.withLock {
            val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply { init(Cipher.ENCRYPT_MODE, key()) }
            val encrypted = cipher.doFinal(json.encodeToString(session).toByteArray(Charsets.UTF_8))
            check(preferences.edit().putString("session", Base64.encodeToString(cipher.iv + encrypted, Base64.NO_WRAP)).commit())
        }
    }

    override suspend fun loadSession(): UserSession? = withContext(Dispatchers.IO) {
        mutex.withLock {
            val stored = preferences.getString("session", null) ?: return@withLock null
            try {
                val bytes = Base64.decode(stored, Base64.NO_WRAP)
                require(bytes.size > 28)
                val cipher = Cipher.getInstance("AES/GCM/NoPadding").apply {
                    init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, bytes.copyOfRange(0, 12)))
                }
                json.decodeFromString<UserSession>(cipher.doFinal(bytes.copyOfRange(12, bytes.size)).toString(Charsets.UTF_8))
            } catch (_: Exception) {
                // Restored/corrupt data cannot resurrect an account or expose its tokens.
                preferences.edit().remove("session").commit()
                null
            }
        }
    }

    override suspend fun deleteSession() = withContext(Dispatchers.IO) {
        mutex.withLock { check(preferences.edit().remove("session").commit()) }
    }
}
