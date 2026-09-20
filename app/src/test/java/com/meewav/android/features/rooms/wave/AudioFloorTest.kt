package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class AudioFloorTest {
    @Test fun sharedClasseAndPlaceAudioGrantNeverChangesLocationsOrComposition() {
        val guests=WaveGuestState()
        guests.move(setOf("keo","solen","azur"),WaveGuestLocation.STAGE)
        val locations=guests.guests.map{it.id to it.location}
        val primary=guests.primaryId
        val composition=guests.composition
        assertTrue(guests.grantAudioFloor("naya"))
        assertEquals("naya",guests.mixerGuest?.id)
        assertTrue(guests.mixerGuest!!.mic)
        assertEquals(locations,guests.guests.map{it.id to it.location})
        guests.releaseAudioFloor("naya")
        assertFalse(guests.guests.first{it.id=="naya"}.mic)
        assertEquals(locations,guests.guests.map{it.id to it.location})
        assertEquals(primary,guests.primaryId);assertEquals(composition,guests.composition)
    }
    @Test fun releaseOfOnstageSpeakerLeavesThemOnstage() {
        val guests=WaveGuestState();guests.move(setOf("naya"),WaveGuestLocation.STAGE)
        guests.grantAudioFloor("naya");guests.releaseAudioFloor("naya")
        assertTrue(guests.onStage.any{it.id=="naya"&&!it.mic})
    }
    @Test fun requestedGuestCannotReceiveAudioFloor() {
        val guests=WaveGuestState();assertFalse(guests.grantAudioFloor("malik"));assertNull(guests.floorAudioId)
    }
}
