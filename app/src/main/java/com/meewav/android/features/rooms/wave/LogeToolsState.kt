package com.meewav.android.features.rooms.wave

import android.content.Context
import androidx.compose.runtime.*
import com.meewav.android.R
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.security.SecureRandom
import java.util.UUID

@Serializable internal data class LogeQuestion(val id:String, val personId:String, val text:String, val supports:Int=0, val status:String="pending")
@Serializable internal data class LogeMoment(val id:String=UUID.randomUUID().toString(), val personId:String, val format:String="live", val status:String="scheduled", val minutes:Int=5, val startedAt:Long?=null, val file:String="", val seconds:Int=0)
@Serializable internal data class LogePoll(val question:String, val choices:List<String>, val endsAt:Long, val votes:Map<String,Int> = emptyMap())
@Serializable internal data class LogeCandidate(val id:String,val name:String)
@Serializable internal data class LogeExperience(val id:String=UUID.randomUUID().toString(),val personId:String,val type:String,val detail:String,val status:String="pending")
@Serializable internal data class LogeGift(val id:String, val code:Int, val recipientId:String="", val recipientName:String="", val title:String="", val image:String="", val status:String="sent", val scheduledAt:Long?=null, val round:String="", val pool:List<LogeCandidate> = emptyList(), val animationSeconds:Int=7, val startedAt:Long?=null, val winner:LogeCandidate?=null)
@Serializable internal data class LogeArchive(val questionsOpen:Boolean=true, val questions:List<LogeQuestion> = logeQuestions(), val moments:List<LogeMoment> = emptyList(), val poll:LogePoll?=null, val gifts:List<LogeGift> = emptyList(), val stock:List<Int> = listOf(3,3,3,1,3,1),val experiences:List<LogeExperience> = emptyList())

internal object LogeRules {
    fun mayVote(poll:LogePoll, now:Long, choice:Int) = now<poll.endsAt && choice in poll.choices.indices
    fun transition(from:String,to:String):Boolean = to in when(from) {
        "scheduled" -> setOf("accepted","declined","cancelled")
        "accepted" -> setOf("live","cancelled")
        "live" -> setOf("completed")
        else -> emptySet()
    }
    fun giftError(gift:LogeGift,stock:List<Int>,grade:Int,now:Long):String? = when {
        gift.code !in 0..5 -> "Choisis un cadeau."
        stock.getOrElse(gift.code){0}<=0 -> "Ce cadeau n’est plus disponible."
        gift.code==5 && grade<4 -> "La Certif nécessite le grade 4."
        gift.code==2 && gift.title.isBlank() -> "Donne un nom au cadeau surprise."
        gift.status !in setOf("sent","scheduled","round","ready") -> "Mode d’envoi invalide."
        gift.status=="scheduled" && (gift.scheduledAt?:0)<=now -> "Choisis une date future."
        gift.status=="round" && gift.round.isBlank() -> "Choisis une ronde."
        gift.pool.isEmpty() && gift.recipientId.isBlank() -> "Choisis un destinataire."
        gift.pool.isNotEmpty() && (gift.pool.size<2 || gift.pool.map { it.id }.distinct().size!=gift.pool.size) -> "Choisis au moins deux personnes différentes."
        gift.animationSeconds !in listOf(5,7,10) -> "Durée de tirage invalide."
        else -> null
    }
}

/** Native host workshop, matching the active web VIP/Poll/Questions/Gift routes.
 * Room identifiers are demo identifiers: no local action is presented as a server delivery. */
