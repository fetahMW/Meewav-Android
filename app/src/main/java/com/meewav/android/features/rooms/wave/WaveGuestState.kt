package com.meewav.android.features.rooms.wave

import androidx.compose.runtime.*
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import com.meewav.android.R

internal enum class WaveGuestLocation(val label: String) {
    REQUESTED("Candidature"), INVITED("Invitation acceptée"), BACKSTAGE("Prêt en coulisses"), STAGE("Sur scène")
}

internal data class WaveGuest(
    val id: String, val name: String, val role: String, val portrait: Int,
    val location: WaveGuestLocation, val mic: Boolean = true, val camera: Boolean = true,
    val appeared: Boolean = false,
    // Declared format of the local demo source; replace with RTC publication dimensions when connected.
    val sourceAspectRatio: Float = 9f / 16f,
    val gradeLevel: Int = 1,
    val latencyMs: Int? = null,
)

/** Native demo room state. No RTC or Supabase success is inferred from a local move. */
internal class WaveGuestState {
    var composition by mutableStateOf(WaveComposition.ENSEMBLE)
    var primaryId by mutableStateOf("host")
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
    var guests by mutableStateOf(initialGuests.mapIndexed { index, guest ->
        guest.copy(gradeLevel = index % 6 + 1, latencyMs = listOf(35, 65, 110, 48)[index % 4])
    })
        private set
    var filters by mutableStateOf(WaveGuestFilters())
    val availableInvites get() = (initialGuests + listOf(
        WaveGuest("noam", "NOAM A.", "Producteur", R.drawable.wave_chat_artist_8, WaveGuestLocation.INVITED),
        WaveGuest("lina", "LINA V.", "Rappeuse", R.drawable.wave_chat_artist_9, WaveGuestLocation.INVITED),
    )).filter { candidate -> guests.none { it.id == candidate.id } }
    var selected by mutableStateOf(setOf<String>())
    var previewId by mutableStateOf<String?>(null)
    var notice by mutableStateOf<String?>(null)
    var dragId by mutableStateOf<String?>(null)
        private set
    var dragPoint by mutableStateOf(Offset.Zero)
        private set
    var stageBounds = Rect.Zero
    var backstageBounds = Rect.Zero
    val onStage get() = guests.filter { it.location == WaveGuestLocation.STAGE }
    val dragged get() = guests.find { it.id == dragId }
    val overStage get() = dragId != null && stageBounds.contains(dragPoint)
    val overBackstage get() = dragId != null && backstageBounds.contains(dragPoint)
    val canDrop get() = when (dragged?.location) {
        WaveGuestLocation.BACKSTAGE -> overStage && onStage.size < 3
        WaveGuestLocation.STAGE -> overBackstage
        else -> false
    }

    fun beginDrag(id: String, point: Offset) { dragId = id; dragPoint = point }
    fun moveDrag(delta: Offset) { dragPoint += delta }
    fun cancelDrag() { dragId = null }
    fun finishDrag() {
        val guest = dragged
        if (guest != null) {
            if (guest.location == WaveGuestLocation.BACKSTAGE && overStage) move(setOf(guest.id), WaveGuestLocation.STAGE)
            else if (guest.location == WaveGuestLocation.STAGE && overBackstage) move(setOf(guest.id), WaveGuestLocation.BACKSTAGE)
        }
        cancelDrag()
    }

    fun move(ids: Set<String>, target: WaveGuestLocation) {
        val matching = guests.filter { it.id in ids }
        val allowed = matching.filter { guest -> when (target) {
            WaveGuestLocation.STAGE -> guest.location == WaveGuestLocation.BACKSTAGE
            WaveGuestLocation.BACKSTAGE -> guest.location == WaveGuestLocation.STAGE || guest.location == WaveGuestLocation.INVITED
            WaveGuestLocation.INVITED -> guest.location == WaveGuestLocation.REQUESTED || guest.location == WaveGuestLocation.BACKSTAGE
            WaveGuestLocation.REQUESTED -> false
        } }
        if (allowed.isEmpty()) return
        if (target == WaveGuestLocation.STAGE && onStage.size + allowed.size > 3) {
            notice = "Scène complète · 3 invités maximum"
            return
        }
        val moving = allowed.map { it.id }.toSet()
        guests = guests.map { if (it.id in moving) it.copy(location = target, appeared = it.appeared || target == WaveGuestLocation.STAGE) else it }
        selected = emptySet()
        notice = when (target) {
            WaveGuestLocation.STAGE -> "${allowed.size} invité(s) sur scène"
            WaveGuestLocation.BACKSTAGE -> "${allowed.size} invité(s) en coulisses"
            else -> "Invitation acceptée · préparation disponible"
        }
    }
    fun toggleMic(id: String) { guests = guests.map { if (it.id == id) it.copy(mic = !it.mic) else it } }
    fun toggleCamera(id: String) { guests = guests.map { if (it.id == id) it.copy(camera = !it.camera) else it } }
    fun remove(ids: Set<String>) {
        guests = guests.filterNot { it.id in ids }; selected = emptySet()
        if (previewId in ids) previewId = null
        notice = "Invité retiré de la démo"
    }
    fun invite(guest: WaveGuest) {
        if (guests.none { it.id == guest.id }) guests = guests + guest.copy(location = WaveGuestLocation.INVITED)
        notice = "Invitation ajoutée à la démo"
    }
}
