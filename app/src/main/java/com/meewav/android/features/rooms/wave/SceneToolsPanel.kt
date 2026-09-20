package com.meewav.android.features.rooms.wave

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import com.meewav.android.R
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.util.*

internal val sceneMuted = Color(0xFFA7A3B2)
internal val sceneAccent = WaveMixerTheme.capsuleAccentSoft

@Composable internal fun SceneToolsPanel(state: SceneToolsState, onGuests: () -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth().height(44.dp), verticalAlignment = Alignment.CenterVertically) {
            listOf("Programme", "Prompteur", "Évaluation", "Cagnotte").forEachIndexed { index, label ->
                Box(Modifier.weight(1f).height(44.dp).clickable { state.tab = index }, contentAlignment = Alignment.Center) {
                    Text(label, color = if (state.tab == index) Color.White else sceneMuted, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
                    if (state.tab == index) Box(Modifier.align(Alignment.BottomCenter).padding(bottom=5.dp).width(32.dp).height(2.dp)
                        .background(Brush.horizontalGradient(listOf(Color.Transparent,sceneAccent,Color.Transparent)),CircleShape))
                }
            }
        }
        state.notice?.let { message -> Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(message,color=sceneAccent,fontSize=11.sp,modifier=Modifier.weight(1f))
            SceneIcon(WaveIcons.Close,"Fermer") { state.notice=null }
        } }
        Box(Modifier.weight(1f)) { when(state.tab) {
            0 -> SceneProgramPanel(state,onGuests)
            1 -> ScenePrompterPanel(state)
            2 -> SceneEvaluationPanel(state)
            3 -> SceneFundraiserPanel(state)
        } }
    }
}

