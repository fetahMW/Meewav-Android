package com.meewav.android.features.rooms.wave

import android.content.Intent
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

internal data class RoomSwitchConfig(
    val title:String="Suite du live",val topic:String="",val open:Boolean=true,val questions:Boolean=true,
    val liveOnly:Boolean=true,val program:String="",val minutes:Int=5,val evaluation:Boolean=true,val prompter:String="",
    val students:Set<String> = emptySet(),val format:CageFormat=CageFormat.TOURNAMENT,val capacity:Int=8,val passage:Int=90,val voting:Int=60,
    val bpm:Int=92,val key:String="Am",val bars:Int=8,val maxBars:Int=8,val longAudio:Boolean=true,val audio:String="",val audioName:String="",val audioSeconds:Double=0.0,val rights:Boolean=false
)
internal class RoomSwitchState(initial:RoomModule,private val time:()->Long={System.currentTimeMillis()}) {
    val initialRoom=initial
    fun prepared(room:RoomModule)=room==initialRoom||room in configs
    var current by mutableStateOf(initial);private set
    var version by mutableIntStateOf(0);private set
    var configs by mutableStateOf<Map<RoomModule,RoomSwitchConfig>>(emptyMap());private set
    var notice by mutableStateOf<String?>(null)
    private var changedAt:Long?=null
    fun validate(target:RoomModule,c:RoomSwitchConfig,guestIds:Set<String>):String?=when {
        target==current->"Cette room est déjà ouverte."
        prepared(target)&&target!=RoomModule.CLASSE->null
        c.title.trim().length !in 1..100->"Donne un titre de 1 à 100 caractères."
        target==RoomModule.CLASSE&&(c.students.size !in 1..24||!guestIds.containsAll(c.students))->"Sélectionne entre 1 et 24 personnes présentes dans la file."
        target==RoomModule.SCENE&&(c.program.lines().count{it.isNotBlank()} !in 1..24||c.minutes !in 1..120)->"Prévois 1 à 24 passages, de 1 à 120 minutes."
        target==RoomModule.CAGE&&(c.capacity !in listOf(2,4,8,16,32,64)||c.passage !in 30..1800||c.voting !in 15..300)->"Vérifie le nombre de participants et les durées."
        target==RoomModule.WAVE&&(c.bpm !in 40..240||c.key !in listOf("C","Cm","D","Dm","E","Em","F","Fm","G","Gm","A","Am","B","Bm")||c.maxBars !in listOf(4,8,16))->"Vérifie les réglages de la Wave."
        target==RoomModule.WAVE&&(!c.rights||c.audio.isBlank()||c.audioSeconds<=0)->"Importe la base et confirme tes droits avant de continuer."
        target==RoomModule.WAVE&&!c.longAudio&&(c.bars !in listOf(4,8,16)||kotlin.math.abs(c.audioSeconds-60.0/c.bpm*4*c.bars)>.1)->"La durée ne correspond pas aux mesures. Ajuste le BPM ou choisis Son long."
        else->null
    }
    fun commit(target:RoomModule,config:RoomSwitchConfig,guestIds:Set<String>,expectedVersion:Int,activityBlock:String?):Boolean {
        val error=activityBlock?:if(expectedVersion!=version)"La proposition a changé. Rouvre Switch Room."else if(changedAt?.let{time()-it<5000}==true)"Attends quelques secondes avant de changer à nouveau."else validate(target,config,guestIds)
        if(error!=null){notice=error;return false}
        configs=configs+(target to config);current=target;version++;changedAt=time();notice=null;return true
    }
}

