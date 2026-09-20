package com.meewav.android.features.rooms.wave

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL
import java.util.Locale

@Composable internal fun SceneEvaluationPanel(state:SceneToolsState) {
    var selected by remember { mutableStateOf(state.data.program.lastOrNull { it.status=="done" }?.id ?: state.live?.id ?: state.data.program.firstOrNull()?.id) }
    val entry=state.data.program.find { it.id==selected }?:state.data.program.firstOrNull()
    var settings by remember { mutableStateOf(false) }
    if(entry==null) { Text("Ajoute une prestation dans Programme pour recueillir les avis.",color=sceneMuted,fontSize=13.sp,modifier=Modifier.padding(16.dp));return }
    val evaluation=state.data.evaluations[entry.id]?:SceneEvaluation()
    val count=evaluation.responses.size
    fun configure(enabled:Boolean=entry.evaluation,minimum:Int=evaluation.minimum,public:Boolean=evaluation.public) { state.configureEvaluation(entry.id,enabled,minimum,public) }
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(top=5.dp,bottom=12.dp),verticalArrangement=Arrangement.spacedBy(9.dp)) {
        item { SceneChoice(entry.artistName+" · "+entry.title,state.data.program.map { it.id to (it.artistName+" · "+it.title+" — "+it.statusLabel) }) { selected=it } }
        item { SceneCard {
            Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
                SceneArtist(state,entry.artistId)
                Column(Modifier.weight(1f)) { Text(entry.title,color=Color.White,fontSize=15.sp,fontWeight=FontWeight.SemiBold,maxLines=1,overflow=TextOverflow.Ellipsis);Text(entry.statusLabel,color=sceneMuted,fontSize=11.sp) }
            }
            Row(Modifier.fillMaxWidth().padding(vertical=7.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                Icon(WaveIcons.Star,null,tint=Color(0xFFDDC07D),modifier=Modifier.size(26.dp))
                Text(evaluation.average?.let { String.format(Locale.FRANCE,"%.1f",it) }?:"—",color=Color.White,fontSize=30.sp,fontWeight=FontWeight.SemiBold)
                Text("/ 5",color=sceneMuted,fontSize=13.sp,modifier=Modifier.weight(1f));Text(count.toString()+" avis",color=sceneAccent,fontSize=13.sp)
            }
            if(count>0) sceneReactions.forEach { reaction ->
                val percentage=evaluation.responses.values.count { reaction in it.reactions }.toFloat()/count
                Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)) {
                    Text(reaction,color=sceneMuted,fontSize=11.sp,modifier=Modifier.width(72.dp))
                    LinearProgressIndicator(progress={percentage},modifier=Modifier.weight(1f).height(4.dp),color=WaveMixerTheme.faderViolet,trackColor=Color(0xFF27232F))
                    Text((percentage*100).toInt().toString()+" %",color=Color.White,fontSize=10.sp,modifier=Modifier.width(34.dp))
                }
            } else Text(if(!entry.evaluation)"Les avis sont désactivés." else if(entry.status=="done")"En attente des premiers avis." else "Les avis s’ouvrent à la fin de la prestation.",color=sceneMuted,fontSize=12.sp)
        } }
        item { SceneCard {
            SceneToggle("Recueillir les avis",entry.evaluation) { configure(enabled=it) }
            Row(verticalAlignment=Alignment.CenterVertically) {
                Icon(if(evaluation.public)Icons.Default.Visibility else Icons.Default.VisibilityOff,null,tint=sceneAccent,modifier=Modifier.size(19.dp));Spacer(Modifier.width(8.dp))
                Column(Modifier.weight(1f)) {
                    Text(if(!evaluation.public)"Résultats privés" else if(count>=evaluation.minimum)"Résultats partagés" else "Partage programmé",color=Color.White,fontSize=12.sp)
                    Text(if(evaluation.public)"À partir de "+evaluation.minimum+" avis" else "Host et régie uniquement",color=sceneMuted,fontSize=10.sp)
                }
            }
            SceneButton(if(evaluation.public)"Garder privés" else "Partager les résultats",Modifier.fillMaxWidth(),enabled=entry.evaluation) { configure(public=!evaluation.public) }
            SceneButton("Conditions de publication",Modifier.fillMaxWidth(),icon=WaveIcons.Tune) { settings=true }
        } }
        if(com.meewav.android.BuildConfig.DEBUG) item { SceneButton("Simuler 8 avis · démo",Modifier.fillMaxWidth(),enabled=entry.evaluation&&entry.status=="done",icon=Icons.Default.Science) { state.demoResponses(entry.id) } }
    }
    if(settings) {
        var threshold by remember(entry.id) { mutableStateOf(evaluation.minimum.toString()) }
        SceneSheet("Publication des résultats",{settings=false}) {
            SceneField("Nombre minimum d’avis · 1 à 100",threshold,{threshold=it.filter(Char::isDigit).take(3)},number=true)
            Text("Le seuil s’applique quand les résultats sont partagés avec le public.",color=sceneMuted,fontSize=12.sp)
            SceneButton("Enregistrer",Modifier.fillMaxWidth(),primary=true,enabled=(threshold.toIntOrNull()?:0) in 1..100) { configure(minimum=threshold.toInt());settings=false }
        }
    }
}

