package com.meewav.android.features.rooms.wave

import androidx.compose.animation.AnimatedContent
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*

internal val logeGold=Color(0xFFDDCCA5)
internal val logeGreen=Color(0xFF8EBBA3)
internal val logeRed=Color(0xFFD6949A)

@Composable internal fun LogeToolsPanel(state:LogeToolsState,onGuests:()->Unit,onChat:()->Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().height(44.dp)) {
            listOf("VIP","Questions","Invitations").forEachIndexed { i,label ->
                Box(Modifier.weight(1f).fillMaxHeight().clickable { state.tab=i },contentAlignment=Alignment.Center) {
                    Text(label,color=if(state.tab==i)Color.White else sceneMuted,fontSize=12.sp,fontWeight=FontWeight.SemiBold)
                    if(state.tab==i)Box(Modifier.align(Alignment.BottomCenter).padding(bottom=5.dp).width(34.dp).height(2.dp).background(Brush.horizontalGradient(listOf(Color.Transparent,sceneAccent,Color.Transparent)),CircleShape))
                }
            }
        }
        state.notice?.let { Row(verticalAlignment=Alignment.CenterVertically) { Text(it,color=sceneAccent,fontSize=11.sp,modifier=Modifier.weight(1f));SceneIcon(WaveIcons.Close,"Fermer le message"){state.notice=null} } }
        Box(Modifier.weight(1f)) { when(state.tab) {
            0 -> LogeVipPanel(state,onGuests)
            1 -> LogeQuestionsPanel(state)
            2 -> LogeInvitationsPanel(state)
        } }
    }
}

