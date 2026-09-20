package com.meewav.android.features.rooms.wave

import kotlinx.coroutines.Dispatchers
import org.junit.Assert.*
import org.junit.Test

class CageToolsStateTest {
    @Test fun eightBackstageArtistsCompleteOpenMicBattleWithoutLeavingTheProgramme() {
        CageToolsState(WaveGuestState(cageDemo = true), { 0L }, Dispatchers.Unconfined, false, simulationPassageSeconds = 2).use { s ->
            s.chooseFormat(CageFormat.CHALLENGER); s.changeCapacity(8)
            s.addParticipants(s.guests.guests.filter { it.location == WaveGuestLocation.BACKSTAGE }.take(8).map { it.id }.toSet())
            s.advance(); s.advance()
            repeat(7) {
                perform(s)
                assertEquals(2, s.guests.onStage.size)
                assertEquals(2_000L, s.remainingMs)
                assertNull(s.artistAttentionId)
                resolve(s)
            }
            assertTrue(s.finished)
        }
    }
    @Test fun pendingInvitationStaysInRegieAndCanArriveWithoutOpeningGuestSheet() {
        CageToolsState(WaveGuestState(cageDemo = true), { 0L }, Dispatchers.Unconfined, false).use { s ->
            s.chooseFormat(CageFormat.CHALLENGER); s.addParticipants(setOf("lorns", "naya"))
            s.advance(); s.advance(); s.advance()
            assertEquals("Appel", s.phase); assertTrue(s.commandHint.contains("LORNS"))
            s.advance(); assertEquals(1, s.page); assertNull(s.artistAttentionId); assertNull(s.guests.previewId)
            s.guests.demoInvitationResponse("lorns", true); s.guests.demoReconnect("lorns")
            s.guests.move(setOf("lorns"), WaveGuestLocation.BACKSTAGE)
            s.advance(); assertEquals("Sur scène", s.phase); assertEquals(2, s.guests.onStage.size)
        }
    }