@Composable internal fun SceneFundraiserPanel(state:SceneToolsState) {
    val f=state.data.fundraiser
    var editing by remember { mutableStateOf(false) }
    var closing by remember { mutableStateOf(false) }
    val progress=(f.collectedCents/100f/f.target.coerceAtLeast(1)).coerceIn(0f,1f)
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(top=5.dp,bottom=12.dp),verticalArrangement=Arrangement.spacedBy(9.dp)) {
        item { SceneCard {
            Row(verticalAlignment=Alignment.CenterVertically) {
                Text(when(f.status){"live"->"En direct";"closed"->"Clôturée";else->"Brouillon"},color=sceneAccent,fontSize=11.sp,modifier=Modifier.weight(1f))
                Icon(if(f.visible&&f.status!="draft")Icons.Default.Visibility else Icons.Default.VisibilityOff,"Visibilité",tint=sceneMuted,modifier=Modifier.size(16.dp))
            }
            if(f.imageUrl.isNotBlank()) SceneCampaignCover(f.imageUrl)
            Text(f.title,color=Color.White,fontSize=17.sp,fontWeight=FontWeight.SemiBold,maxLines=2,overflow=TextOverflow.Ellipsis)
            Text(f.beneficiary,color=sceneAccent,fontSize=12.sp)
            if(f.description.isNotBlank())Text(f.description,color=sceneMuted,fontSize=12.sp,maxLines=3,overflow=TextOverflow.Ellipsis)
            Row(verticalAlignment=Alignment.Bottom) {
                Text(sceneEuros(f.collectedCents),color=Color.White,fontSize=25.sp,fontWeight=FontWeight.SemiBold,modifier=Modifier.weight(1f))
                Text("sur "+sceneEuros(f.target*100L),color=sceneMuted,fontSize=12.sp)
            }
            LinearProgressIndicator(progress={progress},modifier=Modifier.fillMaxWidth().height(5.dp),color=WaveMixerTheme.faderViolet,trackColor=Color(0xFF28242F))
            Text(f.count.toString()+" contributions"+(f.endAt?.let { " · Jusqu’au "+sceneDate(it) }?:""),color=sceneMuted,fontSize=10.sp)
        } }
        item { SceneCard {
            if(f.status!="live")SceneButton(if(f.status=="closed")"Rouvrir la cagnotte" else "Lancer la cagnotte",Modifier.fillMaxWidth(),primary=true,icon=Icons.Default.Flag) { state.fundraiser(f.copy(status="live",visible=true)) }
            if(f.status!="draft")SceneToggle("Afficher dans le live",f.visible) { state.fundraiser(f.copy(visible=it)) }
            if(f.status=="live"&&f.visible)SceneToggle("Mettre en avant",f.highlighted) { state.fundraiser(f.copy(highlighted=it)) }
            Row(horizontalArrangement=Arrangement.spacedBy(7.dp)) {
                SceneButton("Modifier",Modifier.weight(1f),icon=Icons.Default.Edit) { editing=true }
                if(f.status=="live")SceneButton("Clôturer",Modifier.weight(1f),icon=Icons.Default.Stop) { closing=true }
            }
        } }
        item { Text("Les contributions réelles sont indisponibles pour le moment.",color=sceneMuted,fontSize=11.sp,modifier=Modifier.padding(horizontal=4.dp)) }
        if(com.meewav.android.BuildConfig.DEBUG) item { SceneButton("Simuler un don de 10 € · démo",Modifier.fillMaxWidth(),enabled=f.status=="live"&&f.visible,icon=Icons.Default.Science) { state.demoContribution(1000) } }
    }
    if(editing) SceneFundraiserEditor(state){editing=false}
    if(closing)SceneConfirm("Clôturer la cagnotte ?","Le total reste visible. Les nouvelles contributions seront fermées.","Clôturer",{closing=false}) { state.fundraiser(f.copy(status="closed",highlighted=false));closing=false }
}

