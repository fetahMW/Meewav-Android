package com.meewav.android.features.rooms.wave

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.*
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*

@Composable internal fun PlaceToolsPanel(state:PlaceToolsState,onGuests:()->Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().height(44.dp)) {
            listOf("Parole","Clash","Défis").forEachIndexed{i,label->Box(Modifier.weight(1f).fillMaxHeight().clickable{state.tab=i},contentAlignment=Alignment.Center){
                Text(label,color=if(i==state.tab)Color.White else sceneMuted,fontSize=12.sp,fontWeight=FontWeight.SemiBold)
                if(i==state.tab)Box(Modifier.align(Alignment.BottomCenter).padding(bottom=5.dp).width(34.dp).height(2.dp).background(Brush.horizontalGradient(listOf(Color.Transparent,sceneAccent,Color.Transparent)),CircleShape))
            }}
        }
        state.notice?.let { Row(verticalAlignment=Alignment.CenterVertically){Text(it,Modifier.weight(1f),color=sceneAccent,fontSize=11.sp);SceneIcon(WaveIcons.Close,"Fermer le message"){state.notice=null}} }
        Box(Modifier.weight(1f)){when(state.tab){0->PlaceFloorPanel(state,onGuests);1->PlaceClashPanel(state);else->PlaceChallengesPanel(state)}}
    }
}