@Composable internal fun LogePortrait(state:LogeToolsState,person:WaveGuest,size:Dp=42.dp) {
    Image(painterResource(person.portrait),"Pré-profil de "+person.name,Modifier.size(size).clip(CircleShape).clickable { state.profile(person.id) },contentScale=ContentScale.Crop)
}
@Composable private fun LogeVipPanel(state:LogeToolsState,onGuests:()->Unit) {
    var source by remember { mutableStateOf("all") }
    var history by remember { mutableStateOf(false) }
    var sourceMenu by remember { mutableStateOf(false) }
    var playback by remember { mutableStateOf<LogeMoment?>(null) }
    val person=state.selected
    if(person!=null && state.action!=null) {
        Column(Modifier.fillMaxSize()) {
            Row(verticalAlignment=Alignment.CenterVertically) {
                SceneIcon(WaveIcons.ChevronLeft,"Retour aux membres") { state.action=null }
                LogePortrait(state,person,32.dp);Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) { Text(person.name,color=Color.White,fontSize=14.sp,fontWeight=FontWeight.SemiBold);Text(if(state.action=="live")"Moment VIP" else "Dédicace "+state.action,color=logeGold,fontSize=11.sp) }
                SceneIcon(WaveIcons.Chat,"Écrire à "+person.name){state.message(person.id)}
            }
            if(state.action=="live")LogeLivePanel(state,onGuests)
            else LogeRecordingPanel(state,person,state.action!!)
        }
        return
    }
    Column(Modifier.fillMaxSize()) {
        Box {
            Row(Modifier.fillMaxWidth().height(44.dp).hifiBlackSurface(12.dp).clickable(role=Role.Button){sourceMenu=true}.padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically) {
                Text(if(history)"Historique VIP"else when(source){"queue"->"Demandes";"vip"->"Membres VIP";else->"Tous les membres"},Modifier.weight(1f),color=Color(0xFFD1CED8),fontSize=12.sp)
                Icon(Icons.Default.ExpandMore,null,Modifier.size(18.dp),tint=WaveMixerTheme.capsuleAccentSoft)
            }
            DropdownMenu(sourceMenu,{sourceMenu=false},containerColor=Color(0xFF101114),tonalElevation=0.dp,shape=RoundedCornerShape(12.dp)) {
                listOf("all" to "Tous les membres","queue" to "Demandes","vip" to "Membres VIP","history" to "Historique VIP").forEach { (key,label) ->
                    DropdownMenuItem(text={Text(label,color=Color(0xFFD1CED8),fontSize=12.sp)},onClick={history=key=="history";if(!history)source=key;sourceMenu=false})
                }
            }
        }
        val filtered=state.people.filter { when(source){"queue"->it.location==WaveGuestLocation.REQUESTED;"vip"->it.role.contains("VIP",true);else->true} }
        LazyColumn(Modifier.weight(1f),contentPadding=PaddingValues(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(7.dp)) {
            if(history) {
                items(state.data.moments,key={it.id}) { moment ->
                    val member=state.people.find { it.id==moment.personId }
                    SceneCard { Row(verticalAlignment=Alignment.CenterVertically) {
                        if(member!=null)LogePortrait(state,member)
                        Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)) {
                            Text(member?.name ?: "Membre",color=Color.White,fontSize=13.sp)
                            Text((if(moment.format=="live")"Moment VIP"else"Dédicace "+moment.format)+" · "+logeMomentLabel(moment.status),color=sceneMuted,fontSize=11.sp)
                        }
                        if(moment.file.isNotBlank())SceneIcon(WaveIcons.Play,"Relire la dédicace"){playback=moment}
                        else if(member!=null)SceneIcon(Icons.Default.ChevronRight,"Ouvrir le moment"){state.choose(member.id);state.action="live"}
                    } }
                }
                if(state.data.moments.isEmpty())item { LogeEmpty("Tes moments VIP et dédicaces apparaîtront ici.") }
            } else {
                items(filtered,key={it.id}) { member ->
                    Row(Modifier.fillMaxWidth().hifiBlackSurface(14.dp).then(if(state.selectedId==member.id)Modifier.border(.8.dp,sceneAccent.copy(alpha=.65f),RoundedCornerShape(14.dp))else Modifier).clickable { state.choose(member.id) }.padding(horizontal=10.dp,vertical=9.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                        LogePortrait(state,member,44.dp)
                        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(3.dp)) {
                            Text(member.name,color=Color.White,fontSize=13.sp,fontWeight=FontWeight.SemiBold,maxLines=1,overflow=TextOverflow.Ellipsis)
                            Text(member.role,color=if(member.role.contains("VIP"))logeGold else sceneMuted,fontSize=10.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
                        }
                        if(state.selectedId==member.id)Icon(Icons.Default.CheckCircle,"Sélectionné",Modifier.size(19.dp),tint=sceneAccent)
                        else Text(if(!member.connected)"Hors ligne"else if(member.location==WaveGuestLocation.REQUESTED)"Demande"else"En ligne",color=if(member.connected)logeGreen else sceneMuted,fontSize=9.sp)
                    }
                }
                if(filtered.isEmpty())item{LogeEmpty("Aucun membre ne correspond à cette recherche.")}
            }
        }
        if(!history)Column(Modifier.fillMaxWidth().padding(vertical=6.dp).hifiBlackSurface(14.dp).padding(6.dp)) {
            Row(horizontalArrangement=Arrangement.spacedBy(5.dp)) {
                listOf(Triple("audio","Audio",Icons.Default.Mic),Triple("video","Vidéo",Icons.Default.Videocam),Triple("live","Moment VIP",Icons.Default.Lock)).forEach { (action,label,icon) ->
                    ClasseTool(label,icon,Modifier.weight(1f),tint=if(person!=null)WaveMixerTheme.capsuleAccentSoft else sceneMuted){if(person!=null)state.action=action}
                }
            }
        }
        Spacer(Modifier.height(6.dp))
    }
    playback?.let { LogeMediaDialog(it.file,it.format){playback=null} }
}

