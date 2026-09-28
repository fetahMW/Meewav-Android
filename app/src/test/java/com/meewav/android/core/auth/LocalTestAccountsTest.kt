package com.meewav.android.core.auth

import org.junit.Assert.*
import org.junit.Test

class LocalTestAccountsTest {
    private val url = "https://qa.example.test"
    private val config = """{"version":1,"enabled":true,"supabaseUrl":"$url","accounts":[
        {"alias":"testeur2","id":"12345678-1234-1234-1234-123456789abc","email":"qa@example.test","password":"local-test-password"}]}"""

    @Test fun releaseAlwaysIgnoresLocalCredentials() {
        assertTrue(LocalTestAccounts.parse(config, false, url).isEmpty())
    }
    @Test fun disabledOrOtherProjectCannotEnableShortcut() {
        assertTrue(LocalTestAccounts.parse(config.replace("true", "false"), true, url).isEmpty())
        assertTrue(LocalTestAccounts.parse(config, true, "https://other.example.test").isEmpty())
    }
    @Test fun onlyDedicatedIdentitiesAreAccepted() {
        assertEquals("testeur2", LocalTestAccounts.parse(config, true, url).single().alias)
        assertEquals("testeur1", LocalTestAccounts.parse(config.replace("testeur2", "testeur1"), true, url).single().alias)
        assertTrue(LocalTestAccounts.parse(config.replace("testeur2", "puf"), true, url).isEmpty())
        assertTrue(LocalTestAccounts.parse(config.replace("12345678-1234-1234-1234-123456789abc", ""), true, url).isEmpty())
    }
    @Test fun invalidConfigFailsClosedAndCredentialsAreNotPrinted() {
        assertTrue(LocalTestAccounts.parse("{", true, url).isEmpty())
        assertFalse(LocalTestAccounts.parse(config, true, url).single().toString().contains("local-test-password"))
    }
}