@Composable private fun PlaceField(value:String,onValue:(String)->Unit,hint:String) {
    BasicTextField(value,{onValue(it.take(160))},Modifier.fillMaxWidth().heightIn(min=44.dp).hifiBlackSurface(12.dp).padding(12.dp),singleLine=true,textStyle=TextStyle(color=Color.White,fontSize=12.sp),cursorBrush=SolidColor(sceneAccent),decorationBox={field->Box{if(value.isEmpty())Text(hint,color=sceneMuted,fontSize=12.sp);field()}})
}
@Composable private fun <T> PlaceChoice(label:String,choices:List<Pair<T,String>>,modifier:Modifier=Modifier.fillMaxWidth(),onSelect:(T)->Unit) {
    var open by remember{mutableStateOf(false)}
    Box(modifier){
        Row(Modifier.fillMaxWidth().height(44.dp).hifiBlackSurface(12.dp).clickable{open=true}.padding(horizontal=12.dp),verticalAlignment=Alignment.CenterVertically){Text(label,Modifier.weight(1f),color=Color(0xFFD1CED8),fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis);Icon(Icons.Default.ExpandMore,null,Modifier.size(18.dp),tint=sceneAccent)}
        DropdownMenu(open,{open=false},containerColor=Color(0xFF101114),tonalElevation=0.dp,shape=RoundedCornerShape(12.dp),modifier=Modifier.heightIn(max=300.dp)){choices.forEach{(value,text)->DropdownMenuItem(text={Text(text,color=Color.White,fontSize=12.sp)},onClick={open=false;onSelect(value)})}}
    }
}
@Composable private fun PlaceDuration(seconds:Int,onSelect:(Int)->Unit){PlaceChoice("Durée · "+sceneClock(seconds.toLong()),placeDurations.map{it to sceneClock(it.toLong())},onSelect=onSelect)}
@Composable private fun PlacePortrait(state:PlaceToolsState,id:String?,size:Dp=40.dp) {
    val person=state.guests.guests.find{it.id==id}
    if(person!=null)Image(painterResource(person.portrait),"Pré-profil de "+person.name,Modifier.size(size).clip(CircleShape).clickable{state.profile(person.id)},contentScale=ContentScale.Crop)
    else Box(Modifier.size(size).background(Color(0xFF161619),CircleShape),contentAlignment=Alignment.Center){Icon(if(id=="host")Icons.Default.Person else Icons.Default.Mic,null,tint=sceneAccent,modifier=Modifier.size(size*.48f))}
}
private fun PlaceToolsState.name(id:String?)=if(id=="host")"Vous"else guests.guests.find{it.id==id}?.name?:"Participant indisponible"
@Composable private fun PlaceTimer(clock:PlaceClock,now:Long,paused:Boolean=false) {
    val left=clock.left(now)
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)){
        Text(sceneClock(left.toLong()),color=if(left==0)logeGold else Color.White,fontSize=27.sp,fontFamily=FontFamily.Monospace,fontWeight=FontWeight.Medium)
        Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(6.dp)) {
            Text(if(left==0)"Temps écoulé"else if(paused)"En pause"else"Temps de parole",color=sceneMuted,fontSize=10.sp)
            Box(Modifier.fillMaxWidth().height(3.dp).clip(CircleShape).background(Color(0xFF29272E))){Box(Modifier.fillMaxWidth((left.toFloat()/clock.seconds).coerceIn(0f,1f)).fillMaxHeight().background(sceneAccent))}
        }
    }
}
@Composable private fun PlaceFloorPanel(state:PlaceToolsState,onGuests:()->Unit) {
    val floor=state.data.floor
    var adding by remember{mutableStateOf(false)}
    var settings by remember{mutableStateOf(false)}
    var prompt by remember(floor.prompt){mutableStateOf(floor.prompt)}
    var seconds by remember(floor.clock.seconds){mutableIntStateOf(floor.clock.seconds)}
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
        item{SceneCard {
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
                PlacePortrait(state,floor.current,48.dp)
                Column(Modifier.weight(1f)){Text(if(floor.current==null)"À vous de parler"else state.name(floor.current),color=Color.White,fontSize=16.sp,fontWeight=FontWeight.SemiBold);Text(floor.prompt.ifBlank{"Une question, une histoire, un point de vue."},color=sceneMuted,fontSize=11.sp,maxLines=2)}
                SceneIcon(Icons.Default.Tune,"Réglages du tour",enabled=floor.current==null){settings=!settings}
            }
            PlaceTimer(floor.clock,state.now,floor.status=="paused")
            Row(verticalAlignment=Alignment.CenterVertically){
                SceneIcon(if(floor.status=="paused")WaveIcons.Play else Icons.Default.Pause,if(floor.status=="paused")"Reprendre"else"Pause",enabled=floor.current!=null){state.pauseFloor()}
                SceneButton(if(floor.current==null)"Donner la parole"else"Personne suivante",Modifier.weight(1f),primary=true,enabled=floor.queue.isNotEmpty(),icon=if(floor.current==null)WaveIcons.Play else Icons.Default.SkipNext){state.nextFloor()}
                SceneIcon(Icons.Default.Stop,"Terminer le tour",enabled=floor.current!=null){state.endFloor()}
            }
        }}
        if(settings&&floor.current==null)item{SceneCard {
            PlaceField(prompt,{prompt=it},"Question de départ · facultatif")
            PlaceDuration(seconds){seconds=it}
            SceneButton("Appliquer",Modifier.fillMaxWidth(),primary=true){if(state.configureFloor(prompt,seconds))settings=false}
        }}
        item{Row(verticalAlignment=Alignment.CenterVertically){Text("À suivre · ${floor.queue.size}",Modifier.weight(1f),color=Color.White,fontSize=12.sp,fontWeight=FontWeight.SemiBold);LogeOpenChip(floor.open){state.toggleFloor()};SceneIcon(if(adding)WaveIcons.Close else Icons.Default.Add,"Ajouter depuis les coulisses"){adding=!adding}}}
        if(adding){
            val available=state.backstage.filter{it.id!=floor.current&&it.id !in floor.queue}
            item{Text("Prêts en coulisses",color=sceneMuted,fontSize=11.sp)}
            items(available,key={"add-"+it.id}){person->Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(horizontal=10.dp,vertical=5.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(9.dp)){PlacePortrait(state,person.id,32.dp);Text(person.name,Modifier.weight(1f),color=Color.White,fontSize=12.sp);SceneIcon(Icons.Default.Add,"Ajouter "+person.name){if(state.joinFloor(person.id))adding=false}}}
            if(available.isEmpty())item{SceneButton("Ouvrir les invités",Modifier.fillMaxWidth(),icon=Icons.Default.People,onClick=onGuests)}
        }
        itemsIndexed(floor.queue,key={_,id->"queue-$id"}){index,id->Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).padding(horizontal=10.dp,vertical=5.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(9.dp)){
            Text("${index+1}",color=sceneMuted,fontSize=11.sp);PlacePortrait(state,id,34.dp);Text(state.name(id),Modifier.weight(1f),color=Color.White,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
            SceneIcon(WaveIcons.Chat,"Message à "+state.name(id)){state.message(id)};SceneIcon(WaveIcons.Close,"Retirer de la file",tint=logeRed){state.leaveFloor(id)}
        }}
        if(floor.queue.isEmpty()&&!adding)item{SceneButton("Ajouter depuis les coulisses",Modifier.fillMaxWidth(),icon=Icons.Default.Add){adding=true}}
        item{Text("Le tour organise la parole. Chacun garde le contrôle de son micro.",color=sceneMuted,fontSize=10.sp)}
    }
}