    @Test fun backstageAdmissionDoesNotRecheckManualMicrophoneOrCameraSwitches() {
        session(CageFormat.CHALLENGER, 2).use { s ->
            val id = s.roster.first()
            s.guests.toggleCamera(id); s.guests.toggleMic(id)
            s.advance()
            assertEquals("Sur scène", s.phase); assertEquals(2, s.guests.onStage.size)
            assertNull(s.artistAttentionId); assertFalse(s.clockRunning)
            s.advance(); assertTrue(s.clockRunning); assertFalse(s.microphoneOpen(id))
        }
    }
    @Test fun automaticOpenMicSelectionExcludesUnpreparedGuests() {
        CageToolsState(WaveGuestState(), { 0L }, Dispatchers.Unconfined, false).use { s ->
            s.applyProgram(CageProgram(format = CageFormat.OPEN_MIC, capacity = 8, rosterMode = "first-eligible"))
            s.advance(); s.advance()
            assertEquals(8, s.roster.size)
            assertTrue(s.roster.all { s.person(it)!!.let { guest -> guest.connected && guest.mic && guest.camera && guest.canParticipate } })
            s.advance(); assertTrue(s.ready()); assertEquals(2, s.guests.onStage.size)
        }
    }
    @Test fun battleCrownCountsValidatedWinsAndSurvivesTheNextChallenger() {
        session(CageFormat.CHALLENGER, 4).use { s ->
            val champion = s.roster.first()
            perform(s); resolve(s)
            assertEquals(1, s.person(champion)!!.cageVictories)
            s.verdict(champion); assertEquals(1, s.person(champion)!!.cageVictories)
            assertEquals(listOf(champion), s.guests.onStage.map { it.id })
            perform(s); assertEquals(2, s.guests.onStage.size); resolve(s)
            assertEquals(2, s.person(champion)!!.cageVictories)
            s.reset(); assertEquals(0, s.person(champion)!!.cageVictories)
        }
    }
    @Test fun openMicKeepsTheResultVisibleThenReplacesBothArtists() {
        session(CageFormat.OPEN_MIC, 4).use { s ->
            val firstPair = setOf(s.roster[0], s.roster[1])
            perform(s); resolve(s)
            assertEquals(firstPair, s.guests.onStage.map { it.id }.toSet())
            assertEquals(1, s.person(s.roster[0])!!.cageVictories)
            s.advance()
            assertEquals(s.roster.drop(2).toSet(), s.guests.onStage.map { it.id }.toSet())
        }
    }
    @Test fun microphoneFollowsTheTurnWithoutChangingReadiness() {
        session(CageFormat.TOURNAMENT, 2).use { s ->
            s.advance()
            val a = s.active!!.a; val b = s.active!!.b!!
            assertFalse(s.microphoneOpen(a)); assertFalse(s.microphoneOpen(b))
            s.advance()
            assertTrue(s.microphoneOpen(a)); assertFalse(s.microphoneOpen(b))
            assertEquals(0f, s.microphoneGain(b))
            s.guests.setGuestGain(a, .3f); assertEquals(.3f, s.microphoneGain(a))
            s.guests.toggleMic(a); assertFalse(s.microphoneOpen(a)); s.guests.toggleMic(a)
            s.pause(); assertFalse(s.microphoneOpen(a)); s.advance(); assertTrue(s.microphoneOpen(a))
            s.advance(); assertFalse(s.microphoneOpen(a)); assertFalse(s.microphoneOpen(b))
            assertTrue(s.ready()); s.advance()
            assertFalse(s.microphoneOpen(a)); assertTrue(s.microphoneOpen(b))
            s.report("Incident audio"); assertFalse(s.microphoneOpen(b)); s.advance(); s.advance()
            assertTrue(s.microphoneOpen(b)); s.advance(); assertFalse(s.microphoneOpen(b))
            s.advance(); assertTrue(s.voteOpen)
            assertFalse(s.microphoneOpen(a)); assertFalse(s.microphoneOpen(b))
        }
    }
    @Test fun onlyExplicitSimultaneousModeOpensBothMicrophones() {
        session(CageFormat.TOURNAMENT, 2).use { s ->
            s.reset(); s.configure(90, 1, "Simultané"); s.advance(); s.advance()
            s.advance(); s.advance()
            assertTrue(s.microphoneOpen(s.active!!.a)); assertTrue(s.microphoneOpen(s.active!!.b!!))
        }
    }
    @Test fun twoSecondWorkshopOverridePreservesSavedRulesAndClosesAudioAtDeadline() {
        var time = 0L
        CageToolsState(WaveGuestState(), { time }, Dispatchers.Unconfined, false, simulationPassageSeconds = 2).use { s ->
            s.applyProgram(CageProgram(roster = listOf("naya", "keo"), passage = 180))
            s.advance(); s.advance(); s.advance(); s.advance()
            assertEquals(2_000L, s.remainingMs); assertEquals(180, s.program().passage)
            assertTrue(s.microphoneOpen("naya"))
            time = 2_001L; assertFalse(s.microphoneOpen("naya"))
            s.nextStep(); assertEquals(2_000L, s.remainingMs)
            s.start(); assertTrue(s.microphoneOpen("keo")); assertFalse(s.microphoneOpen("naya"))
        }
    }
    private fun session(format: CageFormat, size: Int): CageToolsState {
        val guests = WaveGuestState()
        val state = CageToolsState(guests, { 1000L }, Dispatchers.Unconfined, false)
        state.changeCapacity(size)
        state.roster.toList().forEach(state::select)
        guests.guests.filter { it.canParticipate && it.connected && it.mic && it.camera }.take(size).forEach { state.select(it.id) }
        assertEquals(size, state.roster.size)
        state.chooseFormat(format)
        state.advance(); state.advance()
        assertTrue(state.locked)
        return state
    }
    private fun perform(s: CageToolsState) {
        s.advance(); assertEquals("Sur scène", s.phase)
        repeat(s.steps.size) { s.advance(); assertTrue(s.clockRunning); s.advance() }
        assertEquals("Prêt au vote", s.phase)
        s.advance()
    }
    private fun resolve(s: CageToolsState) {
        assertTrue(s.voteOpen)
        s.ballot("viewer", "A", false)
        s.advance(); s.advance()
        s.advance(); assertTrue(s.active!!.completed)
    }
    @Test fun tournamentsReachOneChampionIncludingByesAnd32Artists() {
        for (n in listOf(2, 3, 4, 5, 8, 16, 32)) session(CageFormat.TOURNAMENT, n).use { s ->
            var played = 0
            while (!s.finished && played < n) { perform(s); resolve(s); played++ }
            assertTrue("Tournament $n stuck: ${s.phase}", s.finished)
            assertEquals(n - 1, played)
            assertEquals(1, s.matches.count { it.round == s.currentRound })
        }
    }
    @Test fun leaguePlaysEveryPairOnce() { session(CageFormat.LEAGUE, 8).use { s ->
        assertEquals(28, s.matches.size)
        assertEquals(28, s.matches.map { setOf(it.a, it.b) }.toSet().size)
        repeat(28) { perform(s); resolve(s) }; assertTrue(s.finished)
    } }
    @Test fun battleRetainsWinnerAndCallsNextChallenger() { session(CageFormat.CHALLENGER, 4).use { s ->
        repeat(3) { perform(s); resolve(s); assertEquals(listOf(s.active!!.winner), s.guests.onStage.map { it.id }) }
        assertTrue(s.finished)
    } }
    @Test fun openMicPlaysTwoSuccessiveDuels() { session(CageFormat.OPEN_MIC, 4).use { s ->
        assertEquals(2, s.matches.size); assertTrue(s.matches.all { it.b != null });
        repeat(2) { perform(s); resolve(s) }; assertTrue(s.finished)
    } }
    @Test fun emptyVotesRetryAndTiesReplayWithoutChoosingWinner() { session(CageFormat.TOURNAMENT, 2).use { s ->
        perform(s); s.advance(); s.advance(); s.advance(); assertTrue(s.voteOpen)
        s.ballot("one", "A", false); s.ballot("two", "B", false)
        s.advance(); s.advance(); s.verdict(s.active!!.a); assertFalse(s.active!!.completed)
        s.advance(); assertEquals("Sur scène", s.phase); assertTrue(s.publicBallots.isEmpty())
    } }
    @Test fun incidentAndNotReadyCannotStartTimer() { session(CageFormat.TOURNAMENT, 2).use { s ->
        s.advance(); s.advance()
        s.report("Audio"); assertFalse(s.clockRunning); s.advance(); assertEquals("Pause", s.phase)
        s.advance(); assertTrue(s.clockRunning)
    } }
    @Test fun ballotIsDeduplicatedAndJuryEligibilityEnforced() { session(CageFormat.TOURNAMENT, 2).use { s ->
        perform(s); s.ballot("one", "A", false); s.ballot("one", "B", false)
        s.ballot("stranger", "A", true); s.ballot("bad", "C", false)
        assertEquals(mapOf("one" to "B"), s.publicBallots); assertTrue(s.juryBallots.isEmpty())
    } }
    @Test fun multipleRoundsAndSimultaneousPerformancesStayInOrder() {
        listOf("Successif", "Alterné", "Simultané").forEach { mode ->
            session(CageFormat.TOURNAMENT, 2).use { s ->
                s.reset(); s.configure(90, 3, mode); s.advance(); s.advance()
                assertEquals(if (mode == "Simultané") 3 else 6, s.steps.size)
                perform(s); resolve(s); assertTrue(s.finished)
            }
        }
    }
    @Test fun juryAndHybridNeedJuryAndRespectWeightedVerdict() { session(CageFormat.TOURNAMENT, 2).use { s ->
        s.voteConfig("Hybride", 30)
        perform(s); assertFalse(s.voteOpen)
        s.guests.move(setOf("solen"), WaveGuestLocation.JURY); s.advance(); assertTrue(s.voteOpen)
        s.ballot("public-1", "A", false); s.ballot("public-2", "A", false)
        s.ballot("solen", "B", true)
        assertEquals(50f, s.score("A")); assertEquals(50f, s.score("B"))
        s.advance(); s.advance(); s.advance(); assertEquals("Sur scène", s.phase)
    } }
    @Test fun lateVotesCannotEnterAfterDeadline() {
        var time = 0L
        CageToolsState(WaveGuestState(), { time }, Dispatchers.Unconfined, false).use { s ->
            s.addParticipants(setOf("naya", "keo"))
            s.advance(); s.advance(); perform(s)
            time = 30_001; s.ballot("late", "A", false); assertTrue(s.publicBallots.isEmpty())
        }
    }
    @Test fun newProgramStartsEmptyAndSelectionNeverMovesArtists() {
        val guests = WaveGuestState()
        CageToolsState(guests, { 0L }, Dispatchers.Unconfined, false).use { s ->
            assertTrue(s.roster.isEmpty()); s.advance(); assertTrue(s.selectionMode)
            val before = guests.guests.associate { it.id to it.location }
            s.addParticipants(setOf("malik", "alya"))
            assertEquals(before, guests.guests.associate { it.id to it.location })
            assertEquals(2, s.roster.size)
        }
    }
    @Test fun loadingInvitationsReservesPlacesButNeverAcceptsThem() {
        val guests = WaveGuestState()
        CageToolsState(guests, { 0L }, Dispatchers.Unconfined, false).use { s ->
            val p = CageProgram(title = "Battle préparé", format = CageFormat.CHALLENGER, capacity = 8,
                roster = listOf("external", "naya"), people = listOf("external" to "Artiste invité"),
                rounds = 3, passage = 180, performance = "Alterné", voteMode = "Jury", voteSeconds = 45)
            s.applyProgram(p); assertEquals("Battle préparé", s.title); assertEquals(3, s.rounds)
            assertEquals(180, s.passageSeconds); assertEquals("Jury", s.voteMode)
            s.advance(); s.advance(); s.advance()
            assertFalse(s.ready()); assertEquals(GuestInvitation.PENDING, s.person("external")!!.invitation)
            assertEquals(WaveGuestLocation.INVITED, s.person("external")!!.location)
            guests.demoInvitationResponse("external", true); guests.move(setOf("external"), WaveGuestLocation.BACKSTAGE)
            assertTrue(s.ready()); assertEquals(1, guests.guests.count { it.id == "external" })
            assertEquals(listOf("external", "naya"), p.roster)
        }
    }
    @Test fun capacityAndJuryMembershipAreRespected() {
        val guests = WaveGuestState()
        CageToolsState(guests, { 0L }, Dispatchers.Unconfined, false).use { s ->
            s.changeCapacity(2); s.addParticipants(setOf("naya", "keo", "azur")); assertTrue(s.roster.isEmpty())
            guests.move(setOf("azur"), WaveGuestLocation.JURY); s.addParticipants(setOf("naya", "azur")); assertEquals(listOf("naya"), s.roster)
        }
    }
    @Test fun openMicRequiresPairsEvenForOldNoFeedbackTemplates() {
        CageToolsState(WaveGuestState(), { 0L }, Dispatchers.Unconfined, false).use { s ->
            s.applyProgram(CageProgram(format = CageFormat.OPEN_MIC, roster = listOf("naya"), feedback = "none"))
            s.advance(); assertTrue(s.matches.isEmpty()); assertFalse(s.locked)
            s.select("keo"); s.advance(); s.advance(); perform(s)
            assertTrue(s.voteOpen); resolve(s); assertTrue(s.finished)
        }
    }
}
