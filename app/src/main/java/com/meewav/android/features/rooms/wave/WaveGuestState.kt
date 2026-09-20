package com.meewav.android.features.rooms.wave

import androidx.compose.runtime.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import com.meewav.android.R

internal enum class WaveGuestLocation(val label: String) {
    REQUESTED("Demande"), INVITED("En préparation"), BACKSTAGE("Prêt en coulisses"), STAGE("Sur scène"), JURY("Jury")
}
internal enum class GuestOrigin { CANDIDATURE, INVITATION }
internal enum class GuestInvitation { NONE, PENDING, ACCEPTED, DECLINED }

internal data class WaveGuest(
    val id: String, val name: String, val role: String, val portrait: Int,
    val location: WaveGuestLocation, val mic: Boolean = true, val camera: Boolean = true,
    val appeared: Boolean = false,
    // Declared format of the local demo source; replace with RTC publication dimensions when connected.
    val demoVideo: String = waveGuestDemoVideo(id),
    val sourceAspectRatio: Float = if (demoVideo.contains("portrait-")) 9f / 16f else 16f / 9f,
    val gradeLevel: Int = 1,
    val latencyMs: Int? = null,
    val connected: Boolean = true,
    val origin: GuestOrigin = GuestOrigin.CANDIDATURE,
    val invitation: GuestInvitation = GuestInvitation.NONE,
    val cageVictories: Int = 0,
)

internal val WaveGuest.canParticipate get() = invitation !in setOf(GuestInvitation.PENDING, GuestInvitation.DECLINED)
internal val WaveGuest.originLabel get() = if (origin == GuestOrigin.CANDIDATURE) "Candidature" else when(invitation) {
    GuestInvitation.PENDING -> "Invité · En attente"
    GuestInvitation.DECLINED -> "Invité · Déclinée"
    else -> "Invité · Acceptée"
}

internal val WaveGuest.healthLabel: String get() = when {
    !connected -> "Connexion perdue"
    latencyMs == null -> "Signal inconnu"
    latencyMs > 160 -> "Signal faible · ${latencyMs} ms"
    latencyMs > 80 -> "Latence · ${latencyMs} ms"
    !mic -> "Micro coupé"
    !camera -> "Caméra coupée"
    appeared -> "Déjà passé"
    else -> "Prêt à monter"
}

