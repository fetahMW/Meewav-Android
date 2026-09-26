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

internal data class RoomsAudioMember(val identity: String, val role: String, val stage: String?, val publish: Boolean? = null, val receive: Boolean? = null)
internal data class RoomsAudioIdentity(val roomId: String, val channel: String, val identity: String,
    val host: String, val members: List<RoomsAudioMember>) {
    val local get() = members.firstOrNull { it.identity == identity }
    val canPublish get() = local?.publish ?: (identity == host || local?.let { it.role == "guest" && it.stage in setOf("ready", "backstage", "onstage") } == true)
}
internal object RoomsAudioPolicy {
    fun receive(local: RoomsAudioIdentity, remote: RoomsAudioMember): Boolean = when {
        local.identity != local.host && local.local?.role !in setOf("guest", "viewer") -> false
        remote.identity == local.identity -> false
        remote.receive != null -> remote.receive
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
    private var currentToken: Pair<String, RoomsAudioToken>? = null

    suspend fun resolve(joinIfMissing: Boolean = false): RoomsAudioIdentity {
        val me = identity()
        if (joinIfMissing) {
            request("/rest/v1/rpc/rooms_enter_room_v2", "POST", JSONObject().put("p_room_id", roomId))
        }
        // Canonical server floor/stage policy. Premium access is not a microphone grant.
        val result = JSONObject(request("/functions/v1/byteplus-token", "POST", JSONObject().put("roomId", roomId)))
        check(result.getString("identity").equals(me, true) && result.getString("roomId").equals(roomId, true)) { "Identité RTC incohérente" }
        val membersJson = result.getJSONArray("members")
        val members = (0 until membersJson.length()).map { i -> membersJson.getJSONObject(i).let {
            val publish = it.getBoolean("canPublish")
            RoomsAudioMember(it.getString("identity").lowercase(), it.getString("role"),
                if (publish) "onstage" else null, publish, it.getBoolean("canReceive"))
        } }
        currentToken = me to RoomsAudioToken(result.getString("appId"), result.getString("token"), result.getString("expiresAt"))
        return RoomsAudioIdentity(roomId, result.getString("roomName"), me,
            result.getString("programAudioPublisherIdentity").lowercase(), members)
    }

    suspend fun token(room: RoomsAudioIdentity, publish: Boolean): RoomsAudioToken {
        check(identity() == room.identity) { "Le compte a changé" }
        check(!publish || room.canPublish) { "Autorisation de diffusion absente" }
        val cached = currentToken
        if (cached?.first == room.identity && java.time.Instant.parse(cached.second.expiresAt).epochSecond > java.time.Instant.now().epochSecond + 30) return cached.second
        val current = resolve()
        check(!publish || current.canPublish) { "Autorisation de diffusion retirée" }
        return checkNotNull(currentToken).second
    }
    suspend fun isHost(): Boolean {
        val rooms = JSONArray(request("/rest/v1/rooms_v2?id=eq.$roomId&select=host_id"))
        check(rooms.length() == 1) { "Room introuvable" }
        return rooms.getJSONObject(0).getString("host_id").equals(identity(), true)
    }

    suspend fun leave() {
        request("/rest/v1/rpc/rooms_leave_room_v2", "POST", JSONObject().put("p_room_id", roomId))
    }

    /** Resolve ownership again at the action, never trust a stale screen role. */
    suspend fun finishOrLeave() {
        val action = if (isHost()) "rooms_end_room_v1" else "rooms_leave_room_v2"
        request("/rest/v1/rpc/$action", "POST", JSONObject().put("p_room_id", roomId))
    }
}
