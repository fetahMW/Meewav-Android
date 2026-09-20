package com.meewav.android.features.rooms.wave

import android.content.Context
import androidx.compose.runtime.*
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

internal data class ClasseResource(val id: String = UUID.randomUUID().toString(), val title: String, val uri: String, val mime: String)
internal data class ClasseQuestion(val id: String = UUID.randomUUID().toString(), val studentId: String, val text: String, val likes: Int = 0, val liked: Boolean = false, val created: Long = System.currentTimeMillis(), val resolution: String? = null)
internal data class ClasseHand(val studentId: String, val reason: String, val created: Long = System.currentTimeMillis())
internal enum class ClasseUnderstanding(val label: String) { UNDERSTOOD("Compris"), PARTIAL("Partiellement"), LOST("Pas compris") }

/** Port of ClasseSessionViewModel. This room entry is the local investor demonstration. */
internal class ClasseToolsState(context: Context, val guests: WaveGuestState, scope: String) {
    private val prefs = context.getSharedPreferences("classe-resources-" + scope.hashCode(), Context.MODE_PRIVATE)
    var tab by mutableIntStateOf(0)
    var title by mutableStateOf("Voix & Mix — Session 1")
    var resources by mutableStateOf(emptyList<ClasseResource>()); private set
    var selectedStudent by mutableStateOf<String?>(null)
    var excluded by mutableStateOf(emptySet<String>())
    val students get() = guests.guests.filter { it.id !in excluded && it.canParticipate && it.location in setOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) }.take(24)
    var handsOpen by mutableStateOf(true)
    var questionsOpen by mutableStateOf(true)
    var hands by mutableStateOf(listOf(ClasseHand("naya", "Comment régler le gain sans saturer ?"), ClasseHand("solen", "Je voudrais essayer la compression."), ClasseHand("demo-BACKSTAGE-5", "Je peux faire écouter mon essai ?"), ClasseHand("demo-BACKSTAGE-10", "Une question sur le placement du micro."), ClasseHand("demo-BACKSTAGE-15", "Je voudrais refaire l’exercice."), ClasseHand("demo-BACKSTAGE-18", "Comment doser la réverbération ?"))); private set
    var questions by mutableStateOf(listOf(ClasseQuestion(studentId = "keo", text = "Faut-il placer le de-esser avant ou après le compresseur ?", likes = 8), ClasseQuestion(studentId = "azur", text = "Comment garder une voix naturelle avec l’autotune ?", likes = 5), ClasseQuestion(studentId = "demo-BACKSTAGE-1", text = "Quel niveau garder avant le mastering ?", likes = 4), ClasseQuestion(studentId = "demo-BACKSTAGE-8", text = "Comment éliminer les résonances sans affiner la voix ?", likes = 3), ClasseQuestion(studentId = "demo-BACKSTAGE-15", text = "Peut-on entendre le signal avant et après traitement ?", likes = 2))); private set
    val rankedQuestions get() = questions.filter { it.resolution == null }.sortedWith(compareByDescending<ClasseQuestion> { it.likes }.thenByDescending { it.created })
    var speakerId by mutableStateOf<String?>(null); private set
    var speakingSince by mutableLongStateOf(0L); private set
    var understandingActive by mutableStateOf(false); private set
    var understanding by mutableStateOf(emptyMap<String, ClasseUnderstanding>()); private set
    var invitedToSpeak by mutableStateOf(emptySet<String>()); private set
    var notice by mutableStateOf<String?>(null)
    init {
        runCatching {
            val array = JSONArray(prefs.getString("resources", "[]"))
            resources = (0 until array.length()).map { i -> val r = array.getJSONObject(i); ClasseResource(r.getString("id"), r.getString("title"), r.getString("uri"), r.getString("mime")) }
        }.onFailure { notice = "Les ressources enregistrées n’ont pas pu être chargées." }
    }
    fun addResources(items: List<ClasseResource>) { resources = resources + items; saveResources() }
    fun deleteResource(id: String) { resources = resources.filterNot { it.id == id }; saveResources() }
    private fun saveResources() {
        val array = JSONArray().apply { resources.forEach { put(JSONObject().put("id", it.id).put("title", it.title).put("uri", it.uri).put("mime", it.mime)) } }
        prefs.edit().putString("resources", array.toString()).apply()
    }
    fun requestFloor(id: String, reason: String) {
        if (!handsOpen || students.none { it.id == id } || reason.isBlank()) return
        hands = hands.filterNot { it.studentId == id } + ClasseHand(id, reason.trim().take(160))
    }
    fun inviteFloor(id: String) { invitedToSpeak = if (id in invitedToSpeak) invitedToSpeak - id else invitedToSpeak + id }
    fun grantFloor(id: String) {
        val person = students.find { it.id == id && it.connected } ?: run { notice = "Cet élève n’est pas disponible."; return }
        if (hands.none { it.studentId == id }) { inviteFloor(id); return }
        if (person.location != WaveGuestLocation.STAGE && guests.onStage.size >= 3) { notice = "Redescends un invité pour libérer une place sur scène."; return }
        releaseFloor()
        guests.move(setOf(id), WaveGuestLocation.STAGE)
        if (!person.mic) guests.toggleMic(id)
        speakerId = id; speakingSince = System.currentTimeMillis(); invitedToSpeak = invitedToSpeak - id
        guests.mixerGuestId = id
    }
    fun releaseFloor() {
        speakerId?.let { id -> hands = hands.filterNot { it.studentId == id }; guests.move(setOf(id), WaveGuestLocation.BACKSTAGE) }
        speakerId = null; speakingSince = 0
    }
    fun syncStudents() {
        excluded = excluded.filter { id -> guests.guests.none { it.id == id && it.location in setOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) } }.toSet()
        if (speakerId != null && guests.onStage.none { it.id == speakerId }) { hands = hands.filterNot { it.studentId == speakerId }; speakerId = null; speakingSince = 0 }
        if (students.none { it.id == selectedStudent }) selectedStudent = null
    }
    fun dismissHand(id: String) { if (speakerId == id) releaseFloor(); hands = hands.filterNot { it.studentId == id } }
    fun lowerAllHands() { hands = hands.filter { it.studentId == speakerId } }
    fun removeStudent(id: String) { dismissHand(id); excluded = excluded + id; selectedStudent = null; guests.move(setOf(id), WaveGuestLocation.REQUESTED) }
    fun submitQuestion(id: String, text: String) {
        if (!questionsOpen || text.isBlank()) return
        if (questions.any { it.studentId == id && it.resolution == null }) {
            notice = "Cet élève a déjà une question en attente."
            return
        }
        questions = questions + ClasseQuestion(studentId = id, text = text.trim().take(1000))
    }
    fun likeQuestion(id: String) { questions = questions.map { if (it.id == id) it.copy(likes = (it.likes + if (it.liked) -1 else 1).coerceAtLeast(0), liked = !it.liked) else it } }
    fun resolveQuestion(id: String, answered: Boolean) { questions = questions.map { if (it.id == id) it.copy(resolution = if (answered) "Répondue" else "Écartée") else it } }
    fun toggleUnderstanding() { understandingActive = !understandingActive; understanding = emptyMap() }
    fun respond(id: String, response: ClasseUnderstanding) { if (understandingActive) understanding = understanding + (id to response) }
}