@Composable private fun PlaceClashPanel(state:PlaceToolsState) {
    val c=state.data.clash
    val active=c!=null&&c.status in setOf("inviting","running","paused")
    var title by remember{mutableStateOf("")}
    var left by remember{mutableStateOf(state.people.firstOrNull()?.id.orEmpty())}
    var right by remember{mutableStateOf(state.people.getOrNull(1)?.id.orEmpty())}
    var seconds by remember{mutableIntStateOf(60)}
    var rounds by remember{mutableIntStateOf(3)}
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(9.dp)) {
        if(active&&c!=null){
            item{SceneCard {
                Text(c.title,color=Color.White,fontSize=15.sp,fontWeight=FontWeight.SemiBold)
                Text(if(c.status=="inviting")"Accord des participants"else"Manche ${c.round} / ${c.rounds}",color=sceneAccent,fontSize=11.sp)
                Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){
                    listOf(c.left,c.right).forEachIndexed{i,id->
                        if(i==1)Text("VS",color=sceneMuted,fontSize=12.sp)
                        Column(Modifier.weight(1f),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(5.dp)){
                            Box(Modifier.border(if(c.turn==i&&c.status=="running")1.dp else 0.dp,if(c.turn==i&&c.status=="running")sceneAccent else Color.Transparent,CircleShape).padding(4.dp)){PlacePortrait(state,id,52.dp)}
                            Text(state.name(id),color=Color.White,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
                            Text(if(c.status=="inviting")if(id in c.accepted)"Accord reçu"else"Invité"else if(c.turn==i)if(c.status=="paused")"En pause"else"À vous de parler"else"À l’écoute",color=if(c.turn==i&&c.status!="inviting")sceneAccent else sceneMuted,fontSize=10.sp)
                        }
                    }
                }
                if(c.status!="inviting")PlaceTimer(c.clock,state.now,c.status=="paused")
                Row(verticalAlignment=Alignment.CenterVertically){
                    if(c.status!="inviting")SceneIcon(if(c.status=="paused")WaveIcons.Play else Icons.Default.Pause,"Pause / reprendre"){state.pauseClash()}
                    SceneButton(if(c.status=="inviting")"Lancer le clash"else if(c.turn==1&&c.round==c.rounds)"Clore le clash"else"Passage suivant",Modifier.weight(1f),primary=true,enabled=c.status!="inviting"||listOf(c.left,c.right).all{it in c.accepted},icon=WaveIcons.Play){state.nextClash()}
                    SceneIcon(Icons.Default.Stop,"Arrêter le clash"){state.endClash()}
                }
            }}
            if(c.status=="inviting"&&com.meewav.android.BuildConfig.DEBUG)item{SceneCard{
                Text("Réponses des participants · démo",color=sceneMuted,fontSize=10.sp)
                listOf(c.left,c.right).forEach{id->Row(verticalAlignment=Alignment.CenterVertically){Text(state.name(id),Modifier.weight(1f),color=Color.White,fontSize=11.sp,maxLines=1);SceneIcon(Icons.Default.Check,"Simuler l’accord de "+state.name(id),enabled=id !in c.accepted){state.answerClash(id,true)};SceneIcon(WaveIcons.Close,"Simuler le refus de "+state.name(id),tint=logeRed){state.answerClash(id,false)}}}
            }}
        }else{
            if(c!=null)item{Text(if(c.status=="ended")"Clash terminé · "+c.title else "Clash annulé · "+c.title,color=sceneMuted,fontSize=11.sp)}
            item{SceneCard{
                Text("Un sujet, deux points de vue",color=Color.White,fontSize=16.sp,fontWeight=FontWeight.SemiBold)
                Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){Box(Modifier.weight(1f),contentAlignment=Alignment.Center){PlacePortrait(state,left,48.dp)};Text("VS",color=sceneMuted,fontSize=12.sp);Box(Modifier.weight(1f),contentAlignment=Alignment.Center){PlacePortrait(state,right,48.dp)}}
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
                    PlaceChoice(state.name(left),state.people.map{it.id to it.name},Modifier.weight(1f)){left=it}
                    PlaceChoice(state.name(right),state.people.filter{it.id!=left}.map{it.id to it.name},Modifier.weight(1f)){right=it}
                }
                PlaceField(title,{title=it},"Le talent ou le travail ?")
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
                    PlaceChoice("$rounds manche(s)",listOf(1,3,5).map{it to "$it manche(s)"},Modifier.weight(1f)){rounds=it}
                    PlaceChoice(sceneClock(seconds.toLong())+" / personne",placeDurations.map{it to sceneClock(it.toLong())},Modifier.weight(1f)){seconds=it}
                }
                SceneButton("Inviter les deux participants",Modifier.fillMaxWidth(),primary=true,enabled=title.isNotBlank()&&left!=right&&left.isNotEmpty()&&right.isNotEmpty(),icon=Icons.Default.People){state.inviteClash(title,left,right,seconds,rounds)}
                Text("Deux accords pour commencer. Même durée pour chacun.",color=sceneMuted,fontSize=10.sp)
            }}
        }
    }
}

