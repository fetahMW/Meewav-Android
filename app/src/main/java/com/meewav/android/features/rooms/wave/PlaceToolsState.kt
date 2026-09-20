package com.meewav.android.features.rooms.wave

import android.content.Context
import androidx.compose.runtime.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.UUID

internal val placeDurations=listOf(30,60,90,120,180,300)
@Serializable internal data class PlaceClock(val seconds:Int=60,val remaining:Int=60,val deadline:Long?=null) {
    fun left(now:Long)=deadline?.let{((it-now+999)/1000).coerceAtLeast(0).toInt()}?:remaining
    fun start(now:Long)=copy(remaining=seconds,deadline=now+seconds*1000L)
    fun pause(now:Long)=copy(remaining=left(now),deadline=null)
    fun resume(now:Long)=copy(deadline=now+remaining*1000L)
}
@Serializable internal data class PlaceFloor(val prompt:String="",val open:Boolean=true,val queue:List<String> = emptyList(),val current:String?=null,val status:String="idle",val completed:List<String> = emptyList(),val clock:PlaceClock=PlaceClock())
@Serializable internal data class PlaceClash(val title:String,val left:String,val right:String,val rounds:Int,val round:Int=1,val turn:Int=0,val accepted:List<String> = emptyList(),val status:String="inviting",val clock:PlaceClock=PlaceClock())
@Serializable internal data class PlaceChallenge(val id:String=UUID.randomUUID().toString(),val title:String,val target:String?=null,val author:String="host",val accepted:List<String> = emptyList(),val completed:List<String> = emptyList(),val status:String="open",val clock:PlaceClock=PlaceClock())
@Serializable internal data class PlaceArchive(val floor:PlaceFloor=PlaceFloor(),val clash:PlaceClash?=null,val challenges:List<PlaceChallenge> = emptyList())