@Composable private fun LogeLivePanel(state:LogeToolsState,onGuests:()->Unit) {
    val person=state.selected?:return
    var duration by remember(person.id) { mutableIntStateOf(5) }
    val moment=state.activeMoment
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        SceneCard {
            Icon(Icons.Default.SpatialAudioOff,null,tint=logeGold,modifier=Modifier.size(30.dp))
            Text(if(moment==null)"Un moment avec "+person.name else logeMomentLabel(moment.status),color=Color.White,fontSize=18.sp,fontWeight=FontWeight.SemiBold)
            if(moment==null) {
                Text("Invite cette personne, préparez le direct en coulisses, puis lance le moment dans la Loge.",color=sceneMuted,fontSize=12.sp)
                Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){listOf(5,10,15).forEach { minutes -> SceneButton("$minutes min",Modifier.weight(1f),primary=duration==minutes){duration=minutes} }}
                SceneButton("Inviter maintenant",Modifier.fillMaxWidth(),primary=true,icon=Icons.Default.PersonAdd){state.invite(duration)}
            } else {
                Text(if(moment.status=="live")sceneClock(((moment.minutes*60_000L-state.now+(moment.startedAt?:state.now))/1000).coerceAtLeast(0))+" restantes" else "Durée prévue · "+moment.minutes+" minutes",color=logeGold,fontSize=13.sp)
                when(moment.status) {
                    "scheduled" -> {
                        Text("En attente de la réponse du membre.",color=sceneMuted,fontSize=12.sp)
                        SceneButton("Annuler l’invitation",Modifier.fillMaxWidth()){state.moment(moment.id,"cancelled")}
                        if(com.meewav.android.BuildConfig.DEBUG)Row(horizontalArrangement=Arrangement.spacedBy(6.dp)) {
                            SceneButton("Accepter · démo",Modifier.weight(1f)){state.moment(moment.id,"accepted")}
                            SceneButton("Refuser · démo",Modifier.weight(1f)){state.moment(moment.id,"declined")}
                        }
                    }
                    "accepted" -> {
                        val ready=person.connected&&person.canParticipate&&person.location in setOf(WaveGuestLocation.BACKSTAGE,WaveGuestLocation.STAGE)
                        Text(if(ready)"Prêt en coulisses"else"La préparation du membre doit être terminée.",color=if(ready)logeGreen else sceneMuted,fontSize=12.sp)
                        SceneButton(if(ready)"Lancer dans la Loge"else"Ouvrir les invités",Modifier.fillMaxWidth(),primary=true,icon=WaveIcons.Play){if(ready)state.moment(moment.id,"live")else{state.guests.guestPage=if(person.location==WaveGuestLocation.BACKSTAGE)0 else 1;onGuests()}}
                        SceneButton("Annuler",Modifier.fillMaxWidth()){state.moment(moment.id,"cancelled")}
                    }
                    "live" -> SceneButton("Terminer le moment",Modifier.fillMaxWidth(),primary=true,icon=Icons.Default.Stop){state.moment(moment.id,"completed")}
                }
            }
        }
        Text("Atelier de démonstration · les invitations ne sont pas envoyées à un compte réel.",color=sceneMuted,fontSize=10.sp,modifier=Modifier.padding(horizontal=6.dp))
    }
}

