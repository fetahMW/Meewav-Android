package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class RoomsAudioPolicyTest {
    private val host = RoomsAudioMember("host", "host", "onstage")
    private fun local(id: String) = RoomsAudioIdentity("room", "channel", id, "host", listOf(host, RoomsAudioMember(id, "viewer", null)))
    @Test fun `viewer hears host and only onstage guests`() {
        assertTrue(RoomsAudioPolicy.receive(local("viewer"), host))
        assertTrue(RoomsAudioPolicy.receive(local("viewer"), RoomsAudioMember("guest", "guest", "onstage")))
        for (stage in listOf(null, "requested", "ready", "backstage"))
            assertFalse(RoomsAudioPolicy.receive(local("viewer"), RoomsAudioMember("guest", "guest", stage)))
    }
    @Test fun `host hears prepared guests but never unknown roles or itself`() {
        assertFalse(RoomsAudioPolicy.receive(local("host"), host))
        for (stage in listOf("ready", "backstage", "onstage"))
            assertTrue(RoomsAudioPolicy.receive(local("host"), RoomsAudioMember("guest", "guest", stage)))
        assertFalse(RoomsAudioPolicy.receive(local("host"), RoomsAudioMember("stranger", "unknown", "onstage")))
        assertFalse(RoomsAudioPolicy.receive(local("host"), RoomsAudioMember("guest", "guest", null)))
    }
    @Test fun `guest cannot publish without authoritative readiness`() {
        assertFalse(local("guest").canPublish)
        assertTrue(local("host").canPublish)
        assertTrue(local("guest").copy(members = listOf(RoomsAudioMember("guest", "guest", "ready"))).canPublish)
    }
    @Test fun `subscription targets stream ID rather than assuming it equals user ID`() {
        assertEquals(setOf("opaque-stream"), RoomsAudioPolicy.subscriptions(local("viewer"), mapOf("opaque-stream" to "host", "unknown-stream" to "unknown")))
        assertFalse(RoomsAudioPolicy.receive(local("viewer").copy(members = listOf(host)), host))
    }
}
