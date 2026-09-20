package com.meewav.android.features.rooms.wave

import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import androidx.compose.ui.res.painterResource
import com.meewav.android.R
import java.util.UUID

internal data class LogeGiftType(val name:String,val detail:String,val color:Color,val icon:ImageVector)
internal val logeGiftCatalog=listOf(
    LogeGiftType("Distinction Live","Reconnaît la qualité de cette prestation.",Color(0xFF9859FF),Icons.Default.VerifiedUser),
    LogeGiftType("Pass VIP","Une priorité pour la prochaine ronde.",Color(0xFF3DE2BD),Icons.Default.ConfirmationNumber),
    LogeGiftType("Cadeau surprise","Une attention à nommer et à illustrer.",Color(0xFF4A9DFF),Icons.Default.CardGiftcard),
    LogeGiftType("Supporter d’Or","Récompense le soutien financier le plus important.",Color(0xFFEFB54A),Icons.Default.EmojiEvents),
    LogeGiftType("Bonus supporter","Remercie une présence fidèle.",Color(0xFFFF4F91),Icons.Default.Favorite),
    LogeGiftType("La Certif","Une recommandation signée · grade 4 minimum.",Color(0xFF35DCF4),Icons.Default.Verified)
)
@Composable private fun RoomGiftBadge(code:Int,size:Dp=56.dp) {
    val assets=listOf(R.drawable.room_gift_web_0,R.drawable.room_gift_web_1,R.drawable.room_gift_web_2,R.drawable.room_gift_web_3,R.drawable.room_gift_web_4,R.drawable.room_gift_web_5)
    Image(painterResource(assets[code]),logeGiftCatalog[code].name,Modifier.size(size))
}

