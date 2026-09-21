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
    var remoteRoomId: String? = null
    var remoteAction: ((String, JSONObject) -> Unit)? = null
    var remoteBusy by mutableStateOf(false)
    private var floorRequests = emptyMap<String,String>()
    private var participationIds = emptyMap<String,String>()
    private var applicationsOpen = true
    private fun remote(name:String,args:JSONObject):Boolean {
        if(remoteRoomId==null)return false
        if(remoteBusy) {notice="Enregistrement en cours…";return true}
        remoteAction?.invoke(name,args)?:run{notice="Connexion en cours…"}
        return true
    }
    fun setHands(open:Boolean) { if(!remote("rooms_classe_set_hands_open_v1",JSONObject().put("p_room_id",remoteRoomId).put("p_hands_open",open)))handsOpen=open }
    fun setQuestions(open:Boolean) { if(!remote("rooms_classe_configure_v1",JSONObject().put("p_room_id",remoteRoomId).put("p_applications_open",applicationsOpen).put("p_questions_open",open)))questionsOpen=open }
    fun beginRemote(roomId:String) {
        guests.remoteMode=true
        remoteRoomId=roomId;hands=emptyList();questions=emptyList();resources=emptyList();speakerId=null
        guests.replaceRemoteGuests(emptyList())
        guests.remoteRequests={open->remote("rooms_classe_configure_v1",JSONObject().put("p_room_id",roomId).put("p_applications_open",open).put("p_questions_open",questionsOpen))}
        guests.remoteRefuse={ids->
            val selected=ids.mapNotNull{participationIds[it]}
            if(selected.size==ids.size&&selected.isNotEmpty())remote("rooms_classe_reject_applications_v1",JSONObject().put("p_room_id",roomId).put("p_participation_ids",JSONArray(selected)))
        }
        guests.remoteMove={ids,target->moveRemote(ids,target)}
        guests.remoteRemove={ids->
            val selected=ids.mapNotNull{participationIds[it]}
            if(selected.size==ids.size&&selected.isNotEmpty())remote("rooms_classe_remove_participants_v1",JSONObject().put("p_room_id",roomId).put("p_participation_ids",JSONArray(selected)).put("p_ban",false))
        }
        guests.remoteInvite={person->
            if(runCatching{UUID.fromString(person.id)}.isSuccess)remote("rooms_classe_invite_v1",JSONObject().put("p_room_id",roomId).put("p_user_ids",JSONArray().put(person.id)).put("p_client_request_id",UUID.randomUUID().toString()))
            else notice="Sélectionne un compte réel pour envoyer une invitation."
        }
    }
    private fun moveRemote(ids:Set<String>,target:WaveGuestLocation) {
        val people=guests.guests.filter{it.id in ids}
        val selected=ids.mapNotNull{participationIds[it]}
        if(selected.size!=ids.size||selected.isEmpty())return
        val args=JSONObject().put("p_room_id",remoteRoomId).put("p_participation_ids",JSONArray(selected))
        when {
            target==WaveGuestLocation.STAGE->remote("rooms_classe_set_stage_v1",args.put("p_onstage",true))
            target==WaveGuestLocation.BACKSTAGE&&people.all{it.location==WaveGuestLocation.STAGE}->remote("rooms_classe_set_stage_v1",args.put("p_onstage",false))
            target==WaveGuestLocation.BACKSTAGE&&people.all{it.location==WaveGuestLocation.REQUESTED}->remote("rooms_classe_accept_applications_v1",args)
            else->notice="Sélectionne des candidatures à accepter ou des élèves admis à déplacer."
        }
    }
    fun detachRemoteGuests(){guests.remoteMove=null;guests.remoteRemove=null;guests.remoteInvite=null;guests.remoteRequests=null;guests.remoteRefuse=null;remoteAction=null}
    fun acceptRemote(data:JSONObject) {
        val settings=data.getJSONObject("room")
        title=settings.getString("title");handsOpen=settings.optBoolean("hands_open");questionsOpen=settings.optBoolean("questions_open");applicationsOpen=settings.optBoolean("applications_open")
        guests.acceptRemoteRequests(applicationsOpen)
        fun rows(key:String):List<JSONObject> {val a=data.optJSONArray(key)?:return emptyList();return (0 until a.length()).map{a.getJSONObject(it)}}
        val roster=listOf("applications" to WaveGuestLocation.REQUESTED,"invitations" to WaveGuestLocation.INVITED,"backstage" to WaveGuestLocation.BACKSTAGE,"onstage" to WaveGuestLocation.STAGE).flatMap{(key,location)->rows(key).map{row->val u=row.getJSONObject("user");WaveGuest(u.getString("user_id"),u.optString("username","Artiste"),u.optString("artist_type"),android.R.drawable.ic_menu_myplaces,location,mic=false,camera=false,demoVideo="",latencyMs=null,avatarUrl=u.optString("avatar_url").takeUnless{it=="null"}.orEmpty())}}
        participationIds=listOf("applications","invitations","backstage","onstage").flatMap{rows(it)}.associate{it.getJSONObject("user").getString("user_id") to it.getString("id")}
        guests.replaceRemoteGuests(roster)
        val floor=rows("floor_requests")
        floorRequests=floor.associate{it.getJSONObject("user").getString("user_id") to it.getString("id")}
        hands=floor.filter{it.optString("status")=="requested"}.map{ClasseHand(it.getJSONObject("user").getString("user_id"),it.optString("reason"))}
        val nextSpeaker=floor.firstOrNull{it.optString("status")=="granted"}?.getJSONObject("user")?.getString("user_id")
        if(speakerId!=nextSpeaker){guests.releaseAudioFloor(speakerId);speakerId=nextSpeaker;speakingSince=System.currentTimeMillis()}
        nextSpeaker?.let{guests.grantAudioFloor(it)}
        questions=rows("questions").map{ClasseQuestion(it.getString("id"),it.getJSONObject("user").getString("user_id"),it.getString("body"),it.optInt("like_count"),it.optBoolean("current_user_has_liked"))}
    }
    private val prefs = context.getSharedPreferences("classe-resources-" + scope.hashCode(), Context.MODE_PRIVATE)
    val capacity = 24
    var tab by mutableIntStateOf(0)
    var title by mutableStateOf("Voix & Mix — Session 1")
    var resources by mutableStateOf(emptyList<ClasseResource>()); private set
    var selectedStudent by mutableStateOf<String?>(null)
    var excluded by mutableStateOf(emptySet<String>())
    var switchRoster by mutableStateOf<Set<String>?>(null)
    val students get() = guests.guests.filter { (switchRoster==null || it.id in switchRoster!!) && it.id !in excluded && it.canParticipate && it.location in setOf(WaveGuestLocation.BACKSTAGE, WaveGuestLocation.STAGE) }.take(capacity)
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
    fun addResources(items: List<ClasseResource>) { if(remoteRoomId!=null){notice="Le transfert des ressources du cours nécessite encore son raccordement.";return}; resources = resources + items; saveResources() }
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
        if(remoteRoomId!=null){val request=floorRequests[id];if(request==null){notice="Cet élève doit demander la parole avant d’activer son micro.";return};remote("rooms_classe_grant_floor_v1",JSONObject().put("p_request_id",request));return}

        val person = students.find { it.id == id && it.connected } ?: run { notice = "Cet élève n’est pas disponible."; return }
        if (hands.none { it.studentId == id }) { inviteFloor(id); return }
        releaseFloor()
        if (!guests.grantAudioFloor(id)) { notice = "Cet élève n’est pas disponible."; return }
        speakerId = id; speakingSince = System.currentTimeMillis(); invitedToSpeak = invitedToSpeak - id
        guests.mixerGuestId = id
    }
    fun releaseFloor() {
        if(remoteRoomId!=null){val request=floorRequests[speakerId]?:return;remote("rooms_classe_release_floor_v1",JSONObject().put("p_request_id",request));return}

        speakerId?.let { id -> hands = hands.filterNot { it.studentId == id }; guests.releaseAudioFloor(id) }
        speakerId = null; speakingSince = 0
    }
    fun syncStudents() {
        if (speakerId != null && students.none { it.id == speakerId && it.connected }) releaseFloor()
        if (students.none { it.id == selectedStudent }) selectedStudent = null
    }
    fun dismissHand(id: String) { if(remoteRoomId!=null){val request=floorRequests[id]?:return;remote("rooms_classe_dismiss_floor_v1",JSONObject().put("p_request_id",request));return}; if (speakerId == id) releaseFloor(); hands = hands.filterNot { it.studentId == id } }
    fun lowerAllHands() { hands = hands.filter { it.studentId == speakerId } }
    fun banStudent(id: String) {
        if(remoteRoomId!=null){val participation=participationIds[id]?:return;remote("rooms_classe_remove_participants_v1",JSONObject().put("p_room_id",remoteRoomId).put("p_participation_ids",JSONArray().put(participation)).put("p_ban",true).put("p_reason","host_removed"));return}

        if (students.none { it.id == id }) return
        dismissHand(id)
        excluded = excluded + id
        invitedToSpeak = invitedToSpeak - id
        understanding = understanding - id
        questions = questions.filterNot { it.studentId == id }
        selectedStudent = null
        guests.banFromClasse(id)
    }
    fun submitQuestion(id: String, text: String) {
        if (!questionsOpen || text.isBlank() || students.none { it.id == id }) return
        if (questions.any { it.studentId == id && it.resolution == null }) {
            notice = "Cet élève a déjà une question en attente."
            return
        }
        questions = questions + ClasseQuestion(studentId = id, text = text.trim().take(1000))
    }
    fun likeQuestion(id: String) { questions = questions.map { if (it.id == id) it.copy(likes = (it.likes + if (it.liked) -1 else 1).coerceAtLeast(0), liked = !it.liked) else it } }
    fun resolveQuestion(id: String, answered: Boolean) { if(remote("rooms_classe_resolve_question_v1",JSONObject().put("p_question_id",id).put("p_resolution",if(answered)"answered" else "dismissed")))return; questions = questions.map { if (it.id == id) it.copy(resolution = if (answered) "Répondue" else "Écartée") else it } }
    fun toggleUnderstanding() { if(remoteRoomId!=null){notice="Le sondage de compréhension nécessite encore son raccordement.";return}; understandingActive = !understandingActive; understanding = emptyMap() }
    fun respond(id: String, response: ClasseUnderstanding) { if (understandingActive && students.any { it.id == id }) understanding = understanding + (id to response) }
}
