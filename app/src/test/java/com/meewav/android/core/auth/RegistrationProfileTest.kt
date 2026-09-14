package com.meewav.android.core.auth

import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.jsonPrimitive
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate

class RegistrationProfileTest {
    @Test fun `mobile metadata preserves iOS identity without inventing a location or publishing the profile`() {
        val data = RegistrationProfile(" Artiste ", "ViolonIcon", "Violoniste", true,
            "12/05/1998", " Lyon ", "", " France ").metadata()
        assertEquals("Artiste", data["username"]?.jsonPrimitive?.content)
        assertEquals("ViolonIcon", data["avatar_url"]?.jsonPrimitive?.content)
        assertEquals("Violoniste", data["avatar_name"]?.jsonPrimitive?.content)
        assertEquals("REEL", data["artist_type"]?.jsonPrimitive?.content)
        assertEquals("1998-05-12", data["birth_date"]?.jsonPrimitive?.content)
        assertEquals("Lyon", data["city"]?.jsonPrimitive?.content)
        assertTrue(data.getValue("is_ghost_mode").jsonPrimitive.boolean)
        assertFalse(data.getValue("show_on_public_profile").jsonPrimitive.boolean)
        assertFalse(data.getValue("onboarding_completed").jsonPrimitive.boolean)
        listOf("latitude", "longitude", "street", "postal_code", "terms_accepted").forEach { assertFalse(data.containsKey(it)) }
    }

    @Test fun `AI choice and optional fields keep the same backend vocabulary`() {
        val data = RegistrationProfile("Musique", "MicroIcon", "Artiste", false,
            "", "Paris", "75011", "France").metadata()
        assertEquals("IA", data["artist_type"]?.jsonPrimitive?.content)
        assertEquals("75011", data["postal_code"]?.jsonPrimitive?.content)
        assertFalse(data.containsKey("birth_date"))
    }

    @Test fun `birth dates reject impossible and future dates instead of silently normalizing them`() {
        val today = LocalDate.of(2026, 9, 14)
        assertEquals("2000-02-29", RegistrationProfile.normalizedBirthDate("29/02/2000", today))
        assertEquals("2000-02-29", RegistrationProfile.normalizedBirthDate("2000-02-29", today))
        assertEquals("2000-02-29", RegistrationProfile.normalizedBirthDate("29-02-2000", today))
        listOf("29/02/2001", "31/04/2000", "2027-01-01", "date inconnue", "", "01/01/0099").forEach {
            assertNull(it, RegistrationProfile.normalizedBirthDate(it, today))
        }
    }
}