/** Web conversation rules, with the user-requested Classe stage/microphone handoff for the floor only. */
internal class PlaceToolsState(val guests:WaveGuestState,load:()->String?,private val persist:(String)->Unit,private val time:()->Long={System.currentTimeMillis()}) {
    constructor(context:Context,guests:WaveGuestState,scope:String):this(guests,
        {context.getSharedPreferences("place-tools-v1-"+scope.hashCode(),Context.MODE_PRIVATE).getString("state",null)},
        {context.getSharedPreferences("place-tools-v1-"+scope.hashCode(),Context.MODE_PRIVATE).edit().putString("state",it).apply()})
    private val json=Json{ignoreUnknownKeys=true;encodeDefaults=true}
    var data by mutableStateOf(PlaceArchive());private set
    var tab by mutableIntStateOf(0)
    var notice by mutableStateOf<String?>(null)
    var now by mutableLongStateOf(time());private set
    val people get()=guests.guests.filter{it.connected&&it.canParticipate&&it.location in setOf(WaveGuestLocation.BACKSTAGE,WaveGuestLocation.STAGE)}
    val backstage get()=people.filter{it.location==WaveGuestLocation.BACKSTAGE}
    init {
        load()?.let { runCatching{data=json.decodeFromString<PlaceArchive>(it)}.onFailure{notice="Le dernier atelier n’a pas pu être restauré."} }
        // Restoring an atelier must never reopen a microphone without a fresh host action.
        if(data.floor.current!=null)data=data.copy(floor=data.floor.copy(current=null,status="ended",clock=PlaceClock(data.floor.clock.seconds,data.floor.clock.seconds)))
    }
    fun tick(){
        now=time()
        val current=data.floor.current
        if(current!=null&&people.none{it.id==current})endFloor()
    }
    private fun save(value:PlaceArchive){data=value;persist(json.encodeToString(value));notice=null;tick()}
    private fun requireState(condition:Boolean,message:String){require(condition){message}}
    private fun act(block:()->Unit):Boolean=try {block();true}catch(e:IllegalArgumentException){notice=e.message;false}
    private fun eligible(id:String)=id=="host"||people.any{it.id==id}
    private fun title(text:String){requireState(text.trim().length in 1..160,"Écris un intitulé de 1 à 160 caractères.")}
    private fun duration(seconds:Int){requireState(seconds in placeDurations,"Choisis une durée proposée.")}
    fun profile(id:String){guests.previewId=null;guests.profilePreviewId=id}
    fun message(id:String){guests.messageRecipientIds=setOf(id)}
    fun configureFloor(prompt:String,seconds:Int)=act {
        requireState(data.floor.current==null,"Termine le tour avant de modifier les réglages.");duration(seconds)
        save(data.copy(floor=data.floor.copy(prompt=prompt.trim().take(160),clock=PlaceClock(seconds,seconds))))
    }
    fun toggleFloor(){save(data.copy(floor=data.floor.copy(open=!data.floor.open)))}
    fun joinFloor(id:String)=act {
        requireState(backstage.any{it.id==id},"Choisis une personne prête en coulisses.")
        val f=data.floor
        if(id !in f.queue && id!=f.current){requireState(f.queue.size<50,"La file de parole est complète.");save(data.copy(floor=f.copy(queue=f.queue+id)))}
    }
    private fun releaseSpeaker(id:String?) {
        if(id==null)return
        guests.releaseAudioFloor(id)
    }
    fun leaveFloor(id:String){val f=data.floor;if(f.current==id)releaseSpeaker(id);save(data.copy(floor=f.copy(queue=f.queue-id,current=if(f.current==id)null else f.current,status=if(f.current==id)"ended"else f.status,clock=if(f.current==id)f.clock.copy(deadline=null)else f.clock)))}
    fun nextFloor()=act {
        val f=data.floor;val next=f.queue.firstOrNull{eligible(it)}
        requireState(next!=null,"Ajoute une personne disponible à la file de parole.")
        releaseSpeaker(f.current)
        requireState(guests.grantAudioFloor(next!!),"Cette personne n’est plus disponible.")
        save(data.copy(floor=f.copy(current=next,queue=f.queue.filter{it!=next&&eligible(it)},completed=(f.completed+listOfNotNull(f.current)).takeLast(50),status="running",clock=f.clock.start(time()))))
    }
    fun pauseFloor(){val f=data.floor;if(f.status=="running")save(data.copy(floor=f.copy(status="paused",clock=f.clock.pause(time()))))else if(f.status=="paused"&&f.clock.remaining>0)save(data.copy(floor=f.copy(status="running",clock=f.clock.resume(time()))))}
    fun endFloor(){val f=data.floor;releaseSpeaker(f.current);save(data.copy(floor=f.copy(current=null,status="ended",completed=(f.completed+listOfNotNull(f.current)).takeLast(50),clock=PlaceClock(f.clock.seconds,f.clock.seconds))))}
    fun inviteClash(text:String,left:String,right:String,seconds:Int,rounds:Int)=act {
        title(text);duration(seconds);requireState(rounds in listOf(1,3,5),"Choisis 1, 3 ou 5 manches.")
        requireState(left!=right&&eligible(left)&&eligible(right),"Choisis deux personnes disponibles et différentes.")
        requireState(data.clash?.status !in setOf("inviting","running","paused"),"Termine le clash actuel.")
        save(data.copy(clash=PlaceClash(text.trim(),left,right,rounds,clock=PlaceClock(seconds,seconds))))
    }
    fun answerClash(actor:String,accept:Boolean)=act {
        val c=data.clash;requireState(c!=null&&c.status=="inviting"&&actor in listOf(c.left,c.right)&&eligible(actor),"Cette invitation n’est plus disponible.")
        c!!;save(data.copy(clash=if(accept)c.copy(accepted=(c.accepted+actor).distinct())else c.copy(status="cancelled")))
    }
    fun nextClash()=act {
        val c=data.clash;requireState(c!=null&&c.status in setOf("inviting","running","paused"),"Prépare un clash avant de le lancer.");c!!
        requireState(eligible(c.left)&&eligible(c.right),"Un participant n’est plus disponible.")
        if(c.status=="inviting"){
            requireState(listOf(c.left,c.right).all{it in c.accepted},"Les deux participants doivent accepter le clash.")
            save(data.copy(clash=c.copy(status="running",clock=c.clock.start(time()))))
        }else if(c.turn==1&&c.round>=c.rounds)save(data.copy(clash=c.copy(status="ended",clock=c.clock.copy(remaining=0,deadline=null))))
        else save(data.copy(clash=c.copy(turn=1-c.turn,round=c.round+if(c.turn==1)1 else 0,status="running",clock=c.clock.start(time()))))
    }
    fun pauseClash(){val c=data.clash?:return;if(c.status=="running")save(data.copy(clash=c.copy(status="paused",clock=c.clock.pause(time()))))else if(c.status=="paused"&&c.clock.remaining>0)save(data.copy(clash=c.copy(status="running",clock=c.clock.resume(time()))))}
    fun endClash(){val c=data.clash?:return;if(c.status in setOf("inviting","running","paused"))save(data.copy(clash=c.copy(status=if(c.status=="inviting")"cancelled"else"ended",clock=c.clock.copy(deadline=null))))}
    fun createChallenge(text:String,target:String?,seconds:Int)=act {
        title(text);duration(seconds);requireState(target==null||eligible(target),"Ce participant n’est plus disponible.")
        requireState(data.challenges.count{it.status in setOf("open","running")}<6,"Termine un défi avant d’en ajouter un autre.")
        save(data.copy(challenges=(listOf(PlaceChallenge(title=text.trim(),target=target,clock=PlaceClock(seconds,seconds)))+data.challenges).filterIndexed{i,c->i<20||c.status in setOf("open","running")}))
    }
    fun challenge(id:String,action:String,actor:String="host")=act {
        val c=data.challenges.find{it.id==id};requireState(c!=null,"Ce défi n’est plus disponible.");c!!
        val next=when(action){
            "accept"->{requireState(c.status=="open"&&eligible(actor)&&(c.target==null||c.target==actor),"Ce défi n’est pas ouvert à cette personne.");requireState(actor in c.accepted||c.accepted.size<50,"Ce défi est complet.");c.copy(accepted=(c.accepted+actor).distinct())}
            "start"->{requireState(c.status=="open"&&c.accepted.isNotEmpty(),"Attends qu’une personne accepte le défi.");c.copy(status="running",clock=c.clock.start(time()))}
            "complete"->{requireState(c.status=="running"&&actor in c.accepted,"Cette personne ne participe pas au défi.");c.copy(completed=(c.completed+actor).distinct())}
            "validate"->{requireState(c.status=="running"&&c.completed.isNotEmpty(),"Attends qu’un participant ait terminé.");c.copy(status="done",clock=c.clock.copy(deadline=null))}
            "cancel"->{requireState(c.status in setOf("open","running"),"Ce défi est déjà terminé.");c.copy(status="cancelled",clock=c.clock.copy(deadline=null))}
            else->throw IllegalArgumentException("Action inconnue.")
        }
        save(data.copy(challenges=data.challenges.map{if(it.id==id)next else it}))
    }
}