/** Native demo room state. No RTC or Supabase success is inferred from a local move. */
internal class WaveGuestState(private val cageDemo: Boolean = false, private val classeDemo: Boolean = false) {
    private fun roomVideo(guest: WaveGuest) = if (cageDemo) guest.copy(demoVideo = cageGuestDemoVideo(guest.id), sourceAspectRatio = 9f / 16f,
        connected = if (guest.location == WaveGuestLocation.BACKSTAGE) true else guest.connected,
        mic = if (guest.location == WaveGuestLocation.BACKSTAGE) true else guest.mic,
        camera = if (guest.location == WaveGuestLocation.BACKSTAGE) true else guest.camera) else guest
    var guestPage by mutableIntStateOf(0)
    var composition by mutableStateOf(WaveComposition.ENSEMBLE)
    var requestsOpen by mutableStateOf(true)
        private set
    fun toggleRequests() {
        requestsOpen = !requestsOpen
        notice = if (requestsOpen) "Demandes ouvertes · démo locale" else "Demandes fermées · les demandes reçues restent disponibles"
    }
    var primaryId by mutableStateOf("host")
    var mixerGuestId by mutableStateOf<String?>(null)
    private var mixerGains by mutableStateOf(mapOf<String, Float>())
    val mixerGuest get() = onStage.find { it.id == mixerGuestId }
    fun guestGain(id: String) = mixerGains[id] ?: .62f
    fun setGuestGain(id: String, gain: Float) { mixerGains = mixerGains + (id to gain.coerceIn(0f, 1f)) }
    val resolvedPrimaryId get() = primaryId.takeIf { id -> id == "host" || onStage.any { it.id == id } } ?: "host"
    private val initialGuests = listOf(
        WaveGuest("naya", "NAYA K.", "Rappeuse", R.drawable.wave_chat_artist_0, WaveGuestLocation.BACKSTAGE),
        WaveGuest("keo", "KÉO", "Chanteur", R.drawable.wave_chat_artist_1, WaveGuestLocation.BACKSTAGE),
        WaveGuest("solen", "SOLEN", "Productrice", R.drawable.wave_chat_artist_2, WaveGuestLocation.BACKSTAGE),
        WaveGuest("azur", "AZUR", "Compositeur", R.drawable.wave_chat_artist_3, WaveGuestLocation.BACKSTAGE),
        WaveGuest("lorns", "LORNS", "Guitariste", R.drawable.wave_chat_artist_4, WaveGuestLocation.INVITED),
        WaveGuest("yuna", "YUNA", "Chanteuse", R.drawable.wave_chat_artist_5, WaveGuestLocation.INVITED),
        WaveGuest("malik", "MALIK NOX", "Auteur", R.drawable.wave_chat_artist_6, WaveGuestLocation.REQUESTED),
        WaveGuest("alya", "ALYA FLOW", "Productrice", R.drawable.wave_chat_artist_7, WaveGuestLocation.REQUESTED),
    )
    private val extraNames = listOf("LINA V.", "NOAM A.", "Ruby Resonance", "Neon Pulse", "JUNE VELVET", "KORA N.", "AMIRA SEN", "YASSA GROOVE")
    private fun demoGuest(index: Int, location: WaveGuestLocation): WaveGuest {
        val source = initialGuests[index % initialGuests.size]
        return source.copy(id = "demo-${location.name}-$index", name = extraNames[index % extraNames.size] + if (index >= 8) " · ${index / 8 + 1}" else "",
            location = location, gradeLevel = index % 6 + 1, latencyMs = listOf(32, 58, 210, 125, 45, 68)[index % 6],
            connected = index % 9 != 2, mic = index % 7 != 3, camera = index % 8 != 4)
    }
    var guests by mutableStateOf((initialGuests.mapIndexed { index, guest ->
        guest.copy(gradeLevel = index % 6 + 1, latencyMs = listOf(35, 65, 110, 48)[index % 4],
            origin = if (index in 4..5) GuestOrigin.INVITATION else GuestOrigin.CANDIDATURE,
            invitation = if (index == 4) GuestInvitation.PENDING else if (index == 5) GuestInvitation.ACCEPTED else GuestInvitation.NONE)
    } + List(20) { demoGuest(it, WaveGuestLocation.BACKSTAGE) } + List(38) { demoGuest(it, WaveGuestLocation.REQUESTED) }).map(::roomVideo).let { if (classeDemo) classeDemoPortraits(it) else it })
        private set
    var filters by mutableStateOf(WaveGuestFilters())
    val availableInvites get() = (initialGuests + listOf(
        WaveGuest("noam", "NOAM A.", "Producteur", R.drawable.wave_chat_artist_8, WaveGuestLocation.INVITED),
        WaveGuest("lina", "LINA V.", "Rappeuse", R.drawable.wave_chat_artist_9, WaveGuestLocation.INVITED),
    )).filter { candidate -> guests.none { it.id == candidate.id } }
    var selected by mutableStateOf(setOf<String>())
    var previewId by mutableStateOf<String?>(null)
    var profilePreviewId by mutableStateOf<String?>(null)
    var externalProfile by mutableStateOf<WaveGuest?>(null)
        private set
    fun openArtistProfile(artist: String) {
        val guest = guests.firstOrNull { it.name.equals(artist, ignoreCase = true) }
            ?: WaveGuest("wave-artist-$artist", artist, "Artiste", when (artist) {
                "LUMA" -> R.drawable.wave_artist_luma
                "NOAM A." -> R.drawable.wave_chat_artist_8
                "LINA V." -> R.drawable.wave_chat_artist_9
                else -> R.drawable.wave_chat_artist_4
            }, WaveGuestLocation.REQUESTED)
        externalProfile = guest
        previewId = null
        profilePreviewId = guest.id
    }
    var messageRecipientIds by mutableStateOf<Set<String>>(emptySet())
    var notice by mutableStateOf<String?>(null)
    var dragId by mutableStateOf<String?>(null)
        private set
    var dragPoint by mutableStateOf(Offset.Zero)
        private set
    var stageBounds = Rect.Zero
    var backstageBounds = Rect.Zero
    val jury get() = guests.filter { it.location == WaveGuestLocation.JURY }
    val onStage get() = guests.filter { it.location == WaveGuestLocation.STAGE }
    val dragged get() = guests.find { it.id == dragId }
    val overStage get() = dragId != null && stageBounds.contains(dragPoint)
    val overBackstage get() = dragId != null && backstageBounds.contains(dragPoint)
    val canDrop get() = when (dragged?.location) {
        WaveGuestLocation.BACKSTAGE -> overStage && onStage.size < 3 && dragged?.connected == true
        WaveGuestLocation.STAGE -> overBackstage
        else -> false
    }

