package com.meewav.android.features.rooms.wave

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaMetadataRetriever
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.Build
import android.os.SystemClock
import android.widget.MediaController
import android.widget.VideoView
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.*
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.util.UUID

/** One private draft per recipient. Capture never implies upload or remote delivery. */
internal class LogeCapture(private val context:Context) {
    var file by mutableStateOf<File?>(null);private set
    var recording by mutableStateOf(false);private set
    var seconds by mutableIntStateOf(0);private set
    var error by mutableStateOf<String?>(null)
    var saved by mutableStateOf(false);private set
    private var recorder:MediaRecorder?=null
    private var startedAt=0L
    fun newFile(extension:String):File {
        reset();val dir=File(context.filesDir,"loge-dedications").apply{mkdirs()}
        return File(dir,"vip-${UUID.randomUUID()}.$extension").also{file=it}
    }
    fun startAudio() {
        val target=newFile("m4a")
        try {
            val r=if(Build.VERSION.SDK_INT>=31)MediaRecorder(context)else @Suppress("DEPRECATION") MediaRecorder()
            recorder=r;r.setAudioSource(MediaRecorder.AudioSource.MIC);r.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);r.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            r.setAudioChannels(1);r.setAudioSamplingRate(48000);r.setAudioEncodingBitRate(128000);r.setMaxDuration(120000);r.setMaxFileSize(10L*1024*1024)
            r.setOutputFile(target.absolutePath)
            r.setOnInfoListener{_,_,_->stopAudio()};r.setOnErrorListener{_,_,_->reset();error="L’enregistrement a été interrompu."}
            r.prepare();r.start();startedAt=SystemClock.elapsedRealtime();recording=true
        }catch(_:Exception){reset();error="Impossible d’ouvrir le micro. Vérifie son autorisation."}
    }
    fun clock(){if(recording)seconds=((SystemClock.elapsedRealtime()-startedAt)/1000).toInt()}
    fun stopAudio() {
        val r=recorder?:return;recorder=null;clock();recording=false
        try { r.stop();if(seconds<1 || file?.length()==0L)error("short") }catch(_:Exception){file?.delete();file=null;error="Enregistre au moins une seconde avant d’arrêter."}finally{r.release()}
    }
    suspend fun videoFinished(ok:Boolean) {
        val target=file?:return
        if(!ok){reset();return}
        val duration=withContext(Dispatchers.IO){runCatching{val r=MediaMetadataRetriever();try{r.setDataSource(target.absolutePath);(r.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toLongOrNull()?:0)/1000}finally{r.release()}}.getOrDefault(0)}
        if(duration<1 || target.length()>25L*1024*1024){reset();error="La vidéo doit durer au moins une seconde et peser moins de 25 Mo."}else seconds=duration.toInt()
    }
    fun keep(){saved=true}
    fun reset(){try{recorder?.stop()}catch(_:Exception){};recorder?.release();recorder=null;recording=false;if(!saved)file?.delete();file=null;seconds=0;saved=false;error=null}
}

