package com.meewav.android.features.rooms.wave

import android.provider.OpenableColumns
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.*
import androidx.compose.ui.platform.*
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.*
import androidx.compose.ui.unit.*
import androidx.compose.ui.window.*
import androidx.lifecycle.*
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@Composable internal fun ScenePrompterPanel(state:SceneToolsState) {
    val context=LocalContext.current
    val scope=rememberCoroutineScope()
    var editing by remember { mutableStateOf<SceneText?>(null) }
    var settings by remember { mutableStateOf(false) }
    var templates by remember { mutableStateOf(false) }
    var reader by remember { mutableStateOf(false) }
    var importing by remember { mutableStateOf(false) }
    val text=state.activeText
    val importer=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if(uri!=null) scope.launch {
            importing=true
            val result=withContext(Dispatchers.IO) { runCatching {
                val title=context.contentResolver.query(uri,arrayOf(OpenableColumns.DISPLAY_NAME),null,null,null)?.use { if(it.moveToFirst())it.getString(0).substringBeforeLast('.') else "Texte importé" }?:"Texte importé"
                val bytes=context.contentResolver.openInputStream(uri)?.use { input -> val out=java.io.ByteArrayOutputStream();val buffer=ByteArray(8192);var total=0;while(true){val n=input.read(buffer);if(n<0)break;total+=n;require(total<=200000);out.write(buffer,0,n)};out.toByteArray() }?:error("file")
                require(bytes.size<=200000)
                SceneText(title=title,artistId=text?.artistId.orEmpty(),body=bytes.toString(Charsets.UTF_8).removePrefix("\uFEFF").replace("\r\n","\n"))
            } }
            importing=false
            result.onSuccess { state.saveText(it);editing=it }.onFailure { state.notice="Import impossible. Choisis un fichier .txt ou .md de moins de 200 Ko." }
        }
    }
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(top=5.dp,bottom=12.dp),verticalArrangement=Arrangement.spacedBy(9.dp)) {
        item { SceneChoice(text?.title?:"Choisir un texte",state.data.texts.map { it.id to it.title }) { state.selectText(it) } }
        item { SceneCard {
            Row(verticalAlignment=Alignment.CenterVertically) { Icon(Icons.Default.Lock,null,tint=sceneAccent,modifier=Modifier.size(15.dp));Spacer(Modifier.width(6.dp));Text("Lecture privée",color=sceneAccent,fontSize=11.sp) }
            Text(text?.body?.lineSequence()?.filter { it.isNotBlank() }?.take(3)?.joinToString("\n")?.ifBlank { "Ajoute tes paroles ou tes repères." }?:"Ajoute tes paroles ou tes repères.",color=Color.White,fontSize=17.sp,lineHeight=24.sp,maxLines=3,overflow=TextOverflow.Ellipsis)
            Text((text?.body?.lines()?.size?:0).toString()+" lignes · "+(state.people.find { it.id==text?.artistId }?.name?:"Régie"),color=sceneMuted,fontSize=11.sp)
            SceneButton("Démarrer sur mon écran",Modifier.fillMaxWidth(),primary=true,icon=WaveIcons.Play,enabled=!text?.body.isNullOrBlank()) { reader=true }
            Text("Le public garde la scène.",color=sceneMuted,fontSize=10.sp)
        } }
        item { Row(horizontalArrangement=Arrangement.spacedBy(7.dp)) {
            SceneButton("Modifier",Modifier.weight(1f),icon=Icons.Default.Edit,enabled=text!=null) { editing=text }
            SceneButton("Réglages",Modifier.weight(1f),icon=WaveIcons.Tune) { settings=true }
        } }
        if(text!=null&&text.markers.isNotEmpty()) item {
            Row(Modifier.horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(7.dp)) {
                text.markers.forEach { marker -> SceneButton(marker.label,icon=Icons.Default.Bookmark) { state.seek(marker.line);reader=true } }
            }
        }
        item { SceneCard {
            Text("Mes textes",color=Color.White,fontSize=13.sp,fontWeight=FontWeight.SemiBold)
            Row(horizontalArrangement=Arrangement.spacedBy(7.dp)) {
                SceneButton("Nouveau",Modifier.weight(1f),icon=WaveIcons.Add) { editing=SceneText(artistId=text?.artistId.orEmpty()) }
                SceneButton(if(importing)"Import…" else "Importer",Modifier.weight(1f),icon=Icons.Default.FileUpload,enabled=!importing) { importer.launch(arrayOf("text/plain","text/markdown","text/x-markdown")) }
            }
            SceneButton("Partir d’un modèle",Modifier.fillMaxWidth(),icon=Icons.Default.Article) { templates=true }
        } }
    }
    editing?.let { draftText -> SceneTextEditor(state,draftText){editing=null} }
    if(settings) SceneSheet("Réglages de lecture",{settings=false}) {
        ScenePromptSlider("Vitesse",state.data.prompt.speed.toFloat(),10f..100f) { state.prompt(state.data.prompt.copy(speed=it.toInt())) }
        ScenePromptSlider("Taille du texte",state.data.prompt.fontSize.toFloat(),20f..54f) { state.prompt(state.data.prompt.copy(fontSize=it.toInt())) }
        SceneChoice("Décompte · "+state.data.prompt.countdown+" s",listOf(0 to "Départ immédiat",3 to "3 secondes",5 to "5 secondes",10 to "10 secondes")) { state.prompt(state.data.prompt.copy(countdown=it)) }
        SceneChoice("Alignement · "+when(state.data.prompt.alignment){"left"->"Gauche";"right"->"Droite";else->"Centré"},listOf("left" to "Gauche","center" to "Centré","right" to "Droite")) { state.prompt(state.data.prompt.copy(alignment=it)) }
        SceneChoice("Interligne · "+state.data.prompt.lineHeight,listOf(1.1f,1.3f,1.5f,1.55f,1.7f,2f).map { it to if(it==1.55f)"Standard" else it.toString() }) { state.prompt(state.data.prompt.copy(lineHeight=it)) }
        SceneChoice("Pilotage · "+if(state.data.prompt.controller=="regie")"Régie" else "Artiste",listOf("regie" to "Régie","artist" to "Artiste")) { state.prompt(state.data.prompt.copy(controller=it)) }
        SceneToggle("Mode miroir",state.data.prompt.mirrored) { state.prompt(state.data.prompt.copy(mirrored=it)) }
    }
    if(templates) SceneSheet("Modèles de texte",{templates=false}) {
        listOf("Présentation" to "Salutation\nPrésentation de la performance\nRemerciements au public\nLancement","Chanson" to "Intro\nCouplet 1\nRefrain\nCouplet 2\nRefrain\nOutro","Stand-up" to "Ouverture\nPrémisse\nDéveloppement\nRappel\nConclusion","Repères libres" to "Départ\nRepère 1\nRepère 2\nFinal").forEach { (title,body) ->
            SceneButton(title,Modifier.fillMaxWidth(),icon=Icons.Default.Article) { editing=SceneText(title=title,body=body,artistId=text?.artistId.orEmpty());templates=false }
        }
    }
    if(reader) ScenePrompterReader(state) { reader=false }
}