    fun beginDrag(id: String, point: Offset) { dragId = id; dragPoint = point }
    fun moveDrag(delta: Offset) { dragPoint += delta }
    fun cancelDrag() { dragId = null }
    fun finishDrag() {
        val guest = dragged
        if (guest != null) {
            if (guest.location == WaveGuestLocation.BACKSTAGE && overStage) {
                move(setOf(guest.id), WaveGuestLocation.STAGE)
                if (onStage.any { it.id == guest.id }) mixerGuestId = guest.id
            } else if (guest.location == WaveGuestLocation.STAGE && overBackstage) {
                move(setOf(guest.id), WaveGuestLocation.BACKSTAGE)
                if (onStage.none { it.id == guest.id }) {
                    guestPage = 0
                    if (mixerGuestId == guest.id) mixerGuestId = null
                }
            }
        }
        cancelDrag()
    }

    private val classeBannedIds = mutableSetOf<String>()
    fun banFromClasse(id: String) {
        if (!classeDemo) return
        classeBannedIds += id
        remove(setOf(id))
        if (mixerGuestId == id) mixerGuestId = null
        if (profilePreviewId == id) profilePreviewId = null
        if (dragId == id) cancelDrag()
        notice = null
    }
    fun move(ids: Set<String>, target: WaveGuestLocation) {
        val matching = guests.filter { it.id in ids && it.canParticipate && it.id !in classeBannedIds }
        val allowed = matching.filter { guest -> when (target) {
            WaveGuestLocation.STAGE -> guest.location == WaveGuestLocation.BACKSTAGE
            WaveGuestLocation.JURY -> guest.location != WaveGuestLocation.JURY
            WaveGuestLocation.BACKSTAGE -> guest.location == WaveGuestLocation.JURY || guest.location == WaveGuestLocation.STAGE || guest.location == WaveGuestLocation.INVITED || guest.location == WaveGuestLocation.REQUESTED
            WaveGuestLocation.INVITED -> guest.location == WaveGuestLocation.REQUESTED || guest.location == WaveGuestLocation.BACKSTAGE
            WaveGuestLocation.REQUESTED -> guest.location == WaveGuestLocation.BACKSTAGE || guest.location == WaveGuestLocation.INVITED
        } }
        if (allowed.isEmpty()) return
        if (target == WaveGuestLocation.STAGE && allowed.any { !it.connected }) {
            notice = "Connexion perdue · attendre la reconnexion avant de monter sur scène"
            return
        }
        if (target == WaveGuestLocation.STAGE && onStage.size + allowed.size > 3) {
            notice = "Scène complète · 3 invités maximum"
            return
        }
        if (target == WaveGuestLocation.JURY && jury.size + allowed.size > 6) {
            notice = "Jury complet · 6 personnes maximum"
            return
        }
        if (classeDemo && target == WaveGuestLocation.BACKSTAGE) {
            val seated = guests.count { it.canParticipate && it.location in setOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) }
            val arrivals = allowed.count { it.location !in setOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) }
            if (seated + arrivals > 24) { notice = "Classe complète · 24 places maximum"; return }
        }
        val moving = allowed.map { it.id }.toSet()
        guests = guests.map { if (it.id in moving) it.copy(location = target, appeared = it.appeared || target == WaveGuestLocation.STAGE) else it }
        selected = emptySet()
        notice = when (target) {
            WaveGuestLocation.JURY -> "${allowed.size} membre(s) ajouté(s) au jury · ${jury.size}/6"
            WaveGuestLocation.STAGE -> "${allowed.size} invité(s) sur scène"
            WaveGuestLocation.BACKSTAGE -> "${allowed.size} invité(s) en coulisses"
            WaveGuestLocation.REQUESTED -> "${allowed.size} invité(s) renvoyé(s) dans les demandes"
            else -> "Invitation acceptée · préparation disponible"
        }
    }
    /** Atomic program handoff used only by La Scène. Backstage is the completed preparation gate. */
    fun transitionScenePassage(incoming: Set<String>, outgoing: Set<String>): Boolean {
        val candidates = incoming.map { id -> guests.find { it.id == id } ?: return false }
        if (candidates.any { !it.connected || !it.canParticipate || it.location !in setOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) }) return false
        val remaining = (onStage.map { it.id }.toSet() - outgoing) + incoming
        if (remaining.size > 3) return false
        guests = guests.map { person -> when {
            person.id in incoming -> person.copy(location = WaveGuestLocation.STAGE, appeared = true)
            person.id in outgoing && person.location == WaveGuestLocation.STAGE -> person.copy(location = WaveGuestLocation.BACKSTAGE)
            else -> person
        } }
        if (mixerGuestId in outgoing && mixerGuestId !in incoming) mixerGuestId = null
        if (dragId in incoming || dragId in outgoing) cancelDrag()
        selected = emptySet()
        primaryId = incoming.firstOrNull() ?: "host"
        composition = if (incoming.size == 1 && remaining.size == 1) WaveComposition.FOCUS else WaveComposition.ENSEMBLE
        return true
    }
    fun addSceneDemoPeople(people: List<WaveGuest>) {
        guests = people.filter { incoming -> guests.none { it.id == incoming.id } } + guests
    }
    fun toggleMic(id: String) { guests = guests.map { if (it.id == id) it.copy(mic = !it.mic) else it } }
    fun awardCageVictory(id: String) { guests = guests.map { if (it.id == id) it.copy(cageVictories = it.cageVictories + 1) else it } }
    fun clearCageVictories() { guests = guests.map { it.copy(cageVictories = 0) } }
    fun demoReconnect(id: String) { guests = guests.map { if (it.id == id && it.canParticipate) it.copy(connected = true, latencyMs = 45) else it } }
    var privateDemoMessages by mutableStateOf<Map<String, List<String>>>(emptyMap())
        private set
    fun addPrivateDemoMessage(ids: Set<String>, text: String) {
        val content = text.trim().take(1000)
        if (content.isEmpty()) return
        val recipients = guests.filter { it.id in ids }
        privateDemoMessages = privateDemoMessages.toMutableMap().apply {
            recipients.forEach { put(it.id, (get(it.id).orEmpty() + content).takeLast(30)) }
        }
        notice = "Message enregistré pour ${recipients.size} invité(s) · démo locale"
    }
    fun refuseRequests(ids: Set<String>) {
        val refused = guests.filter { it.id in ids && it.location in setOf(WaveGuestLocation.REQUESTED, WaveGuestLocation.INVITED) }
        if (refused.isEmpty()) return
        val refusedIds = refused.map { it.id }.toSet()
        guests = guests.filterNot { it.id in refusedIds }
        selected = emptySet()
        if (previewId in refusedIds) previewId = null
        notice = "${refused.size} demande(s) refusée(s) · démo locale"
    }
    fun toggleCamera(id: String) { guests = guests.map { if (it.id == id) it.copy(camera = !it.camera) else it } }
    fun remove(ids: Set<String>) {
        guests = guests.filterNot { it.id in ids }; selected = emptySet()
        if (previewId in ids) previewId = null
        notice = "Invité retiré de la démo"
    }
    fun invite(guest: WaveGuest) {
        if (guest.id in classeBannedIds) { notice = "Cet artiste est banni de cette classe."; return }
        if (guests.none { it.id == guest.id }) guests = guests + roomVideo(guest.copy(location = WaveGuestLocation.INVITED,
            origin = GuestOrigin.INVITATION, invitation = GuestInvitation.PENDING, connected = false))
        notice = "Invitation ajoutée à la démo"
    }
    fun reserveProgramInvite(id: String, name: String) {
        if (guests.none { it.id == id }) invite(WaveGuest(id, name, "Artiste", R.drawable.wave_chat_artist_0, WaveGuestLocation.INVITED))
    }
    fun demoInvitationResponse(id: String, accepted: Boolean) {
        guests = guests.map { if (it.id == id && it.invitation == GuestInvitation.PENDING)
            it.copy(invitation = if (accepted) GuestInvitation.ACCEPTED else GuestInvitation.DECLINED, connected = accepted) else it }
    }
}