@Composable private fun LogeQuestionsPanel(state:LogeToolsState) {
    var filter by remember{mutableStateOf("pending")}
    val shown=state.data.questions.filter { q -> state.people.any { it.id==q.personId } && if(filter=="pending")q.status in setOf("pending","selected")else q.status==filter }.sortedBy{it.status!="selected"}
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(top=5.dp,bottom=12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
        item { Text("Questions des invités de la Loge",color=sceneMuted,fontSize=11.sp,modifier=Modifier.padding(vertical=6.dp)) }
        item { Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
            SceneChoice(when(filter){"answered"->"Répondues";"rejected"->"Archivées";else->"À traiter · "+state.data.questions.count{it.status=="pending"}},listOf("pending" to "À traiter","answered" to "Répondues","rejected" to "Archivées"),Modifier.weight(1f)){filter=it}
            LogeOpenChip(state.data.questionsOpen){state.toggleQuestions()}
        } }
        items(shown,key={it.id}) { q -> SceneCard {
            val person=state.people.find { it.id==q.personId }
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(9.dp)) {
                if(person!=null)LogePortrait(state,person,36.dp)
                Column(Modifier.weight(1f)){Text(person?.name?:"Membre",color=Color.White,fontSize=13.sp,fontWeight=FontWeight.SemiBold);if(q.status=="selected")Text(if(state.displayedQuestion?.id==q.id)"À l’écran"else"Sélectionnée",color=logeGold,fontSize=10.sp)}
            }
            Text(q.text,color=Color.White,fontSize=13.sp,lineHeight=19.sp)
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(5.dp)) {
                SceneIcon(WaveIcons.Chat,"Répondre en privé"){state.message(q.personId)}
                when(q.status) {
                    "pending" -> {SceneButton("Afficher",Modifier.weight(1f),primary=true,icon=WaveIcons.Eye){state.question(q.id,"selected")};SceneIcon(Icons.Default.Archive,"Archiver"){state.question(q.id,"rejected")}}
                    "selected" -> {SceneButton("Répondue",Modifier.weight(1f),icon=Icons.Default.Check){state.question(q.id,"answered")};SceneButton("VIP",primary=true){state.openVip(q.personId)}}
                    else -> SceneButton("Remettre dans la file",Modifier.weight(1f),icon=Icons.Default.Replay){state.question(q.id,"pending")}
                }
            }
        } }
        if(shown.isEmpty())item{LogeEmpty("Aucune question dans cette liste.")}
    }
}

