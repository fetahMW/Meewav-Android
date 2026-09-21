package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class RoomGuestsLiveTest {
    private val artist=WaveGuest("real-user","Artiste","DJ",0,WaveGuestLocation.BACKSTAGE,demoVideo="")
    @Test fun liveRosterNeverStartsWithInvestorFixtures(){
        val state=WaveGuestState(live=true)
        assertTrue(state.guests.isEmpty())
        state.addSceneDemoPeople(listOf(artist))
        assertTrue(state.guests.isEmpty())
        assertTrue(state.availableInvites.isEmpty())
    }
    @Test fun stageAndRemovalWaitForServerConfirmation(){
        val state=WaveGuestState(live=true)
        state.replaceRemoteGuests(listOf(artist))
        var calls=0
        state.remoteMove={ids,target->assertEquals(setOf(artist.id),ids);assertEquals(WaveGuestLocation.STAGE,target);calls++}
        state.remoteRemove={calls++}
        state.move(setOf(artist.id),WaveGuestLocation.STAGE)
        state.remove(setOf(artist.id))
        assertEquals(2,calls)
        assertEquals(WaveGuestLocation.BACKSTAGE,state.guests.single().location)
    }
    @Test fun disconnectedLiveControlsNeverMutateRosterLocally(){
        val state=WaveGuestState(live=true)
        state.replaceRemoteGuests(listOf(artist))
        state.move(setOf(artist.id),WaveGuestLocation.STAGE)
        state.remove(setOf(artist.id));state.toggleMic(artist.id);state.toggleCamera(artist.id)
        assertEquals(listOf(artist),state.guests)
        assertNotNull(state.notice)
    }
    @Test fun removingForcedMuteDoesNotPretendToUnmuteGuest(){
        val state=WaveGuestState(live=true)
        state.replaceRemoteGuests(listOf(artist.copy(mic=false,hostMuted=true)))
        var requested:Boolean?=null
        state.remoteMic={_,muted->requested=muted}
        state.toggleMic(artist.id)
        assertEquals(false,requested)
        assertFalse(state.guests.single().mic)
    }
    @Test fun demoRetainsItsLocalStageMechanism(){
        val state=WaveGuestState()
        assertTrue(state.guests.isNotEmpty())
        state.replaceRemoteGuests(listOf(artist))
        state.move(setOf(artist.id),WaveGuestLocation.STAGE)
        assertEquals(WaveGuestLocation.STAGE,state.guests.single().location)
    }
}
