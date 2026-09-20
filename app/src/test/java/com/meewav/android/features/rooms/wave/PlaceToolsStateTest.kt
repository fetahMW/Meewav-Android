package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class PlaceToolsStateTest {
    private var now=1000L
    private fun state()=PlaceToolsState(WaveGuestState(),{null},{},{now})
    @Test fun floorOnlyAddsBackstageAndDeduplicates(){
        val s=state();assertFalse(s.joinFloor("malik"));assertTrue(s.joinFloor("naya"));s.joinFloor("naya")
        assertEquals(listOf("naya"),s.data.floor.queue)
        s.toggleFloor();assertTrue(s.joinFloor("keo")) // host may curate a closed queue
        s.nextFloor();assertEquals("naya",s.data.floor.current);assertEquals(listOf("keo"),s.data.floor.queue)
        assertFalse(s.configureFloor("Change",30));s.nextFloor();assertEquals(listOf("naya"),s.data.floor.completed)
        s.endFloor();assertNull(s.data.floor.current);assertTrue(s.configureFloor("Sujet",30))
    }
    @Test fun pausePreservesTimeAndZeroDoesNotAutoAdvance(){
        val s=state();s.joinFloor("naya");s.joinFloor("keo");s.nextFloor();now+=10_000;s.pauseFloor()
        assertEquals(50,s.data.floor.clock.remaining);now+=20_000;s.pauseFloor();assertEquals(50,s.data.floor.clock.left(now))
        now+=60_000;s.tick();assertEquals(0,s.data.floor.clock.left(now));assertEquals("naya",s.data.floor.current)
    }
    @Test fun nextSkipsRemovedGuests(){
        val s=state();s.joinFloor("naya");s.joinFloor("keo");s.guests.move(setOf("naya"),WaveGuestLocation.REQUESTED)
        s.nextFloor();assertEquals("keo",s.data.floor.current)
    }
    @Test fun clashRequiresTwoDistinctAvailablePeopleAndBothAgreements(){
        val s=state();assertFalse(s.inviteClash("Sujet","naya","naya",60,3));assertTrue(s.inviteClash("Sujet","naya","keo",60,3))
        assertFalse(s.nextClash());assertFalse(s.answerClash("azur",true));s.answerClash("naya",true);assertFalse(s.nextClash());s.answerClash("keo",true)
        assertTrue(s.nextClash());assertEquals("running",s.data.clash!!.status)
        assertTrue(s.guests.onStage.isEmpty());assertTrue(s.guests.guests.first{it.id=="naya"}.mic)
    }
    @Test fun clashAlternatesThroughEveryRound(){
        val s=state();s.inviteClash("Sujet","naya","keo",30,3);s.answerClash("naya",true);s.answerClash("keo",true);s.nextClash()
        assertEquals(0,s.data.clash!!.turn)
        repeat(5){s.nextClash()};assertEquals(3,s.data.clash!!.round);assertEquals(1,s.data.clash!!.turn)
        s.nextClash();assertEquals("ended",s.data.clash!!.status);assertFalse(s.nextClash())
    }
    @Test fun declineCancelsAndUnavailableParticipantsCannotStart(){
        val s=state();s.inviteClash("Sujet","naya","keo",60,1);s.answerClash("naya",false);assertEquals("cancelled",s.data.clash!!.status)
        s.inviteClash("Sujet","naya","keo",60,1);s.answerClash("naya",true);s.answerClash("keo",true);s.guests.move(setOf("keo"),WaveGuestLocation.REQUESTED)
        assertFalse(s.nextClash())
    }
    @Test fun challengeRequiresAcceptanceCompletionThenHostValidation(){
        val s=state();assertTrue(s.createChallenge("Une histoire","naya",60));val id=s.data.challenges.first().id
        assertFalse(s.challenge(id,"start"));assertFalse(s.challenge(id,"accept","keo"));s.challenge(id,"accept","naya");s.challenge(id,"accept","naya")
        assertEquals(1,s.data.challenges.first().accepted.size);s.challenge(id,"start");assertFalse(s.challenge(id,"validate"));assertFalse(s.challenge(id,"complete","keo"))
        s.challenge(id,"complete","naya");assertTrue(s.challenge(id,"validate"));assertEquals("done",s.data.challenges.first().status);assertFalse(s.challenge(id,"cancel"))
    }
    @Test fun sixActiveChallengesMaximumAndArchivedStateRestores(){
        var saved:String?=null;val s=PlaceToolsState(WaveGuestState(),{saved},{saved=it},{now})
        repeat(6){assertTrue(s.createChallenge("Défi $it",null,60))};assertFalse(s.createChallenge("Défi 7",null,60))
        s.challenge(s.data.challenges.first().id,"cancel");assertTrue(s.createChallenge("Nouveau",null,30))
        val restored=PlaceToolsState(WaveGuestState(),{saved},{},{now});assertEquals(s.data,restored.data)
    }
    @Test fun givingFloorTransfersMicrophoneWithoutChangingVideo(){
        val s=state();s.guests.toggleMic("naya");s.joinFloor("naya");s.joinFloor("keo")
        s.nextFloor();assertTrue(s.guests.guests.any{it.id=="naya"&&it.mic});assertEquals("naya",s.guests.mixerGuest?.id);assertTrue(s.guests.onStage.isEmpty())
        s.nextFloor();assertTrue(s.guests.guests.any{it.id=="keo"&&it.mic});assertEquals("keo",s.guests.mixerGuest?.id);assertTrue(s.guests.onStage.isEmpty())
        assertTrue(s.guests.guests.any{it.id=="naya"&&it.location==WaveGuestLocation.BACKSTAGE&&!it.mic})
        s.endFloor();assertTrue(s.guests.onStage.isEmpty());assertNull(s.guests.mixerGuestId);assertFalse(s.guests.guests.first{it.id=="keo"}.mic)
    }
    @Test fun fullStageDoesNotPreventAudioFloorOrChangeVideo(){
        val s=state();s.guests.move(setOf("keo","solen","azur"),WaveGuestLocation.STAGE);s.guests.toggleMic("naya");s.joinFloor("naya")
        val stage=s.guests.onStage.map{it.id};assertTrue(s.nextFloor());assertEquals("naya",s.data.floor.current);assertTrue(s.data.floor.queue.isEmpty());assertTrue(s.guests.mixerGuest!!.mic);assertEquals(stage,s.guests.onStage.map{it.id})
    }
    @Test fun manualRemovalEndsFloorWithoutReturningGuestToBackstage(){
        val s=state();s.joinFloor("naya");s.nextFloor();s.guests.move(setOf("naya"),WaveGuestLocation.BACKSTAGE);s.guests.move(setOf("naya"),WaveGuestLocation.REQUESTED);s.tick()
        assertNull(s.data.floor.current);assertEquals(WaveGuestLocation.REQUESTED,s.guests.guests.first{it.id=="naya"}.location)
    }
}
