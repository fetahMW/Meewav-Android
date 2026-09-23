package com.meewav.android.features.rooms.wave

import android.content.Context
import com.meewav.android.BuildConfig
import com.meewav.android.app.MeewavApplication
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

internal data class RoomsAudioMember(val identity: String, val role: String, val stage: String?)
internal data class RoomsAudioIdentity(val roomId: String, val channel: String, val identity: String,
    val host: String, val members: List<RoomsAudioMember>) {
    val local get() = members.firstOrNull { it.identity == identity }
    val canPublish get() = identity == host || local?.let { it.role == "guest" && it.stage in setOf("ready", "backstage", "onstage") } == true
}
internal object RoomsAudioPolicy {
    fun receive(local: RoomsAudioIdentity, remote: RoomsAudioMember): Boolean = when {
        local.identity != local.host && local.local?.role !in setOf("guest", "viewer") -> false
        remote.identity == local.identity -> false
        remote.identity == local.host -> true
        remote.role != "guest" -> false
        local.identity == local.host -> remote.stage in setOf("ready", "backstage", "onstage")
        else -> remote.stage == "onstage"
    }
    fun subscriptions(local: RoomsAudioIdentity, streams: Map<String, String>): Set<String> = streams.filterValues { identity ->
        local.members.firstOrNull { it.identity == identity }?.let { receive(local, it) } == true
    }.keys
}
internal data class RoomsAudioToken(val appId: String, val token: String, val expiresAt: String)

/** Rooms contract shared with iOS. Never consumes messaging-call-token or a demo identity. */
internal class RoomsAudioRepository(context: Context, val roomId: String) {
    private val auth = (context.applicationContext as MeewavApplication).authRepository
    init { require(UUID.fromString(roomId).toString().equals(roomId, true)) { "Identifiant de room réel requis" } }
    private fun identity(): String = auth.auth.currentUserOrNull()?.id?.lowercase()
        ?: error("Connecte-toi pour accéder au live")
    private suspend fun request(path: String, method: String = "GET", body: JSONObject? = null): String = withContext(Dispatchers.IO) {
        val session = auth.auth.currentSessionOrNull() ?: error("Session Supabase absente")
        val connection = URL(BuildConfig.SUPABASE_URL.trimEnd('/') + path).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method; connection.connectTimeout = 10000; connection.readTimeout = 10000
            connection.instanceFollowRedirects = false
            connection.setRequestProperty("apikey", BuildConfig.SUPABASE_PUBLISHABLE_KEY)
            connection.setRequestProperty("Authorization", "Bearer ${session.accessToken}")
            if (body != null) {
                connection.doOutput = true; connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(body.toString().toByteArray()) }
            }
            val status = connection.responseCode
            // Never surface tokens or full server bodies in logs/UI.
            check(status in 200..299) { "Accès audio Rooms refusé (HTTP $status)" }
            connection.inputStream.bufferedReader().use { it.readText() }
        } finally { connection.disconnect() }
    }
    suspend fun resolve(joinIfMissing: Boolean = false): RoomsAudioIdentity {
        val me = identity()
        val rooms = JSONArray(request("/rest/v1/rooms_v2?id=eq.$roomId&select=id,host_id,status,type,livekit_room_name"))
        check(rooms.length() == 1) { "Room introuvable" }
        val room = rooms.getJSONObject(0)
        check(room.getString("status") != "ended") { "Cette room n’est pas active" }
        // Classe uses its own private floor grant and RTC policy, not the shared stage policy.
        check(room.getString("type") != "classe") { "Utilise la prise de parole de la Classe" }
        val channel = room.getString("livekit_room_name")
        check(channel.isNotBlank() && channel != "null") { "Canal RTC serveur absent" }
        val host = room.getString("host_id").lowercase()
        val participants = JSONArray(request("/rest/v1/room_participants_v2?room_id=eq.$roomId&left_at=is.null&select=user_id,role"))
        if (joinIfMissing && (0 until participants.length()).none { participants.getJSONObject(it).getString("user_id").equals(me, true) }) {
            // Same admission contract as iOS/Web; never overwrite an invited guest role.
            request("/rest/v1/rpc/rooms_enter_room_v2", "POST", JSONObject().put("p_room_id", roomId))
            return resolve()
        }
        val invitations = JSONArray(request("/rest/v1/room_invitations_v2?room_id=eq.$roomId&ended_at=is.null&select=guest_id,status&order=created_at.desc"))
        val stages = mutableMapOf<String, String>()
        for (i in 0 until invitations.length()) invitations.getJSONObject(i).let { stages.putIfAbsent(it.getString("guest_id").lowercase(), it.getString("status")) }
        val members = (0 until participants.length()).map { i -> participants.getJSONObject(i).let {
            val id = it.getString("user_id").lowercase(); RoomsAudioMember(id, it.getString("role"), stages[id])
        } }.filter { it.identity != host } + RoomsAudioMember(host, "host", "onstage")
        check(me == host || members.any { it.identity == me }) { "Rejoins la room avant de connecter l’audio" }
        return RoomsAudioIdentity(roomId, channel, me, host, members)
    }
    suspend fun token(room: RoomsAudioIdentity, publish: Boolean): RoomsAudioToken {
        check(identity() == room.identity) { "Le compte a changé" }
        val result = JSONObject(request("/functions/v1/byteplus-token", "POST", JSONObject()
            .put("channelName", room.channel).put("identity", room.identity).put("canPublish", publish)))
        check(result.getString("identity").equals(room.identity, true)) { "Identité RTC incohérente" }
        return RoomsAudioToken(result.getString("appId"), result.getString("token"), result.getString("expiresAt"))
    }
}