internal class LogeToolsState(val guests:WaveGuestState,private val load:()->String?,private val persist:(String)->Unit,private val seedDemoPeople:Boolean=true) {
    constructor(context:Context,guests:WaveGuestState,scope:String,seedDemoPeople:Boolean=true):this(guests,
        {context.getSharedPreferences("loge-tools-v1-"+scope.hashCode(),Context.MODE_PRIVATE).getString("state",null)},
        {context.getSharedPreferences("loge-tools-v1-"+scope.hashCode(),Context.MODE_PRIVATE).edit().putString("state",it).apply()},seedDemoPeople)
    private val json=Json { ignoreUnknownKeys=true;encodeDefaults=true }
    var data by mutableStateOf(LogeArchive());private set
    var tab by mutableIntStateOf(0)
    var selectedId by mutableStateOf("loge-a")
    var action by mutableStateOf<String?>(null)
    var notice by mutableStateOf<String?>(null)
    var now by mutableLongStateOf(System.currentTimeMillis());private set
    var questionVisibleUntil by mutableLongStateOf(0);private set
    var showDrawId by mutableStateOf<String?>(null)
    private var drawHideAt:Long?=null
    fun showWinner(id:String) { showDrawId=id;drawHideAt=System.currentTimeMillis()+12_000L }
    var externalGiftRecipients by mutableStateOf<Map<String,WaveGuest>>(emptyMap())
    val people get()=(guests.guests+externalGiftRecipients.values).distinctBy{it.id}
    val selected get()=people.find { it.id==selectedId }
    val activeMoment get()=data.moments.firstOrNull { it.personId==selectedId && it.format=="live" && it.status in setOf("scheduled","accepted","live") }
    val selectedQuestion get()=data.questions.firstOrNull { it.status=="selected" }
    val displayedQuestion get()=selectedQuestion?.takeIf { now<questionVisibleUntil }
    val activePoll get()=data.poll?.takeIf { now<it.endsAt }
    init {
        val names=listOf("Lou V.","Yanis Flow","Sofia Elan","Maya Nox","Léo Mar","Nina Vale")
        val images=listOf(R.drawable.loge_artist_0,R.drawable.loge_artist_1,R.drawable.loge_artist_2,R.drawable.loge_artist_3,R.drawable.loge_artist_4,R.drawable.loge_artist_5)
        if(seedDemoPeople)guests.addSceneDemoPeople(names.mapIndexed { i,name -> WaveGuest("loge-"+('a'+i),name,if(i in listOf(0,1,2,5))"Membre VIP" else "Membre de la Loge",images[i],if(i<3)WaveGuestLocation.BACKSTAGE else WaveGuestLocation.REQUESTED,gradeLevel=i%5+1) })
        else selectedId=guests.guests.firstOrNull()?.id.orEmpty()
        load()?.let { saved -> runCatching { data=json.decodeFromString<LogeArchive>(saved) }.onFailure { notice="Le dernier atelier n’a pas pu être restauré." } }
        // Re-entering a room must never silently put a person back on air.
        if(data.moments.any { it.status=="live" }) save(data.copy(moments=data.moments.map { if(it.status=="live")it.copy(status="accepted",startedAt=null)else it }))
        tick()
    }
    private fun save(value:LogeArchive) { data=value;persist(json.encodeToString(value)) }
    fun choose(id:String) { if(people.none { it.id==id })return;selectedId=id;action=null;notice=null }
    fun profile(id:String) { guests.previewId=null;guests.profilePreviewId=id }
    fun message(id:String) { guests.messageRecipientIds=setOf(id) }
    fun offerExperience(personId:String,type:String,detail:String):Boolean {
        if(people.none { it.id==personId } || type !in listOf("Concert","Sur scène","Rencontre","Session studio") || detail.isBlank())return false
        if(data.experiences.any { it.personId==personId && it.type==type && it.detail==detail.trim() && it.status in setOf("pending","accepted") }) { notice="Cette invitation existe déjà.";return false }
        save(data.copy(experiences=listOf(LogeExperience(personId=personId,type=type,detail=detail.trim().take(240)))+data.experiences));notice=null;return true
    }
    fun experienceStatus(id:String,status:String) {
        val invitation=data.experiences.find { it.id==id }?:return
        val allowed=when(invitation.status){"pending"->setOf("accepted","declined","cancelled");"accepted"->setOf("completed","cancelled");else->emptySet()}
        if(status in allowed)save(data.copy(experiences=data.experiences.map { if(it.id==id)it.copy(status=status)else it }))
    }
    fun toggleQuestions() { save(data.copy(questionsOpen=!data.questionsOpen)) }
    fun question(id:String,status:String) {
        if(status !in setOf("pending","selected","answered","rejected") || data.questions.none { it.id==id })return
        save(data.copy(questions=data.questions.map { when { it.id==id -> it.copy(status=status);status=="selected"&&it.status=="selected"->it.copy(status="pending");else->it } }))
        if(status=="selected")questionVisibleUntil=System.currentTimeMillis()+30_000
        else if(selectedQuestion==null)questionVisibleUntil=0
    }
    fun openVip(id:String) { choose(id);tab=0 }
    fun invite(minutes:Int) {
        val person=selected?:return
        if(minutes !in listOf(5,10,15)||activeMoment!=null)return
        save(data.copy(moments=listOf(LogeMoment(personId=person.id,minutes=minutes))+data.moments))
    }
    fun moment(id:String,status:String) {
        val moment=data.moments.find { it.id==id }?:return
        if(!LogeRules.transition(moment.status,status))return
        if(status=="live") {
            val person=people.find { it.id==moment.personId }
            if(person==null || !person.connected || !person.canParticipate || person.location !in setOf(WaveGuestLocation.BACKSTAGE,WaveGuestLocation.STAGE)) { notice="Cette personne doit être prête en coulisses avant le direct.";return }
            if(data.moments.any { it.status=="live" && it.id!=id }) { notice="Termine le moment en cours avant d’en lancer un autre.";return }
            if(person.location!=WaveGuestLocation.STAGE)guests.move(setOf(person.id),WaveGuestLocation.STAGE)
            if(guests.onStage.none { it.id==person.id }) { notice="La scène est complète.";return }
            guests.primaryId="host";guests.composition=WaveComposition.ENSEMBLE
        }
        if(status=="completed")guests.move(setOf(moment.personId),WaveGuestLocation.BACKSTAGE)
        save(data.copy(moments=data.moments.map { if(it.id==id)it.copy(status=status,startedAt=if(status=="live")System.currentTimeMillis()else it.startedAt)else it }))
        notice=if(status=="completed")"Moment terminé · retour en coulisses."else null
    }
    fun dedicate(personId:String,format:String,path:String,seconds:Int):Boolean {
        if(people.none { it.id==personId } || format !in listOf("audio","video") || !java.io.File(path).isFile || seconds<1)return false
        if(data.moments.any { it.file==path })return true
        save(data.copy(moments=listOf(LogeMoment(personId=personId,format=format,status="completed",file=path,seconds=seconds))+data.moments))
        guests.addPrivateDemoMessage(setOf(personId),"Dédicace "+format+" · "+sceneClock(seconds.toLong())+" · disponible dans l’historique VIP")
        return true
    }
    fun launchPoll(question:String,choices:List<String>,seconds:Int) {
        if(activePoll!=null || question.isBlank() || question.length>160 || choices !in listOf(listOf("Oui","Non"),listOf("Pour","Contre")) || seconds !in listOf(15,30,60))return
        save(data.copy(poll=LogePoll(question.trim(),choices,System.currentTimeMillis()+seconds*1000)))
    }
    fun stopPoll() { data.poll?.let { save(data.copy(poll=it.copy(endsAt=System.currentTimeMillis()))) };tick() }
    fun clearPoll() { if(activePoll==null)save(data.copy(poll=null)) }
    fun demoVote(choice:Int) { val p=data.poll?:return;if(LogeRules.mayVote(p,System.currentTimeMillis(),choice)) save(data.copy(poll=p.copy(votes=p.votes+("demo-viewer" to choice)))) }
    fun gift(gift:LogeGift):Boolean {
        if(data.gifts.any { it.id==gift.id })return true
        val error=LogeRules.giftError(gift,data.stock,6,System.currentTimeMillis())
        if(error!=null) { notice=error;return false }
        if(gift.pool.isEmpty() && people.none { it.id==gift.recipientId }) { notice="Ce destinataire n’est plus disponible.";return false }
        save(data.copy(gifts=listOf(gift)+data.gifts,stock=data.stock.mapIndexed { i,n -> if(i==gift.code)n-1 else n }))
        notice=null;return true
    }
    fun cancelGift(id:String) {
        val g=data.gifts.find { it.id==id }?:return
        if(g.status !in setOf("scheduled","ready","round"))return
        save(data.copy(gifts=data.gifts.map { if(it.id==id)it.copy(status="cancelled")else it },stock=data.stock.mapIndexed { i,n -> if(i==g.code)n+1 else n }))
    }
    fun deliverRound(id:String) { val g=data.gifts.find { it.id==id && it.status=="round" }?:return;save(data.copy(gifts=data.gifts.map { if(it.id==g.id)it.copy(status="sent")else it })) }
    fun startDraw(id:String) {
        val g=data.gifts.find { it.id==id && it.status=="ready" && it.pool.size>=2 }?:return
        if(data.gifts.any { it.status=="spinning" }) { notice="Un tirage est déjà en cours.";return }
        val winner=g.pool[SecureRandom().nextInt(g.pool.size)]
        save(data.copy(gifts=data.gifts.map { if(it.id==id)it.copy(status="spinning",startedAt=System.currentTimeMillis(),winner=winner)else it }))
        showDrawId=id
        drawHideAt=null
    }
    fun tick() {
        now=System.currentTimeMillis()
        data.moments.filter { it.status=="live" && (now-(it.startedAt?:now)>=it.minutes*60_000L || guests.onStage.none { person -> person.id==it.personId }) }.forEach { moment(it.id,"completed") }
        val gifts=data.gifts.map { when {
            it.status=="scheduled" && now>=(it.scheduledAt?:Long.MAX_VALUE) -> it.copy(status=if(it.pool.isEmpty())"sent"else"ready")
            it.status=="spinning" && now-(it.startedAt?:now)>=it.animationSeconds*1000 -> it.copy(status="revealed")
            else -> it
        } }
        if(gifts!=data.gifts) {
            if(gifts.any { it.id==showDrawId && it.status=="revealed" && data.gifts.any { old -> old.id==it.id && old.status=="spinning" } })drawHideAt=now+12_000L
            save(data.copy(gifts=gifts))
        }
        if(drawHideAt?.let { now>=it }==true) { showDrawId=null;drawHideAt=null }
    }
}
private fun logeQuestions()=listOf(
    LogeQuestion("q1","loge-c","Quand as-tu compris qu’Éclipse devait devenir le premier single ?",186),
    LogeQuestion("q2","loge-a","Est-ce qu’on entend encore ta voix de la première maquette dans l’intro ?",142),
    LogeQuestion("q3","loge-d","Quelle partie du morceau a été la plus difficile à écrire ?",97),
    LogeQuestion("q4","loge-b","Tu nous joueras la version acoustique avant la fin du live ?",74),
    LogeQuestion("q5","loge-f","Pourquoi as-tu gardé le souffle au début du deuxième couplet ?",63,"answered"),
    LogeQuestion("q6","loge-e","Est-ce que le titre du morceau a changé pendant l’écriture ?",22,"rejected")
)