@Composable internal fun LogeGiftPanel(state:LogeToolsState,directRecipientId:String?=null) {
    var drawMode by remember{mutableStateOf(false)}
    var step by remember{mutableIntStateOf(0)}
    var code by remember{mutableIntStateOf(-1)}
    var recipient by remember{mutableStateOf(directRecipientId?:state.selectedId)}
    var customTitle by remember{mutableStateOf("")}
    var customImage by remember{mutableStateOf("")}
    var poolMode by remember{mutableStateOf("queue")}
    var ids by remember{mutableStateOf(setOf<String>())}
    var names by remember{mutableStateOf("")}
    var search by remember{mutableStateOf("")}
    var delivery by remember{mutableStateOf("now")}
    var date by remember{mutableStateOf<Long?>(null)}
    var round by remember{mutableStateOf("Ronde actuelle")}
    var seconds by remember{mutableIntStateOf(7)}
    var operationId by remember{mutableStateOf(UUID.randomUUID().toString())}
    var completedId by remember{mutableStateOf<String?>(null)}
    var history by remember{mutableStateOf(false)}
    val context=LocalContext.current
    val picker=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()){uri->if(uri!=null){runCatching{context.contentResolver.takePersistableUriPermission(uri,Intent.FLAG_GRANT_READ_URI_PERMISSION)};customImage=uri.toString()}}
    val candidates=when(poolMode){
        "manual" -> names.lines().map{it.trim().take(80)}.filter{it.isNotBlank()}.distinctBy{it.lowercase()}.take(100).map{LogeCandidate("manual:"+it.lowercase(),it)}
        "selected" -> state.people.filter{it.id in ids && it.connected}.map{LogeCandidate(it.id,it.name)}
        "room" -> state.people.filter{it.connected}.map{LogeCandidate(it.id,it.name)}
        else -> state.people.filter{it.location==WaveGuestLocation.REQUESTED && it.connected}.map{LogeCandidate(it.id,it.name)}
    }
    fun reset(){step=0;code=-1;customTitle="";customImage="";completedId=null;delivery="now";date=null;round="Ronde actuelle";ids=emptySet();names="";search="";operationId=UUID.randomUUID().toString();state.notice=null}
    val completed=state.data.gifts.find{it.id==completedId}
    Column(Modifier.fillMaxSize()) {
        state.notice?.let{Text(it,color=logeRed,fontSize=11.sp)}
        if(directRecipientId==null) Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(6.dp)){
            Row(Modifier.weight(1f).hifiBlackSurface(10.dp),verticalAlignment=Alignment.CenterVertically) {
                listOf("Offrir","Tirage").forEachIndexed { index,label ->
                    val active=!history && drawMode==(index==1)
                    Box(Modifier.weight(1f).height(40.dp).background(if(active)WaveMixerTheme.capsuleAccent.copy(alpha=.17f)else Color.Transparent,RoundedCornerShape(10.dp)).clickable { drawMode=index==1;history=false;reset() },contentAlignment=Alignment.Center) {
                        Text(label,color=if(active)WaveMixerTheme.capsuleAccentSoft else sceneMuted,fontSize=12.sp,fontWeight=FontWeight.SemiBold)
                    }
                }
            }
            SceneIcon(Icons.Default.History,"Historique des cadeaux"){history=!history}
        }
        if(history) {
            LazyColumn(Modifier.weight(1f),contentPadding=PaddingValues(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                items(state.data.gifts,key={it.id}){gift->LogeGiftStatus(state,gift)}
                if(state.data.gifts.isEmpty())item{LogeEmpty("Aucun cadeau préparé. Ton inventaire est disponible dans Offrir.")}
            }
        } else if(completed!=null) {
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                LogeGiftStatus(state,completed)
                SceneButton("Préparer un autre cadeau",Modifier.fillMaxWidth(),icon=Icons.Default.Add){reset()}
            }
        } else {
            Row(Modifier.padding(vertical=6.dp),horizontalArrangement=Arrangement.spacedBy(7.dp)) {
                (if(directRecipientId!=null) listOf("Cadeau","Envoi") else listOf("Cadeau",if(drawMode)"Participants"else"Destinataire",if(drawMode)"Diffusion"else"Envoi")).forEachIndexed { i,label->
                    Text("${i+1} · $label",color=if(i==(if(directRecipientId!=null&&step==2)1 else step))logeGold else sceneMuted.copy(alpha=.6f),fontSize=10.sp,modifier=Modifier.weight(1f))
                }
            }
            Column(Modifier.weight(1f).verticalScroll(rememberScrollState()),verticalArrangement=Arrangement.spacedBy(9.dp)) {
                when(step) {
                    0 -> {
                        Column(Modifier.fillMaxWidth(),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                            logeGiftCatalog.chunked(2).forEachIndexed { row,gifts ->
                                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                                gifts.forEachIndexed { column,gift ->
                                    val index=row*2+column
                                    val available=state.data.stock[index]>0
                                    Column(Modifier.weight(1f).hifiBlackSurface(14.dp)
                                        .then(if(code==index)Modifier.border(.8.dp,gift.color,RoundedCornerShape(14.dp))else Modifier)
                                        .clickable(enabled=available){code=index}.padding(horizontal=8.dp,vertical=8.dp),
                                        horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(3.dp)) {
                                        RoomGiftBadge(index,72.dp)
                                        Text(gift.name,color=if(available)Color.White else sceneMuted,fontSize=11.sp,maxLines=2,minLines=2,textAlign=androidx.compose.ui.text.style.TextAlign.Center,fontWeight=FontWeight.SemiBold)
                                        Text("${state.data.stock[index]} disponibles",color=sceneMuted,fontSize=10.sp)
                                    }
                                }
                            }
                            }
                        }
                        if(code==2){SceneField("Nom du cadeau surprise",customTitle,{customTitle=it.take(80)});SceneButton(if(customImage.isBlank())"Ajouter une image"else"Changer l’image",Modifier.fillMaxWidth(),icon=Icons.Default.Image){picker.launch(arrayOf("image/*"))};if(customImage.isNotBlank())SceneCampaignCover(customImage)}
                    }
                    1 -> {
                        if(drawMode) {
                            SceneChoice(when(poolMode){"manual"->"Noms saisis";"room"->"Toute la Room";"selected"->"Sélection personnalisée";else->"File d’attente"},listOf("queue" to "File d’attente","room" to "Toute la Room","selected" to "Sélection personnalisée","manual" to "Noms saisis")){poolMode=it}
                            if(poolMode=="manual")SceneField("Un nom par ligne · 100 maximum",names,{names=it.take(8000)},lines=5)
                            Text("${candidates.size} participants · minimum 2",color=logeGold,fontSize=12.sp)
                        }
                        if(!drawMode||poolMode=="selected") {
                            SceneField("Rechercher une personne",search,{search=it.take(80)})
                            state.people.filter{it.name.contains(search,true)}.forEach{person->
                                val selected=if(drawMode)person.id in ids else recipient==person.id
                                Row(Modifier.fillMaxWidth().hifiBlackSurface(12.dp).clickable{if(drawMode)ids=if(selected)ids-person.id else ids+person.id else recipient=person.id}.padding(8.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){
                                    LogePortrait(state,person,32.dp);Column(Modifier.weight(1f)){Text(person.name,color=Color.White,fontSize=12.sp);Text(person.location.label,color=sceneMuted,fontSize=10.sp)}
                                    Icon(if(selected)Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,null,tint=if(selected)sceneAccent else sceneMuted,modifier=Modifier.size(20.dp))
                                }
                            }
                        }
                    }
                    2 -> {
                        val gift=logeGiftCatalog.getOrNull(code)
                        if(gift!=null)SceneCard{
                            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){Icon(gift.icon,null,tint=gift.color,modifier=Modifier.size(30.dp));Column{Text(if(code==2)customTitle else gift.name,color=Color.White,fontSize=15.sp);Text(if(drawMode)"${candidates.size} participants"else state.people.find{it.id==recipient}?.name.orEmpty(),color=logeGold,fontSize=12.sp)}}
                            Text(gift.detail,color=sceneMuted,fontSize=11.sp)
                        }
                        SceneChoice(when(delivery){"scheduled"->"Programmer";"round"->"Ajouter à une ronde";else->if(drawMode)"Préparer maintenant"else"Envoyer maintenant"},(listOf("now" to if(drawMode)"Préparer maintenant"else"Envoyer maintenant","scheduled" to "Programmer")+if(drawMode)emptyList()else listOf("round" to "Ajouter à une ronde"))){delivery=it}
                        if(delivery=="scheduled")SceneDateField("Date et heure",date){date=it}
                        if(delivery=="round")SceneChoice(round,listOf("Ronde actuelle","Nouvelle ronde","Fans récents","Participants actifs").map{it to it}){round=it}
                        if(drawMode){Text("Animation à l’écran",color=sceneMuted,fontSize=11.sp);Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){listOf(5,7,10).forEach{n->SceneButton("$n s",Modifier.weight(1f),primary=seconds==n){seconds=n}}};Text("Seuls le compteur et le gagnant apparaissent à l’écran. Les autres noms restent privés.",color=sceneMuted,fontSize=11.sp)}
                        Text("Inventaire et envois de démonstration. La programmation s’exécute à l’ouverture de cet atelier, sans transfert réel.",color=sceneMuted,fontSize=10.sp)
                    }
                }
                Spacer(Modifier.height(4.dp))
            }
            val canNext=when(step){0->code>=0&&state.data.stock.getOrElse(code){0}>0&&(code!=2||customTitle.isNotBlank());1->if(drawMode)candidates.size>=2 else state.people.any{it.id==recipient};else->delivery!="scheduled"||(date?:0)>state.now}
            Row(Modifier.padding(vertical=8.dp),horizontalArrangement=Arrangement.spacedBy(6.dp)){
                if(step>0)SceneButton("Retour",icon=WaveIcons.ChevronLeft){step=if(directRecipientId!=null)0 else step-1}
                SceneButton(if(step<2)"Continuer"else if(drawMode)"Préparer le tirage"else"Confirmer · démo",Modifier.weight(1f),primary=true,enabled=canNext){
                    if(step<2)step=if(directRecipientId!=null)2 else step+1 else {
                        val g=LogeGift(operationId,code,recipientId=if(drawMode)""else recipient,recipientName=if(drawMode)""else state.people.find{it.id==recipient}?.name.orEmpty(),title=if(code==2)customTitle else logeGiftCatalog[code].name,image=customImage,
                            status=if(delivery=="scheduled")"scheduled"else if(drawMode)"ready"else if(delivery=="round")"round"else"sent",scheduledAt=date,round=if(delivery=="round")round else"",pool=if(drawMode)candidates else emptyList(),animationSeconds=seconds)
                        if(state.gift(g))completedId=operationId
                    }
                }
            }
        }
    }
}

