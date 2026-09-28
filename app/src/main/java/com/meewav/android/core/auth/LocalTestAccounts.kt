package com.meewav.android.core.auth

import java.io.File
import kotlinx.serialization.json.*

/** Explicit local QA setup only. No credentials in assets, BuildConfig, intents or logs. */
class LocalTestAccount(val alias: String, val id: String, val email: String, val password: String)

object LocalTestAccounts {
    fun read(file: File, debug: Boolean, supabaseUrl: String): List<LocalTestAccount> {
        if (!debug || !file.isFile || file.length() > 65536) return emptyList()
        return runCatching { parse(file.readText(), debug, supabaseUrl) }.getOrDefault(emptyList())
    }

    fun parse(text: String, debug: Boolean, supabaseUrl: String): List<LocalTestAccount> {
        if (!debug) return emptyList()
        return runCatching {
            val config = Json.parseToJsonElement(text).jsonObject
            require(config["version"]?.jsonPrimitive?.intOrNull == 1)
            require(config["enabled"]?.jsonPrimitive?.booleanOrNull == true)
            require(supabaseUrl.startsWith("https://") &&
                config["supabaseUrl"]?.jsonPrimitive?.content?.trimEnd('/') == supabaseUrl.trimEnd('/'))
            val accounts = config.getValue("accounts").jsonArray.map { item ->
                val data = item.jsonObject
                LocalTestAccount(data.getValue("alias").jsonPrimitive.content,
                    data.getValue("id").jsonPrimitive.content,
                    data.getValue("email").jsonPrimitive.content,
                    data.getValue("password").jsonPrimitive.content).also {
                    require(it.alias in setOf("redmi", "windows"))
                    require(it.id.matches(Regex("[a-fA-F0-9-]{36}")))
                    require('@' in it.email && it.password.length >= 12)
                }
            }
            require(accounts.size in 1..2 && accounts.distinctBy { it.alias }.size == accounts.size)
            accounts
        }.getOrDefault(emptyList())
    }
}
