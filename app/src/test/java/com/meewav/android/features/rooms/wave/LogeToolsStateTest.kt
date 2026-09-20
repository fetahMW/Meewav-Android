package com.meewav.android.features.rooms.wave

import org.junit.Assert.*
import org.junit.Test

class LogeToolsStateTest {
    private fun state()=LogeToolsState(WaveGuestState(),{null},{})
    @Test fun invitationRequiresConsentAndReturnsToBackstage() {
        val s=state();s.choose("loge-a");s.invite(5);val m=s.activeMoment!!
        s.moment(m.id,"live");assertEquals("scheduled",s.activeMoment?.status)
        s.moment(m.id,"accepted");s.moment(m.id,"live")
        assertTrue(s.guests.onStage.any{it.id=="loge-a"})
        s.moment(m.id,"completed")
        assertFalse(s.guests.onStage.any{it.id=="loge-a"});assertEquals("completed",s.data.moments.first().status)
        s.moment(m.id,"live");assertEquals("completed",s.data.moments.first().status)
    }
    @Test fun requestedGuestCannotSkipPreparation() {
        val s=state();s.choose("loge-d");s.invite(10);val id=s.activeMoment!!.id
        s.moment(id,"accepted");s.moment(id,"live")
        assertEquals("accepted",s.activeMoment?.status);assertFalse(s.guests.onStage.any{it.id=="loge-d"})
    }
    @Test fun selectingAnotherQuestionUnpinsPreviousAndAnswerClearsOverlay() {
        val s=state();s.question("q1","selected");s.question("q2","selected")
        assertEquals(1,s.data.questions.count{it.status=="selected"});assertEquals("q2",s.displayedQuestion?.id)
        assertEquals("pending",s.data.questions.first{it.id=="q1"}.status)
        s.question("q2","answered");assertNull(s.displayedQuestion)
    }
    @Test fun pollChangesVoteInsteadOfDuplicatingAndStops() {
        val s=state();s.launchPoll("On continue ?",listOf("Oui","Non"),15)
        s.demoVote(0);s.demoVote(1);assertEquals(mapOf("demo-viewer" to 1),s.data.poll?.votes)
        s.stopPoll();s.demoVote(0);assertEquals(1,s.data.poll?.votes?.get("demo-viewer"));assertNull(s.activePoll)
    }
    @Test fun invalidPollDoesNotReplaceActivePoll() {
        val s=state();s.launchPoll("On continue ?",listOf("Oui","Non"),30)
        s.launchPoll("Une autre ?",listOf("Pour","Contre"),60)
        assertEquals("On continue ?",s.data.poll?.question)
    }
    @Test fun stockReservationIsIdempotentAndCancellationRefundsOnce() {
        val s=state();val g=LogeGift("one",0,"loge-a","Lou",status="scheduled",scheduledAt=System.currentTimeMillis()+60000)
        assertTrue(s.gift(g));assertTrue(s.gift(g));assertEquals(2,s.data.stock[0])
        s.cancelGift(g.id);s.cancelGift(g.id);assertEquals(3,s.data.stock[0])
        assertEquals("cancelled",s.data.gifts.first().status)
    }
    @Test fun sentGiftCannotBeRefunded() {
        val s=state();assertTrue(s.gift(LogeGift("sent",0,"loge-a","Lou")))
        s.cancelGift("sent");assertEquals(2,s.data.stock[0]);assertEquals("sent",s.data.gifts.first().status)
    }
    @Test fun giftValidatesDateGradeAndPool() {
        val stock=listOf(3,3,3,3,3,3)
        assertNotNull(LogeRules.giftError(LogeGift("x",5,"a"),stock,3,100))
        assertNotNull(LogeRules.giftError(LogeGift("x",0,"a",status="scheduled",scheduledAt=99),stock,6,100))
        assertNotNull(LogeRules.giftError(LogeGift("x",0,pool=listOf(LogeCandidate("a","A"))),stock,6,100))
        assertNotNull(LogeRules.giftError(LogeGift("x",2,"a"),stock,6,100))
    }
    @Test fun drawFreezesPoolAndCannotBeRerolled() {
        val s=state();val pool=listOf(LogeCandidate("loge-a","Lou"),LogeCandidate("loge-b","Yanis"))
        assertTrue(s.gift(LogeGift("draw",0,status="ready",pool=pool)))
        s.startDraw("draw");val winner=s.data.gifts.first().winner
        assertTrue(winner in pool);s.startDraw("draw");assertEquals(winner,s.data.gifts.first().winner)
        s.cancelGift("draw");assertEquals("spinning",s.data.gifts.first().status)
    }
    @Test fun archiveRestoresWithoutPuttingGuestOnAir() {
        var saved:String?=null
        val s=LogeToolsState(WaveGuestState(),{saved},{saved=it});s.invite(5)
        val id=s.activeMoment!!.id;s.moment(id,"accepted");s.moment(id,"live")
        val restored=LogeToolsState(WaveGuestState(),{saved},{saved=it})
        assertEquals("accepted",restored.activeMoment?.status)
        assertFalse(restored.guests.onStage.any{it.id=="loge-a"})
    }
}