@Composable private fun SceneProgramPanel(state: SceneToolsState, onGuests: () -> Unit) {
    var history by remember { mutableStateOf(false) }
    var expanded by remember { mutableStateOf<String?>(null) }
    var editing by remember { mutableStateOf<SceneEntry?>(null) }
    var removing by remember { mutableStateOf<SceneEntry?>(null) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    LaunchedEffect(state.live?.id) { while(state.live != null) { now=System.currentTimeMillis(); delay(1000) } }
    val live = state.live; val next = state.next
    val entries = if(history) state.data.program.filter { !it.upcoming && it.status != "live" } else state.upcoming
    LazyColumn(Modifier.fillMaxSize(), contentPadding=PaddingValues(top=5.dp,bottom=12.dp), verticalArrangement=Arrangement.spacedBy(8.dp)) {
        item { SceneCard {
            Row(verticalAlignment=Alignment.CenterVertically) {
                Text(if(live==null) "Prêt pour la soirée" else "En scène",color=sceneAccent,fontSize=11.sp,modifier=Modifier.weight(1f))
                Text(if(live==null) state.upcoming.sumOf { it.minutes }.toString()+" min à suivre" else sceneClock(((now-(live.startedAt?:now))/1000).coerceAtLeast(0)),color=sceneMuted,fontSize=11.sp)
            }
            Text(live?.title ?: next?.title ?: "Programme terminé",color=Color.White,fontSize=18.sp,fontWeight=FontWeight.SemiBold,maxLines=1,overflow=TextOverflow.Ellipsis)
            Text(live?.let { it.artistName+" · "+it.kind } ?: next?.let { it.artistName+" · "+it.minutes+" min" } ?: "Ajoute un nouveau passage",color=sceneMuted,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
            if(live!=null) Row(horizontalArrangement=Arrangement.spacedBy(6.dp)) {
                SceneButton("Terminer",Modifier.weight(1f),icon=Icons.Default.Check) { state.status(live.id,"done") }
                if(live.textId.isNotBlank()) SceneIcon(Icons.Default.Article,"Ouvrir le prompteur") { state.openPrompter(live.textId) }
            }
            if(next!=null) {
                if(live!=null) Text("À suivre · "+next.artistName+" · "+next.title,color=sceneMuted,fontSize=11.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
                SceneButton(if(live==null) "Lancer le passage" else "Enchaîner",Modifier.fillMaxWidth(),primary=true,icon=WaveIcons.Play) { state.status(next.id,"live") }
            }
        } }
        item { Row(verticalAlignment=Alignment.CenterVertically) {
            SceneChoice(if(history) "Historique" else "À venir",listOf(false to "À venir",true to "Historique"),Modifier.weight(1f)) { history=it }
            Spacer(Modifier.width(6.dp)); SceneIcon(WaveIcons.Add,"Ajouter un passage") { editing=SceneEntry(artistId=state.people.firstOrNull()?.id.orEmpty(),artistName=state.people.firstOrNull()?.name.orEmpty()) }
        } }
        items(entries,key={it.id}) { entry ->
            SceneCard {
                Row(Modifier.fillMaxWidth().clickable { expanded=if(expanded==entry.id)null else entry.id },verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(9.dp)) {
                    SceneArtist(state,entry.artistId)
                    Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(3.dp)) {
                        Text(entry.title,color=Color.White,fontSize=13.sp,fontWeight=FontWeight.SemiBold,maxLines=1,overflow=TextOverflow.Ellipsis)
                        Row(verticalAlignment=Alignment.CenterVertically) {
                            Text(entry.artistName,color=sceneMuted,fontSize=11.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.weight(1f,false))
                            state.people.find { it.id==entry.artistId }?.let { SceneGrade(it.gradeLevel) }
                        }
                        Text(entry.kind+" · "+entry.minutes+" min"+(if(!state.available(entry))" · Indisponible" else if(history)" · "+entry.statusLabel else ""),color=if(state.available(entry))sceneMuted else Color(0xFFE39199),fontSize=10.sp)
                    }
                    Icon(if(expanded==entry.id) Icons.Default.ExpandLess else Icons.Default.ExpandMore,null,tint=sceneAccent,modifier=Modifier.size(18.dp))
                }
                AnimatedVisibility(expanded==entry.id) {
                    Column(verticalArrangement=Arrangement.spacedBy(7.dp)) {
                        if(entry.description.isNotBlank()) Text(entry.description,color=sceneMuted,fontSize=12.sp)
                        entry.scheduledAt?.let { Text(sceneDate(it)+(if(entry.delayMinutes>0) " · +"+entry.delayMinutes+" min" else ""),color=sceneMuted,fontSize=11.sp) }
                        Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.SpaceBetween) {
                            if(!history) {
                                SceneIcon(Icons.Default.ArrowUpward,"Avancer",enabled=state.upcoming.firstOrNull()?.id!=entry.id) { state.move(entry.id,-1) }
                                SceneIcon(Icons.Default.ArrowDownward,"Reculer",enabled=state.upcoming.lastOrNull()?.id!=entry.id) { state.move(entry.id,1) }
                                SceneIcon(Icons.Default.Edit,"Modifier") { editing=entry }
                                SceneIcon(Icons.Default.SkipNext,"Passer") { state.status(entry.id,"skipped") }
                            } else SceneButton("Reprogrammer",icon=Icons.Default.Replay) { state.status(entry.id,"upcoming");history=false }
                            SceneIcon(WaveIcons.Close,"Supprimer le passage",tint=Color(0xFFE39199)) { removing=entry }
                        }
                        Row(horizontalArrangement=Arrangement.spacedBy(7.dp)) {
                            if(!history) SceneButton("Lancer",Modifier.weight(1f),primary=true,enabled=state.available(entry),icon=WaveIcons.Play) { state.status(entry.id,"live") }
                            if(entry.textId.isNotBlank()) SceneIcon(Icons.Default.Article,"Texte associé") { state.openPrompter(entry.textId) }
                            if(entry.artistId.isNotBlank()) SceneIcon(WaveIcons.Chat,"Écrire à l’artiste") { state.guests.messageRecipientIds=setOf(entry.artistId) }
                        }
                    }
                }
            }
        }
        if(entries.isEmpty()) item { Text(if(history) "Les passages terminés apparaîtront ici." else "Aucun passage à venir.",color=sceneMuted,fontSize=12.sp,modifier=Modifier.padding(12.dp)) }
        item { SceneButton("Gérer les invités",Modifier.fillMaxWidth(),icon=WaveIcons.Group,onClick=onGuests) }
    }
    editing?.let { entry -> SceneEntryEditor(state,entry,{editing=null}) }
    removing?.let { entry -> SceneConfirm("Supprimer ce passage ?",entry.title+" sera retiré du programme.","Supprimer",{removing=null}) { state.removeEntry(entry.id);removing=null } }
}

@Composable private fun SceneEntryEditor(state: SceneToolsState, entry: SceneEntry, dismiss: () -> Unit) {
    var draft by remember(entry.id) { mutableStateOf(entry) }
    var minutes by remember(entry.id) { mutableStateOf(entry.minutes.toString()) }
    var delay by remember(entry.id) { mutableStateOf(entry.delayMinutes.toString()) }
    var advanced by remember { mutableStateOf(false) }
    SceneSheet(if(state.data.program.any { it.id==entry.id })"Modifier le passage" else "Nouveau passage",dismiss) {
        SceneField("Titre",draft.title,{draft=draft.copy(title=it.take(100))})
        SceneChoice("Artiste · "+draft.artistName,listOf("" to "Autre intervenant / régie")+state.people.map { it.id to it.name }) { id -> draft=draft.copy(artistId=id,artistName=state.people.find { it.id==id }?.name.orEmpty(),textId="") }
        if(draft.artistId.isBlank()) SceneField("Nom au programme",draft.artistName,{draft=draft.copy(artistName=it.take(80))})
        SceneChoice("Type · "+draft.kind,sceneKinds.map { it to it }) { draft=draft.copy(kind=it,evaluation=if(it in listOf("Présentation","Autre"))false else draft.evaluation) }
        SceneField("Durée en minutes · 1 à 180",minutes,{minutes=it.filter(Char::isDigit).take(3)},number=true)
        SceneField("Description publique",draft.description,{draft=draft.copy(description=it.take(1200))},lines=3)
        SceneToggle("Évaluation après le passage",draft.evaluation) { draft=draft.copy(evaluation=it) }
        SceneButton(if(advanced)"Masquer les options" else "Horaire et prompteur",Modifier.fillMaxWidth(),icon=WaveIcons.Tune) { advanced=!advanced }
        if(advanced) {
            SceneDateField("Horaire prévu",draft.scheduledAt) { draft=draft.copy(scheduledAt=it) }
            SceneField("Décalage en minutes · 0 à 180",delay,{delay=it.filter(Char::isDigit).take(3)},number=true)
            SceneChoice("Texte · "+(state.data.texts.find { it.id==draft.textId }?.title ?: "Aucun"),listOf("" to "Aucun texte")+state.data.texts.filter { draft.artistId.isBlank() || it.artistId==draft.artistId || it.id==draft.textId }.map { it.id to it.title }) { draft=draft.copy(textId=it) }
        }
        SceneButton("Enregistrer",Modifier.fillMaxWidth(),primary=true,enabled=draft.title.isNotBlank()&&draft.artistName.isNotBlank()&&(minutes.toIntOrNull()?:0) in 1..180&&(delay.toIntOrNull()?:-1) in 0..180) {
            if(state.saveEntry(draft.copy(minutes=minutes.toInt(),delayMinutes=delay.toInt())))dismiss()
        }
    }
}

@Composable internal fun SceneArtist(state: SceneToolsState,id: String, size: Dp=42.dp) {
    val person=state.guests.guests.find { it.id==id }
    if(person!=null) Image(painterResource(person.portrait),"Pré-profil de "+person.name,Modifier.size(size).clip(CircleShape).clickable { state.guests.previewId=null;state.guests.profilePreviewId=id },contentScale=ContentScale.Crop)
    else Icon(WaveIcons.Group,null,tint=sceneMuted,modifier=Modifier.size(size))
}
@Composable private fun SceneGrade(level: Int) {
    val badges=listOf(R.drawable.wave_grade_1,R.drawable.wave_grade_2,R.drawable.wave_grade_3,R.drawable.wave_grade_4,R.drawable.wave_grade_5,R.drawable.wave_grade_6)
    Image(painterResource(badges[(level-1).coerceIn(0,5)]),"Grade "+level,Modifier.size(24.dp))
}
@Composable internal fun SceneCard(content: @Composable ColumnScope.()->Unit) { Column(Modifier.fillMaxWidth().hifiBlackSurface(16.dp).padding(12.dp),verticalArrangement=Arrangement.spacedBy(8.dp),content=content) }
@Composable internal fun SceneButton(label: String,modifier: Modifier=Modifier,primary: Boolean=false,enabled: Boolean=true,icon: ImageVector?=null,onClick: ()->Unit) {
    Button(onClick,modifier.heightIn(min=44.dp),enabled=enabled,shape=RoundedCornerShape(12.dp),contentPadding=PaddingValues(horizontal=12.dp,vertical=9.dp),
        colors=ButtonDefaults.buttonColors(containerColor=if(primary)WaveMixerTheme.primaryCta else Color(0xFF16151B),contentColor=Color.White,disabledContainerColor=Color(0xFF17171B),disabledContentColor=Color(0xFF62606A)),
        border=BorderStroke(.6.dp,if(primary)sceneAccent.copy(alpha=.45f) else Color.White.copy(alpha=.12f))) {
        if(icon!=null) { Icon(icon,null,Modifier.size(17.dp));Spacer(Modifier.width(6.dp)) }
        Text(label,fontSize=12.sp,maxLines=2)
    }
}
@Composable internal fun SceneIcon(icon: ImageVector,label: String,enabled: Boolean=true,tint: Color=sceneAccent,onClick: ()->Unit) {
    IconButton(onClick,modifier=Modifier.size(44.dp),enabled=enabled) { Icon(icon,label,Modifier.size(20.dp),tint=if(enabled)tint else Color(0xFF4C4A53)) }
}
@Composable internal fun <T> SceneChoice(label: String,choices: List<Pair<T,String>>,modifier: Modifier=Modifier.fillMaxWidth(),onSelect: (T)->Unit) {
    var open by remember { mutableStateOf(false) }
    Box(modifier) {
        Row(Modifier.fillMaxWidth().heightIn(min=44.dp).clip(RoundedCornerShape(11.dp)).background(Color(0xFF17151D)).border(.6.dp,Color.White.copy(alpha=.12f),RoundedCornerShape(11.dp)).clickable { open=true }.padding(horizontal=11.dp,vertical=8.dp),verticalAlignment=Alignment.CenterVertically) {
            Text(label,color=Color.White,fontSize=12.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.weight(1f));Icon(Icons.Default.ExpandMore,null,tint=sceneAccent,modifier=Modifier.size(18.dp))
        }
        DropdownMenu(open,{open=false},containerColor=Color(0xFF15131B),modifier=Modifier.heightIn(max=300.dp)) { choices.forEach { (value,title) -> DropdownMenuItem(text={Text(title,color=Color.White,fontSize=13.sp)},onClick={open=false;onSelect(value)}) } }
    }
}
@Composable internal fun SceneToggle(label:String,checked:Boolean,onChange:(Boolean)->Unit) {
    Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically) {
        Text(label,color=Color.White,fontSize=12.sp,modifier=Modifier.weight(1f));Switch(checked,onChange,colors=SwitchDefaults.colors(checkedTrackColor=WaveMixerTheme.primaryCta,checkedThumbColor=Color(0xFFDBD1F0),uncheckedTrackColor=Color(0xFF24222A)))
    }
}
@Composable internal fun SceneField(label:String,value:String,onChange:(String)->Unit,number:Boolean=false,lines:Int=1) {
    OutlinedTextField(value,onChange,modifier=Modifier.fillMaxWidth(),label={Text(label,fontSize=12.sp)},singleLine=lines==1,minLines=lines,
        keyboardOptions=KeyboardOptions(keyboardType=if(number)KeyboardType.Number else KeyboardType.Text),shape=RoundedCornerShape(12.dp),
        colors=OutlinedTextFieldDefaults.colors(focusedTextColor=Color.White,unfocusedTextColor=Color.White,focusedBorderColor=sceneAccent,unfocusedBorderColor=Color(0xFF39343F),focusedLabelColor=sceneAccent,unfocusedLabelColor=sceneMuted,cursorColor=sceneAccent))
}
@OptIn(ExperimentalMaterial3Api::class)
@Composable internal fun SceneSheet(title:String,dismiss:()->Unit,content:@Composable ColumnScope.()->Unit) {
    ModalBottomSheet(onDismissRequest=dismiss,sheetState=rememberModalBottomSheetState(skipPartiallyExpanded=true),containerColor=Color(0xFF101015),contentColor=Color.White,dragHandle=null) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(.9f).imePadding()) {
            Row(Modifier.fillMaxWidth().padding(start=16.dp,end=4.dp),verticalAlignment=Alignment.CenterVertically) {
                Text(title,color=Color.White,fontSize=16.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.weight(1f));SceneIcon(WaveIcons.Close,"Fermer",onClick=dismiss)
            }
            Column(Modifier.weight(1f,false).verticalScroll(rememberScrollState()).padding(horizontal=16.dp).padding(bottom=16.dp),verticalArrangement=Arrangement.spacedBy(11.dp),content=content)
        }
    }
}
@Composable internal fun SceneConfirm(title:String,message:String,action:String,dismiss:()->Unit,confirm:()->Unit) {
    AlertDialog(onDismissRequest=dismiss,containerColor=Color(0xFF141219),title={Text(title,color=Color.White)},text={Text(message,color=sceneMuted)},
        confirmButton={TextButton(confirm){Text(action,color=sceneAccent)}},dismissButton={TextButton(dismiss){Text("Annuler",color=sceneMuted)}})
}
internal fun sceneDate(value:Long)=SimpleDateFormat("dd MMM · HH:mm",Locale.FRANCE).format(Date(value))
internal fun sceneClock(seconds:Long)="%02d:%02d".format(seconds/60,seconds%60)
@Composable internal fun SceneDateField(label:String,value:Long?,onChange:(Long?)->Unit) {
    val context=LocalContext.current
    Row(verticalAlignment=Alignment.CenterVertically) {
        SceneButton(label+" · "+(value?.let(::sceneDate)?:"Facultatif"),Modifier.weight(1f),icon=Icons.Default.Schedule) {
            val c=Calendar.getInstance().apply { if(value!=null)timeInMillis=value }
            DatePickerDialog(context,android.R.style.Theme_DeviceDefault_Dialog,{_,year,month,day ->
                c.set(year,month,day)
                TimePickerDialog(context,android.R.style.Theme_DeviceDefault_Dialog,{_,hour,minute -> c.set(Calendar.HOUR_OF_DAY,hour);c.set(Calendar.MINUTE,minute);c.set(Calendar.SECOND,0);onChange(c.timeInMillis)},c.get(Calendar.HOUR_OF_DAY),c.get(Calendar.MINUTE),true).show()
            },c.get(Calendar.YEAR),c.get(Calendar.MONTH),c.get(Calendar.DAY_OF_MONTH)).show()
        }
        if(value!=null)SceneIcon(WaveIcons.Close,"Effacer la date"){onChange(null)}
    }
}