@Composable private fun LogeGiftStatus(state:LogeToolsState,g:LogeGift) {
    val type=logeGiftCatalog.getOrNull(g.code)?:return
    SceneCard {
        Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){
            RoomGiftBadge(g.code);Column(Modifier.weight(1f)){Text(g.title.ifBlank{type.name},color=Color.White,fontSize=14.sp,fontWeight=FontWeight.SemiBold);Text(when(g.status){"ready"->"Prêt à diffuser";"scheduled"->"Programmé · "+(g.scheduledAt?.let(::sceneDate)?:"");"spinning"->"Tirage en cours";"revealed"->"Gagnant révélé";"round"->g.round;"cancelled"->"Annulé";else->"Attribué · démo"},color=logeGold,fontSize=11.sp)}
        }
        Text(if(g.pool.isEmpty())"Pour "+g.recipientName else if(g.status=="revealed")"Gagnant · "+g.winner?.name.orEmpty()else"${g.pool.size} participants",color=sceneMuted,fontSize=12.sp)
        if(g.status in setOf("ready","round","scheduled"))Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){
            if(g.status=="ready")SceneButton("Lancer à l’écran",Modifier.weight(1f),primary=true,icon=WaveIcons.Play){state.startDraw(g.id)}
            if(g.status=="round")SceneButton("Attribuer maintenant",Modifier.weight(1f),primary=true){state.deliverRound(g.id)}
            SceneButton("Annuler"){state.cancelGift(g.id)}
        }
        if(g.status=="spinning")LinearProgressIndicator(progress={((state.now-(g.startedAt?:state.now)).toFloat()/(g.animationSeconds*1000)).coerceIn(0f,1f)},modifier=Modifier.fillMaxWidth().height(3.dp),color=sceneAccent,trackColor=Color(0xFF2C2637))
        if(g.status=="revealed")SceneButton("Afficher le gagnant",Modifier.fillMaxWidth(),icon=Icons.Default.EmojiEvents){state.showWinner(g.id)}
    }
}