@Composable private fun LogePollPanel(state:LogeToolsState,onChat:()->Unit) {
    var question by remember{mutableStateOf("")}
    var mode by remember{mutableIntStateOf(0)}
    var duration by remember{mutableIntStateOf(15)}
    val poll=state.data.poll
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical=5.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        if(poll==null)SceneCard {
            Text("L’avis de ta Loge",color=Color.White,fontSize=18.sp,fontWeight=FontWeight.SemiBold)
            Text("Une question, deux réponses, un résultat en direct.",color=sceneMuted,fontSize=12.sp)
            SceneField("Ta question · 160 caractères",question,{question=it.take(160)},lines=2)
            Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){listOf("Oui / Non","Pour / Contre").forEachIndexed { i,label->SceneButton(label,Modifier.weight(1f),primary=mode==i){mode=i} }}
            Text("Durée",color=sceneMuted,fontSize=11.sp)
            Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){listOf(15,30,60).forEach { seconds->SceneButton("$seconds s",Modifier.weight(1f),primary=duration==seconds){duration=seconds} }}
            SceneButton("Lancer le sondage",Modifier.fillMaxWidth(),primary=true,enabled=question.isNotBlank(),icon=Icons.Default.BarChart){state.launchPoll(question,if(mode==0)listOf("Oui","Non")else listOf("Pour","Contre"),duration)}
        } else {
            LogePollCard(state,false)
            Row(horizontalArrangement=Arrangement.spacedBy(6.dp)) {
                SceneButton("Voir le chat",Modifier.weight(1f),icon=WaveIcons.Chat,onClick=onChat)
                if(state.activePoll!=null)SceneButton("Arrêter",Modifier.weight(1f),icon=Icons.Default.Stop){state.stopPoll()}
                else SceneButton("Nouveau",Modifier.weight(1f),primary=true){state.clearPoll()}
            }
            SceneButton("Relancer ce sondage",Modifier.fillMaxWidth(),icon=Icons.Default.Replay){state.stopPoll();state.launchPoll(poll.question,poll.choices,duration)}
            if(com.meewav.android.BuildConfig.DEBUG && state.activePoll!=null)Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){poll.choices.forEachIndexed { i,label->SceneButton("Démo · $label",Modifier.weight(1f)){state.demoVote(i)} }}
        }
    }
}
@Composable internal fun LogePollCard(state:LogeToolsState,compact:Boolean) {
    val p=state.data.poll?:return
    SceneCard {
        Row { Text(if(state.activePoll!=null)"Sondage en cours"else"Sondage terminé",color=logeGold,fontSize=11.sp,modifier=Modifier.weight(1f));Text(sceneClock(((p.endsAt-state.now+999)/1000).coerceAtLeast(0)),color=sceneMuted,fontSize=11.sp) }
        Text(p.question,color=Color.White,fontSize=if(compact)12.sp else 16.sp,fontWeight=FontWeight.SemiBold,maxLines=if(compact)2 else 5)
        p.choices.forEachIndexed { i,label->
            val votes=p.votes.values.count { it==i };val ratio=if(p.votes.isEmpty())0f else votes.toFloat()/p.votes.size
            Row {Text(label,color=sceneMuted,fontSize=11.sp,modifier=Modifier.weight(1f));Text("${(ratio*100).toInt()} %",color=Color.White,fontSize=11.sp)}
            Box(Modifier.fillMaxWidth().height(3.dp).clip(CircleShape).background(Color(0xFF2C2637))){Box(Modifier.fillMaxWidth(ratio).fillMaxHeight().background(sceneAccent))}
        }
        if(!compact)Text("${p.votes.size} vote(s) · démonstration locale",color=sceneMuted,fontSize=10.sp)
    }
}
@Composable internal fun LogeOpenChip(open:Boolean,onClick:()->Unit) {
    Row(Modifier.heightIn(min=44.dp).clip(RoundedCornerShape(12.dp)).clickable(onClick=onClick).padding(horizontal=10.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(5.dp).background(if(open)logeGreen else logeRed,CircleShape));Text(if(open)"Ouvert"else"Fermé",color=Color.White,fontSize=11.sp)
    }
}
@Composable internal fun LogeEmpty(text:String) { Text(text,color=sceneMuted,fontSize=12.sp,modifier=Modifier.padding(14.dp)) }
@Composable internal fun logeFieldColors()=OutlinedTextFieldDefaults.colors(focusedTextColor=Color.White,unfocusedTextColor=Color.White,focusedBorderColor=sceneAccent,unfocusedBorderColor=Color(0xFF35313D),focusedLabelColor=sceneAccent,unfocusedLabelColor=sceneMuted,cursorColor=sceneAccent)
internal fun logeMomentLabel(status:String)=when(status){"scheduled"->"Invitation envoyée";"accepted"->"Invitation acceptée";"live"->"En direct";"completed"->"Terminé";"declined"->"Refusé";"cancelled"->"Annulé";else->status}

@Composable internal fun LogeVideoSignals(state:LogeToolsState,modifier:Modifier=Modifier) {
    val q=state.displayedQuestion
    val draw=state.data.gifts.find { it.id==state.showDrawId && it.status in setOf("spinning","revealed") }
    if(q!=null || draw!=null)Row(modifier.padding(horizontal=38.dp).fillMaxWidth().hifiBlackSurface(12.dp).padding(10.dp),verticalAlignment=Alignment.CenterVertically) {
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(3.dp)) {
            if(draw!=null) {
                Text(if(draw.status=="spinning")"Tirage · "+((draw.animationSeconds*1000-state.now+(draw.startedAt?:state.now)+999)/1000).coerceAtLeast(0)+" s"else"Cadeau remporté",color=logeGold,fontSize=10.sp)
                Text(if(draw.status=="spinning")"${draw.pool.size} participants"else draw.winner?.name.orEmpty(),color=Color.White,fontSize=14.sp,fontWeight=FontWeight.SemiBold)
            } else if(q!=null) {Text("Question de "+(state.people.find{it.id==q.personId}?.name?:"la Loge"),color=logeGold,fontSize=10.sp);Text(q.text,color=Color.White,fontSize=12.sp,maxLines=3,overflow=TextOverflow.Ellipsis)}
        }
        if(draw?.status=="revealed")SceneIcon(WaveIcons.Close,"Masquer le résultat"){state.showDrawId=null}
    }
}