@Composable private fun SceneFundraiserEditor(state:SceneToolsState,dismiss:()->Unit) {
    var draft by remember { mutableStateOf(state.data.fundraiser) }
    var target by remember { mutableStateOf(draft.target.toString()) }
    var advanced by remember { mutableStateOf(false) }
    val context=LocalContext.current
    val image=rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if(uri!=null) {
            runCatching { context.contentResolver.takePersistableUriPermission(uri,android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            draft=draft.copy(imageUrl=uri.toString())
        }
    }
    SceneSheet("Objectif de la cagnotte",dismiss) {
        SceneField("Titre",draft.title,{draft=draft.copy(title=it.take(100))})
        SceneField("Bénéficiaire",draft.beneficiary,{draft=draft.copy(beneficiary=it.take(100))})
        SceneField("Objectif en euros",target,{target=it.filter(Char::isDigit).take(7)},number=true)
        SceneField("Description",draft.description,{draft=draft.copy(description=it.take(500))},lines=3)
        SceneButton(if(advanced)"Masquer les options" else "Image et date de fin",Modifier.fillMaxWidth(),icon=WaveIcons.Tune) { advanced=!advanced }
        if(advanced) {
            SceneButton("Choisir une image",Modifier.fillMaxWidth(),icon=Icons.Default.Image) { image.launch(arrayOf("image/*")) }
            SceneField("Image · URL https",draft.imageUrl,{draft=draft.copy(imageUrl=it.take(500))})
            SceneDateField("Date de fin",draft.endAt){draft=draft.copy(endAt=it)}
        }
        SceneButton("Enregistrer",Modifier.fillMaxWidth(),primary=true,enabled=draft.title.isNotBlank()&&draft.beneficiary.isNotBlank()&&(target.toIntOrNull()?:0) in 1..1000000&&(draft.imageUrl.isBlank()||draft.imageUrl.startsWith("https://")||draft.imageUrl.startsWith("content://"))) {
            if(state.fundraiser(draft.copy(target=target.toInt())))dismiss()
        }
    }
}
internal fun sceneEuros(cents:Long)=java.text.NumberFormat.getCurrencyInstance(Locale.FRANCE).apply { maximumFractionDigits=if(cents%100L==0L)0 else 2 }.format(cents/100.0)

@Composable private fun SceneCampaignCover(uri:String) {
    val context=LocalContext.current
    val bitmap by produceState<Bitmap?>(null,uri) {
        value=withContext(Dispatchers.IO) { runCatching {
            fun stream():java.io.InputStream = if(uri.startsWith("content://"))context.contentResolver.openInputStream(Uri.parse(uri))?:error("image") else {
                require(uri.startsWith("https://"));URL(uri).openConnection().apply { connectTimeout=5000;readTimeout=5000 }.getInputStream()
            }
            val bytes=stream().use { input -> val output=java.io.ByteArrayOutputStream();val buffer=ByteArray(8192);var total=0
                while(true) { val n=input.read(buffer);if(n<0)break;total+=n;require(total<=8000000);output.write(buffer,0,n) };output.toByteArray() }
            val options=BitmapFactory.Options().apply { inJustDecodeBounds=true }
            BitmapFactory.decodeByteArray(bytes,0,bytes.size,options)
            options.inSampleSize=(maxOf(options.outWidth,options.outHeight)/1024).coerceAtLeast(1);options.inJustDecodeBounds=false
            BitmapFactory.decodeByteArray(bytes,0,bytes.size,options)
        }.getOrNull() }
    }
    bitmap?.let { Image(it.asImageBitmap(),"Illustration de la cagnotte",Modifier.fillMaxWidth().height(85.dp).clip(RoundedCornerShape(10.dp)),contentScale=ContentScale.Crop) }
}

@Composable internal fun SceneVideoSignals(state:SceneToolsState,modifier:Modifier=Modifier,onOpen:()->Unit) {
    val f=state.data.fundraiser
    if(f.visible&&f.status!="draft") Row(modifier.clip(RoundedCornerShape(10.dp)).background(Color.Black.copy(alpha=.84f))
        .then(if(f.highlighted)Modifier.border(.75.dp,sceneAccent,RoundedCornerShape(10.dp))else Modifier)
        .clickable(onClick=onOpen).padding(horizontal=9.dp,vertical=5.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(5.dp)) {
        Icon(Icons.Default.Favorite,null,tint=sceneAccent,modifier=Modifier.size(13.dp))
        Text(sceneEuros(f.collectedCents)+" / "+sceneEuros(f.target*100L),color=Color.White,fontSize=10.sp)
    }
}