@Composable private fun PlaceChallengesPanel(state:PlaceToolsState) {
    var editing by remember{mutableStateOf(state.data.challenges.isEmpty())}
    var title by remember{mutableStateOf("")}
    var target by remember{mutableStateOf<String?>(null)}
    var seconds by remember{mutableIntStateOf(60)}
    var history by remember{mutableStateOf(false)}
    var responseId by remember{mutableStateOf<String?>(null)}
    val active=state.data.challenges.filter{it.status in setOf("open","running")}
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(9.dp)){
        item{Row(verticalAlignment=Alignment.CenterVertically){Text("Défis · ${active.size}",Modifier.weight(1f),color=Color.White,fontSize=15.sp,fontWeight=FontWeight.SemiBold);SceneIcon(Icons.Default.History,"Défis terminés"){history=!history};SceneIcon(if(editing)WaveIcons.Close else Icons.Default.Add,"Créer un défi"){editing=!editing}}}
        if(editing)item{SceneCard{
            PlaceField(title,{title=it},"Raconte une histoire en une minute…")
            PlaceChoice(target?.let{state.name(it)}?:"Tout le monde",listOf(null to "Tout le monde")+state.people.map{it.id to it.name}){target=it}
            PlaceDuration(seconds){seconds=it}
            SceneButton("Proposer le défi",Modifier.fillMaxWidth(),primary=true,enabled=title.isNotBlank()&&active.size<6,icon=Icons.Default.Bolt){if(state.createChallenge(title,target,seconds)){title="";editing=false;history=false}}
        }}
        val shown=if(history)state.data.challenges.filter{it.status !in setOf("open","running")}else active
        if(shown.isEmpty()&&!editing)item{Text(if(history)"Aucun défi terminé."else"Le prochain défi commence avec une idée.",color=sceneMuted,fontSize=12.sp)}
        items(shown,key={it.id}){c->SceneCard{
            Row(verticalAlignment=Alignment.CenterVertically){Text(when(c.status){"open"->"À relever";"running"->"En cours";"done"->"Réussite validée";else->"Annulé"},Modifier.weight(1f),color=sceneAccent,fontSize=10.sp);Text(c.target?.let{state.name(it)}?:"Collectif",color=sceneMuted,fontSize=10.sp)}
            Text(c.title,color=Color.White,fontSize=14.sp,fontWeight=FontWeight.SemiBold)
            Text("Proposé par "+state.name(c.author),color=sceneMuted,fontSize=10.sp)
            if(c.status=="running")PlaceTimer(c.clock,state.now)else if(c.status=="open")Text(sceneClock(c.clock.seconds.toLong())+" · ${c.accepted.size} inscrit(s)",color=sceneMuted,fontSize=11.sp)
            if(c.status in setOf("open","running")){
                Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(6.dp)){
                    SceneButton(if(c.status=="open")"Lancer"else"Valider (${c.completed.size})",Modifier.weight(1f),primary=true,enabled=if(c.status=="open")c.accepted.isNotEmpty()else c.completed.isNotEmpty(),icon=if(c.status=="open")WaveIcons.Play else Icons.Default.Check){state.challenge(c.id,if(c.status=="open")"start"else"validate")}
                    SceneIcon(WaveIcons.Close,"Annuler le défi",tint=logeRed){state.challenge(c.id,"cancel")}
                }
                if(com.meewav.android.BuildConfig.DEBUG){
                    SceneButton(if(responseId==c.id)"Fermer les réponses"else"Réponses · démo",Modifier.fillMaxWidth()){responseId=if(responseId==c.id)null else c.id}
                    if(responseId==c.id){
                        val candidates=if(c.status=="open")state.people.filter{(c.target==null||it.id==c.target)&&it.id !in c.accepted}.map{it.id}else c.accepted.filter{it !in c.completed}
                        PlaceChoice(if(c.status=="open")"Simuler une acceptation"else"Simuler un défi terminé",candidates.map{it to state.name(it)}){state.challenge(c.id,if(c.status=="open")"accept"else"complete",it)}
                    }
                }
            }
        }}
    }
}