@Composable internal fun RoomSwitchSheet(state:RoomSwitchState,guests:WaveGuestState,activityBlock:String?,onClose:()->Unit,onSwitch:(RoomModule,RoomSwitchConfig)->Unit) {
    var target by remember{mutableStateOf<RoomModule?>(null)}
    var config by remember{mutableStateOf(RoomSwitchConfig())}
    var confirm by remember{mutableStateOf(false)}
    val expectedVersion=remember{state.version}
    var reading by remember{mutableStateOf(false)}
    val context=LocalContext.current
    val scope=rememberCoroutineScope()
    val picker=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()){uri->if(uri!=null){
        reading=true;state.notice=null
        scope.launch {
            runCatching {
                withContext(Dispatchers.IO){
                    context.contentResolver.takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION)
                    val meta=context.contentResolver.query(uri,arrayOf(OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE),null,null,null)?.use{if(it.moveToFirst())it.getString(0) to it.getLong(1)else null}?:error("Fichier indisponible.")
                    require(meta.second in 1..67_108_864L){"La base doit faire 64 Mo maximum."}
                    require(meta.first.substringAfterLast('.').lowercase() in setOf("wav","mp3","aac","flac","m4a")){"Choisis WAV, MP3, AAC, FLAC ou M4A."}
                    val retriever=MediaMetadataRetriever();val seconds=try{retriever.setDataSource(context,uri);retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toDoubleOrNull()?.div(1000)?:0.0}finally{retriever.release()}
                    require(seconds>0){"Impossible de lire la durée de cette base."};Triple(uri.toString(),meta.first,seconds)
                }
            }.onSuccess{config=config.copy(audio=it.first,audioName=it.second,audioSeconds=it.third)}.onFailure{state.notice=it.message?:"Import impossible."}
            reading=false
        }
    }}
    ClasseSheet("Switch Room",onClose){
        Column(Modifier.verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(9.dp)) {
            state.notice?.let{Text(it,color=logeRed,fontSize=12.sp)}
            activityBlock?.let{Text(it,color=logeGold,fontSize=12.sp)}
            if(target==null){
                Text("Où continue-t-on le live ?",color=Color.White,fontSize=16.sp)
                Text("Même session, même communauté, nouvelle expérience.",color=sceneMuted,fontSize=12.sp)
                listOf(RoomModule.PLACE,RoomModule.SCENE,RoomModule.CAGE,RoomModule.CLASSE,RoomModule.WAVE,RoomModule.LOGE).forEach{room->
                    Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).clickable(enabled=room!=state.current&&activityBlock==null){target=room;config=state.configs[room]?:RoomSwitchConfig(title="Suite du live · "+room.label);state.notice=null;confirm=state.prepared(room)&&room!=RoomModule.CLASSE}.padding(12.dp),verticalAlignment=Alignment.CenterVertically){
                        Icon(when(room){RoomModule.PLACE->Icons.Default.People;RoomModule.SCENE->Icons.Default.Mic;RoomModule.CAGE->Icons.Default.SportsMma;RoomModule.CLASSE->Icons.Default.School;RoomModule.WAVE->Icons.Default.GraphicEq;RoomModule.LOGE->Icons.Default.MeetingRoom},null,tint=if(room==state.current)sceneMuted else sceneAccent,modifier=Modifier.size(22.dp))
                        Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(room.label,color=if(room==state.current)sceneMuted else Color.White,fontSize=14.sp);Text(if(room==state.current)"Room actuelle"else when(room){RoomModule.PLACE->"Échanges libres";RoomModule.SCENE->"Performances live";RoomModule.CAGE->"Battles";RoomModule.CLASSE->"Cours et transmission";RoomModule.WAVE->"Création collective";RoomModule.LOGE->"Rencontres VIP"},color=sceneMuted,fontSize=11.sp)}
                    Icon(Icons.Default.ChevronRight,null,tint=sceneAccent,modifier=Modifier.size(18.dp))
                    }
                }
            }else if(confirm){
                Text("Continuer dans ${target!!.label} ?",color=Color.White,fontSize=17.sp)
                Text(config.title,color=sceneAccent,fontSize=14.sp)
                Text("Le chat, les invités et le mixeur restent dans cette session. Aucun micro ni caméra ne sera activé par ce changement.",color=sceneMuted,fontSize=12.sp)
                SceneButton("Confirmer le changement",Modifier.fillMaxWidth(),primary=true){val to=target!!;if(state.commit(to,config,guests.guests.filter{it.location==WaveGuestLocation.BACKSTAGE}.map{it.id}.toSet(),expectedVersion,activityBlock)){onSwitch(to,config);onClose()}}
                SceneButton("Retour",Modifier.fillMaxWidth()){if(state.prepared(target!!)&&target!=RoomModule.CLASSE)target=null else confirm=false}
            }else{
                SceneButton("Expériences",icon=WaveIcons.ChevronLeft){target=null;state.notice=null}
                Text("Préparer ${target!!.label}",color=Color.White,fontSize=16.sp)
                SceneField("Titre du live",config.title,{config=config.copy(title=it.take(100))})
                when(target!!){
                    RoomModule.PLACE->{SceneField("Sujet de la rencontre",config.topic,{config=config.copy(topic=it.take(4000))},lines=2);SwitchFlag("Ouvrir les demandes",config.open){config=config.copy(open=it)}}
                    RoomModule.LOGE->{SceneField("Titre de l’avant-première",config.topic,{config=config.copy(topic=it.take(160))});SceneField("Présentation",config.prompter,{config=config.copy(prompter=it.take(4000))},lines=2);SwitchFlag("Accepter les questions",config.questions){config=config.copy(questions=it)};SwitchFlag("Avant-première réservée au direct",config.liveOnly){config=config.copy(liveOnly=it)}}
                    RoomModule.SCENE->{SceneField("Programme · un passage par ligne",config.program,{config=config.copy(program=it.take(4000))},lines=3);SwitchNumber("Minutes par passage",config.minutes){config=config.copy(minutes=it)};SwitchFlag("Vote du public après la prestation",config.evaluation){config=config.copy(evaluation=it)};SceneField("Prompteur",config.prompter,{config=config.copy(prompter=it.take(4000))},lines=3)}
                    RoomModule.CAGE->{SceneChoice(config.format.title,CageFormat.entries.map{it to it.title}){config=config.copy(format=it)};SceneChoice("${config.capacity} participants",listOf(2,4,8,16,32,64).map{it to "$it participants"}){config=config.copy(capacity=it)};SwitchNumber("Passage · secondes",config.passage){config=config.copy(passage=it)};SwitchNumber("Vote · secondes",config.voting){config=config.copy(voting=it)};Text("Prépare les règles, puis sélectionne les artistes. Aucun match ne démarre automatiquement.",color=sceneMuted,fontSize=11.sp)}
                    RoomModule.CLASSE->{
                        SceneField("Objectif du cours",config.topic,{config=config.copy(topic=it.take(4000))},lines=2)
                        SwitchFlag("Autoriser les mains levées",config.open){config=config.copy(open=it)};SwitchFlag("Ouvrir les questions",config.questions){config=config.copy(questions=it)}
                        Text("Élèves en coulisses · ${config.students.size}/24",color=Color.White,fontSize=13.sp)
                        val candidates=guests.guests.filter{it.location==WaveGuestLocation.BACKSTAGE}
                        Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){SceneButton("Les 24 premiers",Modifier.weight(1f)){config=config.copy(students=candidates.take(24).map{it.id}.toSet())};SceneButton("Tout retirer",Modifier.weight(1f)){config=config.copy(students=emptySet())}}
                        candidates.forEach{person->Row(Modifier.fillMaxWidth().hifiBlackSurface(10.dp).clickable{config=config.copy(students=if(person.id in config.students)config.students-person.id else if(config.students.size<24)config.students+person.id else config.students)}.padding(horizontal=8.dp),verticalAlignment=Alignment.CenterVertically){Checkbox(person.id in config.students,null,colors=CheckboxDefaults.colors(checkedColor=WaveMixerTheme.primaryCta));Text(person.name,color=Color.White,fontSize=12.sp)}}
                    }
                    RoomModule.WAVE->{
                        SwitchNumber("BPM",config.bpm){config=config.copy(bpm=it)}
                        SceneChoice(config.key,listOf("C","Cm","D","Dm","E","Em","F","Fm","G","Gm","A","Am","B","Bm").map{it to it}){config=config.copy(key=it)}
                        SceneChoice("Propositions · ${config.maxBars} mesures",listOf(4,8,16).map{it to "$it mesures maximum"}){config=config.copy(maxBars=it)}
                        SwitchFlag("Propositions ouvertes",config.open){config=config.copy(open=it)}
                        SceneChoice(if(config.longAudio)"Son long"else"${config.bars} mesures",listOf(0 to "Son long",4 to "4 mesures",8 to "8 mesures",16 to "16 mesures")){config=config.copy(longAudio=it==0,bars=if(it==0)8 else it)}
                        SceneButton(if(reading)"Lecture du fichier…"else config.audioName.ifBlank{"Importer la base"},Modifier.fillMaxWidth(),enabled=!reading,icon=Icons.Default.FileDownload){picker.launch(arrayOf("audio/*"))}
                        SwitchFlag("Je possède les droits et autorise la diffusion et le téléchargement de cette base",config.rights){config=config.copy(rights=it)}
                    }
                }
                SceneButton("Continuer",Modifier.fillMaxWidth(),primary=true,enabled=!reading&&activityBlock==null){val error=state.validate(target!!,config,guests.guests.filter{it.location==WaveGuestLocation.BACKSTAGE}.map{it.id}.toSet());if(error==null){state.notice=null;confirm=true}else state.notice=error}
            }
        }
    }
}
@Composable private fun SwitchFlag(label:String,value:Boolean,onChange:(Boolean)->Unit){Row(Modifier.fillMaxWidth().hifiBlackSurface(10.dp).padding(horizontal=10.dp),verticalAlignment=Alignment.CenterVertically){Text(label,Modifier.weight(1f),color=Color.White,fontSize=12.sp);Switch(value,onChange,colors=SwitchDefaults.colors(checkedTrackColor=WaveMixerTheme.primaryCta))}}
@Composable private fun SwitchNumber(label:String,value:Int,onChange:(Int)->Unit){SceneField(label,value.toString(),{onChange(it.filter(Char::isDigit).take(4).toIntOrNull()?:0)})}