@Composable private fun SceneTextEditor(state:SceneToolsState,initial:SceneText,dismiss:()->Unit) {
    var text by remember(initial.id) { mutableStateOf(initial) }
    var marker by remember { mutableStateOf("") }
    var line by remember { mutableStateOf((state.line+1).toString()) }
    SceneSheet("Texte et repères",dismiss) {
        SceneField("Titre",text.title,{text=text.copy(title=it.take(100))})
        SceneChoice("Artiste · "+(state.people.find { it.id==text.artistId }?.name?:"Régie"),listOf("" to "Régie")+state.people.map { it.id to it.name }) { text=text.copy(artistId=it) }
        SceneField("Une phrase par ligne",text.body,{text=text.copy(body=it.take(100000))},lines=6)
        if(text.markers.isNotEmpty()) Column { text.markers.forEach { m -> Row(verticalAlignment=Alignment.CenterVertically) {
            Text(m.label+" · ligne "+(m.line+1),color=sceneMuted,fontSize=12.sp,modifier=Modifier.weight(1f))
            SceneIcon(WaveIcons.Close,"Retirer le repère") { text=text.copy(markers=text.markers.filterNot { it.id==m.id }) }
        } } }
        SceneField("Nouveau repère",marker,{marker=it.take(60)})
        SceneField("Numéro de ligne",line,{line=it.filter(Char::isDigit).take(5)},number=true)
        SceneButton("Ajouter le repère",Modifier.fillMaxWidth(),enabled=marker.isNotBlank()&&(line.toIntOrNull()?:0) in 1..text.body.lines().size,icon=Icons.Default.BookmarkAdd) {
            text=text.copy(markers=text.markers+SceneMarker(label=marker.trim(),line=line.toInt()-1));marker=""
        }
        SceneButton("Enregistrer",Modifier.fillMaxWidth(),primary=true) { state.saveText(text);dismiss() }
    }
}

@Composable internal fun ScenePromptSlider(label:String,value:Float,range:ClosedFloatingPointRange<Float>,onChange:(Float)->Unit) {
    var draft by remember(value) { mutableFloatStateOf(value) }
    Column { Row { Text(label,color=Color.White,fontSize=12.sp,modifier=Modifier.weight(1f));Text(draft.toInt().toString(),color=sceneAccent,fontSize=12.sp) }
        Slider(draft,{draft=it},onValueChangeFinished={onChange(draft)},valueRange=range,colors=SliderDefaults.colors(thumbColor=sceneAccent,activeTrackColor=WaveMixerTheme.faderViolet,inactiveTrackColor=Color(0xFF2A2732))) }
}