@Composable internal fun LogeRecordingPanel(state:LogeToolsState,person:WaveGuest,format:String) {
    val context=LocalContext.current
    val capture=remember(person.id,format){LogeCapture(context.applicationContext)}
    val scope=rememberCoroutineScope()
    var preview by remember{mutableStateOf(false)}
    var busy by remember{mutableStateOf(false)}
    var sent by remember{mutableStateOf(false)}
    var cameraOpen by remember{mutableStateOf(false)}
    val lifecycle=LocalLifecycleOwner.current.lifecycle
    DisposableEffect(capture,lifecycle){val observer=LifecycleEventObserver{_,event->if(event==Lifecycle.Event.ON_STOP && capture.recording)capture.stopAudio()};lifecycle.addObserver(observer);onDispose{lifecycle.removeObserver(observer);capture.reset()}}
    LaunchedEffect(capture.recording){while(capture.recording){capture.clock();delay(200)}}
    val video=rememberLauncherForActivityResult(ActivityResultContracts.CaptureVideo()){ok->cameraOpen=false;scope.launch{busy=true;capture.videoFinished(ok);busy=false}}
    fun startVideo(){try{val f=capture.newFile("mp4");cameraOpen=true;video.launch(FileProvider.getUriForFile(context,context.packageName+".loge-media",f))}catch(_:Exception){cameraOpen=false;capture.reset();capture.error="Aucune application caméra disponible."}}
    val permissions=rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()){granted->if(granted.values.all{it}){if(format=="audio")capture.startAudio()else startVideo()}else capture.error="Autorise le micro"+(if(format=="video")" et la caméra"else"")+" pour enregistrer."}
    fun start(){val needed=if(format=="audio")arrayOf(Manifest.permission.RECORD_AUDIO)else arrayOf(Manifest.permission.CAMERA,Manifest.permission.RECORD_AUDIO);if(needed.all{ContextCompat.checkSelfPermission(context,it)==PackageManager.PERMISSION_GRANTED}){if(format=="audio")capture.startAudio()else startVideo()}else permissions.launch(needed)}
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(vertical=8.dp),verticalArrangement=Arrangement.spacedBy(10.dp)) {
        SceneCard {
            Box(Modifier.fillMaxWidth().height(112.dp),contentAlignment=Alignment.Center){Column(horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(10.dp)){
                Icon(if(sent)Icons.Default.CheckCircle else if(format=="audio")Icons.Default.Mic else Icons.Default.Videocam,null,tint=if(capture.recording)logeRed else sceneAccent,modifier=Modifier.size(35.dp))
                Text(if(sent)"Dédicace conservée"else if(capture.recording)"Enregistrement · "+sceneClock(capture.seconds.toLong())else if(capture.seconds>0)sceneClock(capture.seconds.toLong())+" · Prête à revoir"else"Un message personnel",color=Color.White,fontSize=16.sp)
            }}
            if(!sent)Text(if(format=="audio")"Enregistre jusqu’à 2 minutes. Réécoute avant d’envoyer."else"Filme ta dédicace avec la caméra du téléphone, puis regarde-la avant l’envoi.",color=sceneMuted,fontSize=12.sp)
            capture.error?.let{Text(it,color=logeRed,fontSize=12.sp)}
            when {
                sent -> {Text("Pour "+person.name+" · enregistrée dans l’historique VIP de cette démo.",color=sceneMuted,fontSize=12.sp);SceneButton("Créer un autre moment",Modifier.fillMaxWidth(),primary=true){state.action=null}}
                capture.recording -> SceneButton("Arrêter",Modifier.fillMaxWidth(),primary=true,icon=Icons.Default.Stop){capture.stopAudio()}
                busy || cameraOpen -> LinearProgressIndicator(Modifier.fillMaxWidth(),color=sceneAccent)
                capture.seconds>0 && capture.file!=null -> {
                    Row(horizontalArrangement=Arrangement.spacedBy(6.dp)) {SceneButton(if(format=="audio")"Réécouter"else"Regarder",Modifier.weight(1f),icon=WaveIcons.Play){preview=true};SceneButton("Refaire",Modifier.weight(1f),icon=Icons.Default.Replay){capture.reset()}}
                    SceneButton("Envoyer · démo",Modifier.fillMaxWidth(),primary=true,icon=WaveIcons.Send){val f=capture.file;if(f!=null && state.dedicate(person.id,format,f.absolutePath,capture.seconds)){capture.keep();sent=true}}
                }
                else -> SceneButton("Enregistrer",Modifier.fillMaxWidth(),primary=true,icon=if(format=="audio")Icons.Default.Mic else Icons.Default.Videocam){start()}
            }
        }
        Text("Enregistrement privé sur ce téléphone. Aucun fichier n’est transmis à un compte réel dans l’atelier de démonstration.",color=sceneMuted,fontSize=10.sp,modifier=Modifier.padding(horizontal=6.dp))
    }
    if(preview)capture.file?.let{LogeMediaDialog(it.absolutePath,format){preview=false}}
}

@Composable internal fun LogeMediaDialog(path:String,format:String,onClose:()->Unit) {
    val lifecycle=LocalLifecycleOwner.current.lifecycle
    var audio by remember{mutableStateOf<MediaPlayer?>(null)}
    var playing by remember{mutableStateOf(false)}
    var error by remember{mutableStateOf<String?>(null)}
    var video by remember{mutableStateOf<VideoView?>(null)}
    DisposableEffect(path,lifecycle){val observer=LifecycleEventObserver{_,event->if(event==Lifecycle.Event.ON_STOP){audio?.pause();video?.pause();playing=false}};lifecycle.addObserver(observer);onDispose{lifecycle.removeObserver(observer);audio?.release();video?.stopPlayback()}}
    Dialog(onDismissRequest=onClose){Column(Modifier.fillMaxWidth().hifiBlackSurface(18.dp).padding(12.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){Text("Dédicace privée",color=Color.White,fontSize=16.sp,modifier=Modifier.weight(1f));SceneIcon(WaveIcons.Close,"Fermer",onClick=onClose)}
        if(format=="video")AndroidView(factory={context->VideoView(context).also{view->video=view;view.setMediaController(MediaController(context).apply{setAnchorView(view)});view.setVideoURI(Uri.fromFile(File(path)));view.setOnPreparedListener{view.start()};view.setOnErrorListener{_,_,_->error="Impossible de lire cette vidéo.";true}}},modifier=Modifier.fillMaxWidth().height(250.dp))
        else SceneButton(if(playing)"Pause"else"Écouter",Modifier.fillMaxWidth(),primary=true,icon=if(playing)Icons.Default.Pause else WaveIcons.Play){
            try{if(playing){audio?.pause();playing=false}else if(audio!=null){audio?.start();playing=true}else{val p=MediaPlayer();audio=p;p.setDataSource(path);p.setOnPreparedListener{it.start();playing=true};p.setOnCompletionListener{playing=false};p.setOnErrorListener{_,_,_->error="Impossible de lire cette dédicace.";playing=false;true};p.prepareAsync()}}catch(_:Exception){error="Le fichier n’est plus disponible."}
        }
        error?.let{Text(it,color=logeRed,fontSize=12.sp)}
    }}
}
