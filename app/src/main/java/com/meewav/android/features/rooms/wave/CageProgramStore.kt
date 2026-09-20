package com.meewav.android.features.rooms.wave

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/** Account-scoped on-device library. Loading creates a session copy; templates stay unchanged. */
class CageProgramStore(context: Context, private val scope: String) {
    private val prefs = context.applicationContext.getSharedPreferences("cage-programs-v1", Context.MODE_PRIVATE)
    fun list(): JSONArray = synchronized(lock) { runCatching { JSONArray(prefs.getString(scope, "[]")) }.getOrDefault(JSONArray()) }
    fun save(entry: JSONObject): JSONObject = synchronized(lock) {
        val config = entry.getJSONObject("configuration")
        require(config.toString().length <= 80_000)
        CageProgram.decode(config) // Validate at the native boundary.
        val id = entry.optString("id").takeIf { it.isNotBlank() && it.length <= 120 } ?: UUID.randomUUID().toString()
        val saved = JSONObject(entry.toString()).put("id", id).put("updatedAt", System.currentTimeMillis())
        saved.getJSONObject("configuration").put("templateId", id)
        val all = list()
        if (!saved.has("profile")) for (i in 0 until all.length()) {
            val previous = all.getJSONObject(i)
            if (previous.optString("id") == id && previous.has("profile")) saved.put("profile", previous.getJSONObject("profile"))
        }
        val next = JSONArray().put(saved)
        for (i in 0 until all.length()) if (all.getJSONObject(i).optString("id") != id && next.length() < 100) next.put(all.getJSONObject(i))
        check(prefs.edit().putString(scope, next.toString()).commit()) { "Programme non enregistré" }
        saved
    }
    fun remove(id: String) = synchronized(lock) {
        val previous = list(); val next = JSONArray()
        for (i in 0 until previous.length()) if (previous.getJSONObject(i).optString("id") != id) next.put(previous.getJSONObject(i))
        check(prefs.edit().putString(scope, next.toString()).commit())
    }
    companion object { private val lock = Any() }
}

internal data class CageProgram(
    val title: String = "Battle Rap — Paris vs Marseille", val format: CageFormat = CageFormat.TOURNAMENT,
    val capacity: Int = 16, val rosterMode: String = "manual", val roster: List<String> = emptyList(),
    val people: List<Pair<String, String>> = emptyList(), val rounds: Int = 1, val passage: Int = 90,
    val performance: String = "Successif", val voteMode: String = "Public", val voteSeconds: Int = 60,
    val feedback: String = "scored", val tieBreak: String = "sudden-death", val templateId: String? = null,
) {
    fun json(): JSONObject = JSONObject().put("version", 1).put("title", title).put("format", format.route).put("templateId", templateId)
        .put("participantCount", capacity).put("rosterMode", rosterMode).put("rosterProfileIds", JSONArray(roster))
        .put("rosterMembers", JSONArray().also { a -> people.forEach { (id, name) -> a.put(JSONObject().put("id", id).put("name", name)) } })
        .put("rules", JSONObject().put("rounds", rounds).put("passageDurationSeconds", passage)
            .put("performanceMode", when(performance) { "Alterné" -> "alternating"; "Simultané" -> "simultaneous"; else -> "successive" })
            .put("votingMode", when(voteMode) { "Jury" -> "jury"; "Hybride" -> "mixed"; else -> "public" })
            .put("votingDurationSeconds", voteSeconds).put("openMicFeedback", feedback).put("tieBreak", tieBreak))
    companion object {
        fun decode(json: JSONObject): CageProgram {
            require(json.optInt("version") == 1)
            val format = CageFormat.entries.firstOrNull { it.route == json.optString("format") } ?: error("Format inconnu")
            val title = json.getString("title").trim(); require(title.isNotEmpty() && title.length <= 100)
            val capacity = json.getInt("participantCount"); require(capacity in (if(format == CageFormat.OPEN_MIC) 1 else 2)..64)
            val rules = json.getJSONObject("rules")
            val rounds = rules.optInt("rounds", 1); require(rounds in listOf(1, 2, 3, 5))
            val duration = rules.optInt("passageDurationSeconds", 90); require(duration in 30..1800)
            val voting = rules.optInt("votingDurationSeconds", 60); require(voting in 15..300)
            require(json.optString("rosterMode", "manual") in listOf("manual", "prepared", "random", "first-eligible"))
            require(rules.optString("openMicFeedback", "scored") in listOf("none", "scored", "appreciation"))
            require(rules.optString("tieBreak", "sudden-death") in listOf("replay", "sudden-death"))
            require(rules.optString("performanceMode", "successive") in listOf("successive", "alternating", "simultaneous"))
            require(rules.optString("votingMode", "public") in listOf("public", "jury", "mixed"))
            val ids = json.optJSONArray("rosterProfileIds") ?: JSONArray()
            val roster = (0 until ids.length()).map { ids.getString(it) }.distinct(); require(roster.size <= capacity)
            val members = json.optJSONArray("rosterMembers") ?: JSONArray()
            val people = (0 until members.length()).map { members.getJSONObject(it).let { p -> p.getString("id") to p.getString("name").take(80) } }
            require(people.size <= 64 && roster.all { it.isNotBlank() && it.length <= 120 } && people.all { it.first.isNotBlank() && it.first.length <= 120 && it.second.isNotBlank() })
            return CageProgram(title, format, capacity, json.optString("rosterMode", "manual"), roster, people, rounds, duration,
                when(rules.optString("performanceMode")) { "alternating" -> "Alterné"; "simultaneous" -> "Simultané"; else -> "Successif" },
                when(rules.optString("votingMode")) { "jury" -> "Jury"; "mixed" -> "Hybride"; else -> "Public" }, voting,
                rules.optString("openMicFeedback", "scored"), rules.optString("tieBreak", "sudden-death"), json.optString("templateId").takeIf { it.isNotBlank() && it != "null" })
        }
    }
}