@Composable private fun ScenePrompterReader(state:SceneToolsState,dismiss:()->Unit) {
    val text=state.activeText?:return
    val lines=remember(text.body){text.body.lines()}
    var countdown by remember { mutableIntStateOf(state.data.prompt.countdown) }
    val list=rememberLazyListState()
    fun close() { state.playing=false;dismiss() }
    LaunchedEffect(Unit) { if(state.line>=lines.lastIndex)state.seek(0);state.playing=countdown==0 }
    LaunchedEffect(countdown) { if(countdown>0){delay(1000);countdown--;if(countdown==0)state.playing=true} }
    LaunchedEffect(state.playing,state.line,state.data.prompt.speed,countdown) {
        if(state.playing&&countdown==0) { delay((2900L-state.data.prompt.speed*24L).coerceAtLeast(420L));if(state.line>=lines.lastIndex)state.playing=false else state.seek(state.line+1) }
    }
    val lifecycle=LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle) {
        val observer=LifecycleEventObserver { _,event -> if(event==Lifecycle.Event.ON_PAUSE){state.playing=false;countdown=0} }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer);state.playing=false }
    }
    Dialog(onDismissRequest={close()},properties=DialogProperties(usePlatformDefaultWidth=false,decorFitsSystemWindows=false,securePolicy=SecureFlagPolicy.SecureOn)) {
        Column(Modifier.fillMaxSize().background(Color(0xFF050507)).systemBarsPadding().padding(horizontal=14.dp)) {
            Row(verticalAlignment=Alignment.CenterVertically) {
                Icon(Icons.Default.Lock,null,tint=sceneAccent,modifier=Modifier.size(16.dp));Spacer(Modifier.width(8.dp))
                Text(text.title,color=Color.White,fontSize=15.sp,maxLines=1,overflow=TextOverflow.Ellipsis,modifier=Modifier.weight(1f));SceneIcon(WaveIcons.Close,"Fermer le prompteur"){close()}
            }
            BoxWithConstraints(Modifier.weight(1f).fillMaxWidth()) {
                val padding=maxHeight/2-35.dp
                LaunchedEffect(state.line,state.data.prompt.fontSize,state.data.prompt.lineHeight) { list.animateScrollToItem(state.line) }
                LazyColumn(state=list,modifier=Modifier.fillMaxSize().graphicsLayer { scaleX=if(state.data.prompt.mirrored)-1f else 1f },contentPadding=PaddingValues(vertical=padding.coerceAtLeast(0.dp)),verticalArrangement=Arrangement.spacedBy(12.dp)) {
                    itemsIndexed(lines) { index,line -> Text(line.ifBlank { " " },modifier=Modifier.fillMaxWidth().clickable { countdown=0;state.seek(index) },
                        color=when { index==state.line->Color.White;index<state.line->Color(0xFF4D485A);else->Color(0xFF9A94A7) },fontSize=state.data.prompt.fontSize.sp,lineHeight=(state.data.prompt.fontSize*state.data.prompt.lineHeight).sp,
                        fontWeight=if(index==state.line)FontWeight.SemiBold else FontWeight.Normal,textAlign=when(state.data.prompt.alignment){"left"->TextAlign.Left;"right"->TextAlign.Right;else->TextAlign.Center}) }
                }
                if(countdown>0) Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=.9f)),contentAlignment=Alignment.Center) {
                    Text(countdown.toString(),color=sceneAccent,fontSize=84.sp,fontWeight=FontWeight.Bold)
                }
            }
            Text((if(countdown>0)"Prépare-toi" else if(state.playing)"Lecture" else "En pause")+" · Ligne "+(state.line+1)+" / "+lines.size,color=sceneMuted,fontSize=11.sp,modifier=Modifier.padding(vertical=8.dp))
            LinearProgressIndicator(progress={(state.line+1).toFloat()/lines.size},modifier=Modifier.fillMaxWidth(),color=sceneAccent,trackColor=Color(0xFF24212C))
            Row(Modifier.fillMaxWidth().padding(vertical=6.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.SpaceBetween) {
                SceneIcon(Icons.Default.Replay,"Revenir au début"){countdown=0;state.playing=false;state.seek(0)}
                SceneIcon(Icons.Default.ArrowUpward,"Ligne précédente",enabled=state.line>0){state.seek(state.line-1)}
                SceneButton(if(countdown>0)"Annuler" else if(state.playing)"Pause" else "Lire",primary=true,icon=if(state.playing||countdown>0)WaveIcons.Pause else WaveIcons.Play) {
                    if(countdown>0){countdown=0;state.playing=false}else { if(!state.playing&&state.line>=lines.lastIndex)state.seek(0);state.playing=!state.playing }
                }
                SceneIcon(Icons.Default.ArrowDownward,"Ligne suivante",enabled=state.line<lines.lastIndex){state.seek(state.line+1)}
                SceneIcon(Icons.Default.Flip,"Mode miroir"){state.prompt(state.data.prompt.copy(mirrored=!state.data.prompt.mirrored))}
            }
        }
    }
}
