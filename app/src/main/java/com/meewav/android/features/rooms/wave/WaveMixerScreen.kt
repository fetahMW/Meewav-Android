package com.meewav.android.features.rooms.wave

import androidx.compose.material.icons.filled.SwapHoriz
import android.view.HapticFeedbackConstants
import android.Manifest
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.requiredHeight
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.MeetingRoom
import androidx.compose.material.icons.filled.People
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.meewav.android.R
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext

private fun white(a: Float) = Color.White.copy(alpha = a)

enum class WaveTab(val label: String, val icon: ImageVector) {
    CHAT("Chat", WaveIcons.Chat),
    MIXEUR("Mixeur", WaveIcons.Tune),
    WAVE("Wave", WaveIcons.Waveform),
    INVITES("Invités", WaveIcons.Group),
}

/* ------------------------------------------------------------------------- */
/* Écran « La Wave » — rôle hôte, onglet Mixeur.                               */
/* ------------------------------------------------------------------------- */

@Composable
fun WaveMixerScreen(room: RoomModule = RoomModule.WAVE, roomTitle: String? = null, liveRoomId:String? = null, cageProgram: String? = null, programScope: String = "demo",
                    onBack: () -> Unit = {}, onClose: () -> Unit = {}) {
    WaveMixerSession(room,roomTitle,cageProgram,programScope,onBack,onClose,liveRoomId)
}
@Composable private fun WaveMixerSession(initialRoom:RoomModule,initialTitle:String?,cageProgram:String?,programScope:String,onBack:()->Unit,onClose:()->Unit,liveRoomId:String?) {
    var room by remember(initialRoom){mutableStateOf(initialRoom)}
    var roomTitle by remember(initialTitle){mutableStateOf(initialTitle)}
    var switchOpen by remember{mutableStateOf(false)}
    val switchState=remember(initialRoom){RoomSwitchState(initialRoom)}
    val chatSession=remember(liveRoomId){WaveChatSession(liveRoomId!=null)}
    BindRoomChat(chatSession,liveRoomId)
    val focusManager = LocalFocusManager.current
    val keyboardController = LocalSoftwareKeyboardController.current
    val context = LocalContext.current
    val mixerDeck = remember(context) { WaveMixerDeckState(context.applicationContext) }
    var activeTab by remember(room) { mutableStateOf(if (room != RoomModule.WAVE) WaveTab.WAVE else WaveTab.MIXEUR) }
    // Keep the highlighted snapshot even if the live feed trims old messages or tabs change.
    var pinnedChatMessage by remember { mutableStateOf<WaveChatMessage?>(null) }
    var waveNotificationsRead by remember { mutableStateOf(false) }
    val guestState = remember(initialRoom,liveRoomId) { WaveGuestState(cageDemo = initialRoom == RoomModule.CAGE, classeDemo = initialRoom == RoomModule.CLASSE,live=liveRoomId!=null) }
    BindRoomGuests(guestState,liveRoomId,room==RoomModule.CLASSE)
    BindGuestSearch(guestState,liveRoomId)
    var giftRecipient by remember { mutableStateOf<WaveGuest?>(null) }
    val roomGifts=remember(guestState,programScope){LogeToolsState(context.applicationContext,guestState,"gifts:"+programScope,false)}
    LaunchedEffect(roomGifts){while(true){roomGifts.tick();delay(250)}}
    LaunchedEffect(roomGifts,liveRoomId) {
        if(liveRoomId!=null) {
            roomGifts.giftLive=true
            roomGifts.acceptGiftInventory(List(6){0},emptyList())
            val remote=RoomGiftRemote(LogeRemoteRepository(context.applicationContext,liveRoomId))
            roomGifts.remoteGift={remote.send(it,roomGifts)}
            roomGifts.giftCommand={action,id->launch{
                if(!roomGifts.remoteBusy){roomGifts.remoteBusy=true
                    try{remote.command(action,id);remote.refresh(roomGifts);roomGifts.notice=null}
                    catch(e:kotlinx.coroutines.CancellationException){throw e}
                    catch(e:Exception){roomGifts.notice=e.message?:"Action non enregistrée"}
                    finally{roomGifts.remoteBusy=false}
                }
            }}
            try{while(true){
                if(!roomGifts.remoteBusy)try{remote.refresh(roomGifts)}
                catch(e:kotlinx.coroutines.CancellationException){throw e}
                catch(e:Exception){roomGifts.notice=e.message?:"Inventaire indisponible"}
                delay(2500)
            }}finally{roomGifts.remoteGift=null;roomGifts.giftCommand=null}
        }
    }
    val classeCache=remember{mutableMapOf<RoomModule,ClasseToolsState>()}
    val sceneCache=remember{mutableMapOf<RoomModule,SceneToolsState>()}
    val logeCache=remember{mutableMapOf<RoomModule,LogeToolsState>()}
    val placeCache=remember{mutableMapOf<RoomModule,PlaceToolsState>()}
    val cageCache=remember{mutableMapOf<RoomModule,CageToolsState>()}
    val waveCache=remember{mutableMapOf<RoomModule,WaveCompositionState>()}
    val appliedRooms=remember{mutableSetOf(initialRoom)}
    val classe = remember(room, guestState, programScope) { if (room == RoomModule.CLASSE) classeCache.getOrPut(room){ClasseToolsState(context.applicationContext, guestState, programScope).also { if (!roomTitle.isNullOrBlank() && !roomTitle.equals(room.label, ignoreCase = true)) it.title = roomTitle.orEmpty() }} else null }
    val scene = remember(room, guestState, programScope) { if (room == RoomModule.SCENE) sceneCache.getOrPut(room){SceneToolsState(context.applicationContext, guestState, programScope + ":" + roomTitle.orEmpty(),room==initialRoom)} else null }
    val loge = remember(room, guestState, programScope) { if (room == RoomModule.LOGE) logeCache.getOrPut(room){LogeToolsState(context.applicationContext, guestState, if(liveRoomId!=null)"live:"+liveRoomId else programScope + ":" + roomTitle.orEmpty(),liveRoomId==null&&room==initialRoom)} else null }
    val place = remember(room, guestState, programScope) { if (room == RoomModule.PLACE) placeCache.getOrPut(room){PlaceToolsState(context.applicationContext, guestState, programScope + ":" + roomTitle.orEmpty())} else null }
    val exitScope = rememberCoroutineScope()
    var endingLive by remember { mutableStateOf(false) }
    var exitFailure by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(classe, liveRoomId) {
        if(classe!=null && liveRoomId!=null) {
            val remote=LogeRemoteRepository(context.applicationContext,liveRoomId)
            classe.beginRemote(liveRoomId)
            classe.remoteAction={name,payload->launch{classe.remoteBusy=true;try{remote.rpc(name,payload);classe.acceptRemote(remote.rpc("rooms_classe_host_state_v1",org.json.JSONObject().put("p_room_id",liveRoomId)));classe.notice=null}catch(e:Exception){classe.notice=e.message?:"Action non enregistrée"}finally{classe.remoteBusy=false}}}
            try{while(true){if(!classe.remoteBusy)try{classe.acceptRemote(remote.rpc("rooms_classe_host_state_v1",org.json.JSONObject().put("p_room_id",liveRoomId)))}catch(e:Exception){classe.notice=e.message?:"Synchronisation impossible"};delay(2500)}}finally{classe.detachRemoteGuests()}
        }
    }
    val logeNetwork=remember(liveRoomId){liveRoomId?.let{LogeRemoteRepository(context.applicationContext,it)}}
    LaunchedEffect(loge,logeNetwork) {
        if(loge!=null && logeNetwork!=null) {
            loge.remoteMode=true
            loge.remoteAction={action,payload ->
                launch { loge.remoteBusy=true;try{loge.acceptRemote(logeNetwork.action(action,payload));loge.notice=null}catch(e:Exception){loge.notice=e.message?:"Enregistrement impossible"}finally{loge.remoteBusy=false} }
            }
            try { while(true) {if(!loge.remoteBusy)try{loge.acceptRemote(logeNetwork.read())}catch(e:Exception){loge.notice=e.message?:"Synchronisation impossible"};delay(2000)} }
            finally {loge.remoteAction=null}
        }
    }
    LaunchedEffect(place) { if(place!=null)while(true){place.tick();delay(250)} }
    LaunchedEffect(loge) { if (loge != null) while (true) { loge.tick(); delay(250) } }
    LaunchedEffect(classe, guestState.guests) { classe?.syncStudents() }
    // Temporary workshop override requested for rapid Cage simulations; saved rules stay intact.
    val cage = remember(room, guestState, mixerDeck) { if (room == RoomModule.CAGE) cageCache.getOrPut(room){CageToolsState(guestState,
        simulationPassageSeconds = if (com.meewav.android.BuildConfig.DEBUG) 5 else null,
        simulationVoteSeconds = if (com.meewav.android.BuildConfig.DEBUG) 2 else null,
        requestPassageStart = mixerDeck.tools::requestPassageStart,
        cancelPassageStart = mixerDeck.tools::cancelStart,
        onPassageEnd = mixerDeck.tools::playEndHorn).also { state ->
        if (room==initialRoom && cageProgram != null) runCatching { state.applyProgram(CageProgram.decode(org.json.JSONObject(cageProgram))) }
            .onFailure { state.notice = "Le programme n’a pas pu être chargé. Choisis-le à nouveau dans Mes programmes." }
        else if (!roomTitle.isNullOrBlank()) state.title = roomTitle.orEmpty()
    }} else null }
    LaunchedEffect(cage?.selectionMode) { if (cage?.selectionMode == true) { guestState.previewId = null; guestState.profilePreviewId = null; activeTab = WaveTab.INVITES } }
    LaunchedEffect(cage?.artistAttentionId) {
        cage?.artistAttentionId?.let { id ->
            val guest = guestState.guests.find { it.id == id }
            activeTab = WaveTab.INVITES
            guestState.guestPage = when (guest?.location) { WaveGuestLocation.STAGE -> 2; WaveGuestLocation.BACKSTAGE -> 0; WaveGuestLocation.JURY -> 3; else -> 1 }
            guestState.selected = setOf(id); guestState.previewId = null
            cage.artistAttentionId = null
        }
    }
    LaunchedEffect(cage, guestState.onStage.map { it.id }) { cage?.syncManualStage() }
    DisposableEffect(Unit) { onDispose { cageCache.values.forEach{it.close()};waveCache.values.forEach{it.close()} } }
    val roomAccent = when (room) { RoomModule.CAGE -> Color(0xFFFF5B73); RoomModule.CLASSE -> classeBlue; RoomModule.SCENE -> WaveMixerTheme.capsuleAccent; RoomModule.LOGE -> Color(0xFFE9B949); RoomModule.PLACE -> Color(0xFFD5D3DC); else -> Color(0xFF27C2D1) }
    var emojiPanelOpen by remember { mutableStateOf(false) }
    // Canaux.
    var micGain by remember { mutableStateOf(0.72f) }
    var audioGain by remember { mutableStateOf(0.62f) }
    var micMuted by remember { mutableStateOf(false) }
    var audioMuted by remember { mutableStateOf(false) }
    // FX.
    var isPro by remember { mutableStateOf(false) }
    var monitoring by remember { mutableStateOf(false) }
    var autotuneOn by remember { mutableStateOf(false) }
    var reverbOn by remember { mutableStateOf(false) }
    var reverbValue by remember { mutableStateOf(0.15f) }
    var tuneKey by remember { mutableStateOf("A") }
    var tuneScale by remember { mutableStateOf("Mineur") }
    var selector by remember { mutableStateOf<String?>(null) } // "key" | "scale"
    var multitrack by remember { mutableStateOf(false) }
    val composition = remember(context, room, roomTitle) {
        if (room == RoomModule.WAVE) waveCache.getOrPut(room){WaveCompositionState(context.applicationContext, liveRoomId?.let { "live:$it" } ?: (roomTitle ?: "wave-demo"), demo = liveRoomId == null)} else null
    }
    val liveAudio = remember(room, liveRoomId, composition) {
        if (room == initialRoom && room != RoomModule.CLASSE && liveRoomId != null)
            RoomsAudioSession(context.applicationContext, RoomsAudioRepository(context.applicationContext, liveRoomId), composition?.audio, mixerDeck.audio)
        else null
    }
    val controlledGuest = if (liveAudio == null) guestState.mixerGuest else null
    LaunchedEffect(liveAudio, micGain, micMuted, monitoring, autotuneOn, reverbOn, reverbValue, tuneKey, tuneScale, composition?.publicRoute, composition?.outputGain, mixerDeck.public, audioGain, audioMuted) {
        liveAudio?.configure(WaveVocalSettings(micMuted, micGain, monitoring, autotuneOn, waveTuneScale(tuneKey, tuneScale), reverbOn, reverbValue),
            composition?.publicRoute == true, composition?.outputGain ?: 1f, mixerDeck.public, if (audioMuted) 0f else audioGain)
    }
    DisposableEffect(liveAudio) { onDispose { liveAudio?.close() } }
    LaunchedEffect(audioGain, audioMuted) { mixerDeck.volume(if (audioMuted) 0f else audioGain) }
    LaunchedEffect(composition?.snapshot?.running, composition?.snapshot?.cue) {
        if (composition?.playing == true) mixerDeck.suspendAudio()
    }
    DisposableEffect(mixerDeck) { onDispose { mixerDeck.close() } }
    val lifecycle = androidx.lifecycle.compose.LocalLifecycleOwner.current.lifecycle
    DisposableEffect(composition, lifecycle) {
        val observer = androidx.lifecycle.LifecycleEventObserver { _, event ->
            if (event == androidx.lifecycle.Lifecycle.Event.ON_STOP) { liveAudio?.stop(); composition?.suspendAudio(); mixerDeck.suspendAudio(); cage?.pause() }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    LaunchedEffect(room,switchState.version) {
        val config=switchState.configs[room] ?: return@LaunchedEffect
        if(room==RoomModule.CLASSE) classe?.apply { title=config.title; switchRoster=config.students; handsOpen=config.open;questionsOpen=config.questions;syncStudents() }
        if(appliedRooms.add(room)) {
            scene?.prepareSwitch(config)
            cage?.applyProgram(CageProgram(title=config.title,format=config.format,capacity=config.capacity,passage=config.passage,voteSeconds=config.voting))
            place?.apply { configureFloor(config.topic,60);if(data.floor.open!=config.open)toggleFloor() }
            loge?.apply { if(data.questionsOpen!=config.questions)toggleQuestions() }
            composition?.apply { rules(config.bpm,config.key);submissionRules(acceptedCategories,config.maxBars,"");if(open!=config.open)toggleIntake();importSelection(listOf(android.net.Uri.parse(config.audio)),WaveImportDestination.BASE) }
        }
    }
    val switchBlock=when {
        cage?.active?.let{!it.completed}==true -> "Termine le match en cours avant de changer de room."
        loge?.data?.moments?.any{it.status=="live"}==true -> "Termine la rencontre VIP avant de changer de room."
        scene?.live!=null -> "Termine la prestation avant de changer de room."
        classe?.speakerId!=null -> "Reprends la parole avant de changer de room."
        composition?.vote!=null || composition?.playing==true -> "Termine le vote et arrête le lecteur Wave avant de changer de room."
        place?.data?.let{it.floor.current!=null||it.floor.queue.isNotEmpty()||it.clash?.status in setOf("inviting","running","paused")||it.challenges.any{c->c.status in setOf("open","running")}}==true -> "Termine les prises de parole et activités de la Place avant de changer de room."
        else -> null
    }
    if(switchOpen) RoomSwitchSheet(switchState,guestState,switchBlock,{switchOpen=false}) { destination,config ->
        roomTitle=if(destination==initialRoom)initialTitle else config.title
        room=destination
    }
    var showLeaveConfirm by remember { mutableStateOf(false) }
    var stageFullscreen by remember { mutableStateOf(false) }
    val videoControls = rememberRoomVideoControls()
    LaunchedEffect(liveAudio, videoControls.cameraEnabled) { liveAudio?.setCameraEnabled(videoControls.cameraEnabled) }
    LaunchedEffect(liveAudio) {
        if (liveAudio != null &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            // Green Room releases its Web camera during the launch transition.
            delay(500)
            liveAudio.start(RoomsAudioMode.EXTERNAL)
        }
    }
    @Composable fun StageControls(fullscreen: Boolean, director: () -> Unit) {
        RoomVideoControlBar(videoControls,
            fullscreen = fullscreen, onFullscreen = { stageFullscreen = !stageFullscreen; videoControls.reveal() }, onDirector = director)
    }

    if (stageFullscreen) androidx.compose.ui.window.Dialog(
        onDismissRequest = { stageFullscreen = false },
        properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false),
    ) {
        Box(Modifier.fillMaxSize().background(Color.Black).systemBarsPadding().roomVideoTouches(videoControls)) {
            if (cage != null) CageVideoStage(cage, interactive = false, fullscreen = true,
                audible = videoControls.returnAudio, hostVolume = if (micMuted) 0f else micGain,
                controlBar = { StageControls(true, it) },
                hostContent = { demo -> RoomHostVideo(videoControls, session = liveAudio, demo = demo) })
            else WaveGuestStage(guestState, interactive = false, audible = videoControls.returnAudio,
                onFullscreen = { stageFullscreen = false }, controlBar = { StageControls(true, it) }) {
                RoomHostVideo(videoControls, session = liveAudio) {
                    WaveVideo(cameraOff = false, modifier = Modifier.fillMaxSize(), roomLabel = room.label, roomAccent = roomAccent)
                }
            }
            if (scene != null) SceneVideoSignals(scene, Modifier.align(Alignment.TopCenter).padding(top = 38.dp)) { scene.tab = 3; activeTab = WaveTab.WAVE; stageFullscreen = false }
            if (loge != null) LogeVideoSignals(loge, Modifier.align(Alignment.BottomCenter).padding(bottom = 55.dp))
            LogeVideoSignals(roomGifts, Modifier.align(Alignment.BottomCenter).padding(bottom = 55.dp))
        }
    }

    Box(Modifier.fillMaxSize().mixerSurfaceBackground()) {
        BoxWithConstraints(Modifier.fillMaxSize().statusBarsPadding().navigationBarsPadding().imePadding()) {
        // Insets follow the Samsung IME animation directly, with no second animation.
        // Crop the existing preview only when Chat needs room; keep the video mounted.
        val fullVideoHeight = maxWidth * 9f / 16f
        val videoViewportHeight = if (activeTab == WaveTab.CHAT)
            (maxHeight - if (emojiPanelOpen) 405.dp else 305.dp).coerceIn(0.dp, fullVideoHeight) else fullVideoHeight
        val workshopHeight = (maxHeight - 44.dp - videoViewportHeight - 6.dp).coerceAtLeast(0.dp)
        Column(Modifier.fillMaxSize()) {
            WaveHeader(title = cage?.title ?: classe?.let { it.title.takeUnless { title -> title.isBlank() || title.equals(room.label, ignoreCase = true) } ?: "Écrire des couplets plus visuels" } ?: roomTitle?.takeIf { it.isNotBlank() && it!=room.label } ?: if (room == RoomModule.WAVE) "Freestyle session — Luma invite" else if (room == RoomModule.SCENE) "Scène ouverte — Lumière noire" else if (room == RoomModule.LOGE) "Éclipse — dans la Loge de Naya" else if(room==RoomModule.PLACE)"Autour du micro — avec Luma"else room.label,
                onBack = { showLeaveConfirm = true }, onClose = { showLeaveConfirm = true },onSwitch={switchState.notice=null;switchOpen=true})
            Box(Modifier.fillMaxWidth().height(videoViewportHeight).clipToBounds().roomVideoTouches(videoControls)) {
                if (cage != null) CageVideoStage(cage, interactive = activeTab == WaveTab.INVITES,
                    audible = !stageFullscreen && videoControls.returnAudio, onFullscreen = { stageFullscreen = true },
                    hostVolume = if (micMuted) 0f else micGain,
                    controlBar = { if (!stageFullscreen) StageControls(false, it) },
                    hostContent = { demo -> RoomHostVideo(videoControls, active = !stageFullscreen, session = liveAudio, demo = demo) })
                else WaveGuestStage(guestState, interactive = activeTab == WaveTab.INVITES,
                    onFullscreen = { stageFullscreen = true }, audible = !stageFullscreen && videoControls.returnAudio,
                    controlBar = { if (!stageFullscreen) StageControls(false, it) }) {
                    RoomHostVideo(videoControls, active = !stageFullscreen, session = liveAudio) {
                        WaveVideo(cameraOff = false, modifier = Modifier.fillMaxSize(), roomLabel = room.label, roomAccent = roomAccent)
                    }
                }
                if (scene != null) SceneVideoSignals(scene, Modifier.align(Alignment.TopCenter).padding(top = 35.dp)) { scene.tab = 3; activeTab = WaveTab.WAVE }
                if (loge != null) LogeVideoSignals(loge, Modifier.align(Alignment.BottomCenter).padding(bottom = 46.dp))
                LogeVideoSignals(roomGifts, Modifier.align(Alignment.BottomCenter).padding(bottom = 46.dp))
            }
            // Zone grise du mixeur : couvre la barre d'onglets ET le corps.
            Column(
                Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .mixerBodyBackground()
            ) {
                WaveTabBar(
                    toolsLabel = room.toolsLabel,
                    active = activeTab,
                    onSelect = {
                        if (it != WaveTab.CHAT) {
                            focusManager.clearFocus()
                            keyboardController?.hide()
                        }
                        activeTab = it
                        if (it != WaveTab.INVITES) cage?.selectionMode = false
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp)
                        .padding(top = 8.dp)
                        .height(49.dp)
                )
                WaveLiveAudioControl(liveAudio, Modifier.padding(horizontal = 16.dp))
                Box(
                    Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .padding(horizontal = 12.dp)
                ) {
                when (activeTab) {
                    WaveTab.MIXEUR -> MixerBody(
                        guest = controlledGuest, deck = mixerDeck, onDeckPlay = { composition?.suspendAudio(); mixerDeck.toggle() },
                        micGain = controlledGuest?.let { guestState.guestGain(it.id) } ?: micGain, audioGain = audioGain,
                        micMuted = controlledGuest?.let { !it.mic } ?: micMuted, audioMuted = audioMuted,
                        onMicGain = { value -> controlledGuest?.let { guestState.setGuestGain(it.id, value) } ?: run { micGain = value } }, onAudioGain = { audioGain = it },
                        onMicMute = { controlledGuest?.let { guestState.toggleMic(it.id) } ?: run { micMuted = !micMuted } }, onAudioMute = { audioMuted = !audioMuted },
                        isPro = isPro, onProChange = { isPro = it },
                        monitoring = monitoring, onMonitoring = { monitoring = !monitoring },
                        autotuneOn = autotuneOn, onAutotune = { autotuneOn = !autotuneOn },
                        reverbOn = reverbOn, onReverb = { reverbOn = !reverbOn },
                        reverbValue = reverbValue, onReverbValue = { reverbValue = it },
                        tuneKey = tuneKey, tuneScale = tuneScale,
                        selector = selector, onSelector = { selector = it },
                        onSelectKey = { tuneKey = it; selector = null },
                        onSelectScale = { tuneScale = it; selector = null },
                        multitrack = multitrack, onMultitrack = { multitrack = !multitrack },
                    )
                    WaveTab.CHAT -> Column(Modifier.fillMaxSize()) {
                        WaveChatPanel(
                            chatSession=chatSession,
                            giftContent={LogeGiftPanel(roomGifts)},
                        modifier=Modifier.weight(1f), pinnedMessage = if(chatSession.live)chatSession.pinned else pinnedChatMessage,
                        onPinMessage = { if(chatSession.live)chatSession.pin?.invoke(it)else pinnedChatMessage = it },
                        notificationsRead = waveNotificationsRead,
                        onReadNotifications = { waveNotificationsRead = true },
                        onEmojiPanelChange = { emojiPanelOpen = it },
                    )
                    }
                    WaveTab.INVITES -> WaveGuestsPanel(guestState, Modifier.fillMaxSize(), cage, onProgram = { cage?.selectionMode = false; activeTab = WaveTab.WAVE })
                    else -> if (room == RoomModule.WAVE && composition != null) {
                        WaveCompositionPanel(composition, workshopHeight, onProfile = guestState::openArtistProfile)
                    } else if (cage != null) CageToolsPanel(cage, programScope) else if (classe != null) ClasseToolsPanel(classe) else if (scene != null) SceneToolsPanel(scene) { activeTab = WaveTab.INVITES } else if (loge != null) LogeToolsPanel(loge, { activeTab = WaveTab.INVITES }, { activeTab = WaveTab.CHAT }) else if(place!=null)PlaceToolsPanel(place){activeTab=WaveTab.INVITES} else WaveTabPlaceholder(activeTab, room.toolsLabel)
                }
                }
            }
        }
        WaveGuestMessageSheet(guestState, liveRoomId)
        GuestPreProfileHost(guestState, (maxHeight - 44.dp - videoViewportHeight - 6.dp).coerceAtLeast(0.dp)) { person ->
            if(guestState.guests.none{it.id==person.id})roomGifts.externalGiftRecipients=roomGifts.externalGiftRecipients+(person.id to person)
            giftRecipient=person
        }
        giftRecipient?.let { person ->
            ClasseSheet("Offrir à ${person.name}",{giftRecipient=null}) {
                Box(Modifier.fillMaxWidth().height(480.dp)){LogeGiftPanel(roomGifts,person.id)}
            }
        }
        }
        WaveGuestDragOverlay(guestState)
        if (showLeaveConfirm) {
            AlertDialog(
                onDismissRequest = { showLeaveConfirm = false },
                containerColor = Color(0xFF14121C),
                title = {
                    Text(
                        "Quitter le live ?",
                        color = WaveMixerTheme.pearl,
                        fontSize = 15.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = WaveMixerTheme.fontFamily
                    )
                },
                text = {
                    Text(
                        exitFailure ?: if (liveRoomId != null) "Tu es sur le point de terminer le live pour tous les participants." else "Tu es sur le point de quitter le live.",
                        color = white(0.72f),
                        fontSize = 13.sp,
                        fontFamily = WaveMixerTheme.fontFamily
                    )
                },
                confirmButton = {
                    Text(
                        "Quitter",
                        color = Color(0xFFFF536C),
                        fontSize = 13.sp, fontWeight = FontWeight.Bold,
                        fontFamily = WaveMixerTheme.fontFamily,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable(enabled = !endingLive) {
                                if (liveRoomId == null) { showLeaveConfirm = false; onClose() }
                                else { endingLive = true; exitFailure = null; exitScope.launch {
                                    try {
                                        LogeRemoteRepository(context, liveRoomId).rpc("rooms_end_room_v1", org.json.JSONObject().put("p_room_id", liveRoomId))
                                        showLeaveConfirm = false; onClose()
                                    } catch (_: Exception) { exitFailure = "Le live n’a pas pu être terminé. Réessaie." }
                                    finally { endingLive = false }
                                } }
                            }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                },
                dismissButton = {
                    Text(
                        "Rester",
                        color = WaveMixerTheme.pearl,
                        fontSize = 13.sp, fontWeight = FontWeight.SemiBold,
                        fontFamily = WaveMixerTheme.fontFamily,
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { showLeaveConfirm = false }
                            .padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            )
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Header — chevron.left / « La Wave » / xmark.                                */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveHeader(title: String, onBack: () -> Unit, onClose: () -> Unit,onSwitch:()->Unit) {
    Box(Modifier.fillMaxWidth().height(44.dp).padding(horizontal = 6.dp)) {
        // Chevron retour à gauche.
        Box(
            Modifier
                .align(Alignment.CenterStart)
                .size(36.dp)
                .clickable(onClick = onBack),
            contentAlignment = Alignment.Center
        ) {
            Icon(WaveIcons.ChevronLeft, null, tint = Color.White, modifier = Modifier.size(17.dp))
        }
        Text(
            title, color = WaveMixerTheme.pearl,
            fontSize = 14.sp, fontWeight = FontWeight.SemiBold,
            fontFamily = WaveMixerTheme.fontFamily, maxLines = 1,
            modifier = Modifier.align(Alignment.Center).padding(start=40.dp,end=78.dp),overflow=androidx.compose.ui.text.style.TextOverflow.Ellipsis
        )
        // Croix — prévient avant de quitter le live.
        Row(
            Modifier.align(Alignment.CenterEnd),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(Modifier.size(40.dp).clickable(onClick=onSwitch),contentAlignment=Alignment.Center){Icon(androidx.compose.material.icons.Icons.Default.SwapHoriz,"Switch Room",tint=WaveMixerTheme.capsuleAccent,modifier=Modifier.size(21.dp))}
            Box(
                Modifier
                    .size(36.dp)
                    .clickable(onClick = onClose),
                contentAlignment = Alignment.Center
            ) {
                Icon(WaveIcons.Close, null, tint = Color.White, modifier = Modifier.size(16.dp))
            }
        }
    }
}

@Composable
private fun HeaderCounter(value: String, tint: Color? = null, icon: ImageVector? = null, imageRes: Int? = null) {
    Row(
        Modifier.padding(horizontal = 4.dp).height(26.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (imageRes != null) {
            Image(painterResource(imageRes), null, modifier = Modifier.size(14.dp))
        } else if (icon != null && tint != null) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(12.dp))
        }
        Spacer(Modifier.width(4.dp))
        Text(
            value, color = white(0.88f),
            fontSize = 10.sp, fontWeight = FontWeight.Bold,
            fontFamily = WaveMixerTheme.fontFamily
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Panneau vidéo 16:9 — cellule clip r8 + camera-off + expand.                 */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveVideo(cameraOff: Boolean, modifier: Modifier = Modifier, roomLabel: String = "La Wave", roomAccent: Color = Color(0xFF27C2D1)) {
    // Chronomètre fictif qui défile depuis l'ouverture de l'écran.
    var elapsed by remember { mutableStateOf(12L * 60L + 47L) }
    LaunchedEffect(Unit) {
        while (true) { delay(1000L); elapsed++ }
    }
    val clock = "%02d:%02d:%02d".format(elapsed / 3600, (elapsed % 3600) / 60, elapsed % 60)

    Box(
        modifier
            .fillMaxWidth()
            
            .padding(0.dp)
            .drawBehind {
                // Halo blanc 0.11 r10 + 0.045 r22 autour de la cellule.
                drawRoundRect(white(0.045f), cornerRadius = CornerRadius(22.dp.toPx()))
                drawRoundRect(white(0.11f), cornerRadius = CornerRadius(10.dp.toPx()))
            }
            .padding(0.5.dp)
            .clip(RoundedCornerShape(8.dp))
            .mixerSurfaceBackground()
            .drawBehind {
                // Cheveux blanc 0.16 (0.7dp) en haut et bas.
                val lw = 0.7.dp.toPx()
                drawRect(white(0.16f), size = Size(size.width, lw))
                drawRect(white(0.16f), topLeft = Offset(0f, size.height - lw), size = Size(size.width, lw))
            }
    ) {
        // Retour vidéo — boucle muette (démo : dj-turntable / landscape-dj).
        BoxWithConstraints(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        val mediaWidth = minOf(maxWidth, maxHeight * (16f / 9f))
        AndroidView(
            factory = { ctx ->
                android.widget.VideoView(ctx).apply {
                    setVideoURI(android.net.Uri.parse("android.resource://" + ctx.packageName + "/" + R.raw.wave_live_loop))
                    setOnPreparedListener { mp ->
                        mp.isLooping = true
                        mp.setVolume(0f, 0f)
                        start()
                    }
                }
            },
            onRelease = { it.stopPlayback() },
            modifier = Modifier.width(mediaWidth).height(mediaWidth * 9f / 16f)
        )
        }
        // Chip chrono — haut-gauche, verre sombre translucide + point rouge.
        Row(
            Modifier
                .align(Alignment.TopStart)
                .padding(top = 8.dp, start = 10.dp)
                .clip(RoundedCornerShape(50))
                .background(Color(0xFF04040A).copy(alpha = 0.48f))
                .border(1.dp, white(0.10f), RoundedCornerShape(50))
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                Modifier.size(6.dp).drawBehind {
                    drawCircle(Color(0xFFFF536C).copy(alpha = 0.25f), radius = size.minDimension / 2f)
                    drawCircle(Color(0xFFFF536C), radius = size.minDimension * 0.32f)
                }
            )
            Spacer(Modifier.width(5.dp))
            Text(
                clock, color = Color.White,
                fontSize = 9.sp, fontWeight = FontWeight.SemiBold, letterSpacing = 0.6.sp,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        // Chip « LA WAVE » — haut-droite, recette rooms-home-card__room-type (accent #27C2D1).
        Row(
            Modifier
                .align(Alignment.TopEnd)
                .padding(top = 8.dp, end = 10.dp)
                .clip(RoundedCornerShape(50))
                .background(Color(0xFF060712).copy(alpha = 0.52f))
                .background(roomAccent.copy(alpha = 0.10f))
                .border(1.dp, roomAccent.copy(alpha = 0.42f), RoundedCornerShape(50))
                .padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                roomLabel.uppercase(java.util.Locale.FRANCE), color = roomAccent,
                fontSize = 8.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
    }
}

private fun black44() = Color.Black.copy(alpha = 0.44f)

/* ------------------------------------------------------------------------- */
/* Tab bar — capsule chrome navigation subdued + capsule active animée.        */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveTabBar(
    toolsLabel: String,
    active: WaveTab,
    onSelect: (WaveTab) -> Unit,
    modifier: Modifier = Modifier,
) {
    val view = LocalView.current
    val shape = RoundedCornerShape(17.dp)
    Box(
        modifier
            .hifiBlackSurface(17.dp)
            .clip(shape)
            .padding(3.dp)
    ) {
        BoxWithConstraints(Modifier.fillMaxSize()) {
            val slot = maxWidth / 4f
            val capsuleX by animateDpAsState(targetValue = slot * active.ordinal, label = "tab")
            // Capsule active glissante.
            Box(
                Modifier
                    .offset(x = capsuleX)
                    .width(slot)
                    .fillMaxHeight()
                    .activeCapsule(13.dp)
            )
            Row(Modifier.fillMaxSize()) {
                WaveTab.entries.forEach { tab ->
                    val isActive = tab == active
                    Box(
                        Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable(
                                interactionSource = remember { MutableInteractionSource() },
                                indication = null
                            ) {
                                view.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK)
                                onSelect(tab)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                if (tab == WaveTab.WAVE && toolsLabel == "Classe") Icons.Filled.School else if (tab == WaveTab.WAVE && toolsLabel == "Scène") WaveIcons.MusicNote else if (tab == WaveTab.WAVE && toolsLabel == "Loge") Icons.Filled.MeetingRoom else if(tab == WaveTab.WAVE && toolsLabel == "Place") Icons.Filled.People else tab.icon, null,
                                tint = if (isActive) WaveMixerTheme.violetSoft else WaveMixerTheme.secondary,
                                modifier = Modifier.size(14.dp)
                            )
                            Spacer(Modifier.width(5.dp))
                            Text(
                                if (tab == WaveTab.WAVE) toolsLabel else tab.label,
                                color = if (isActive) WaveMixerTheme.pearl else WaveMixerTheme.secondary,
                                fontSize = 10.5.sp,
                                fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Medium,
                                fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
                            )
                        }
                    }
                }
            }
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Corps du Mixeur — strips alignés + diviseur + colonne FX + deck.            */
/* ------------------------------------------------------------------------- */

@Composable
internal fun MixerBody(
    guest: WaveGuest?,
    deck: WaveMixerDeckState, onDeckPlay: () -> Unit,
    micGain: Float, audioGain: Float, micMuted: Boolean, audioMuted: Boolean,
    onMicGain: (Float) -> Unit, onAudioGain: (Float) -> Unit,
    onMicMute: () -> Unit, onAudioMute: () -> Unit,
    isPro: Boolean, onProChange: (Boolean) -> Unit,
    monitoring: Boolean, onMonitoring: () -> Unit,
    autotuneOn: Boolean, onAutotune: () -> Unit,
    reverbOn: Boolean, onReverb: () -> Unit,
    reverbValue: Float, onReverbValue: (Float) -> Unit,
    tuneKey: String, tuneScale: String,
    selector: String?, onSelector: (String?) -> Unit,
    onSelectKey: (String) -> Unit, onSelectScale: (String) -> Unit,
    multitrack: Boolean, onMultitrack: () -> Unit,
) {
    BoxWithConstraints(Modifier.fillMaxSize()) {
        val deckHeight by animateDpAsState(if (multitrack) maxHeight else 168.dp.coerceAtMost(maxHeight),
            androidx.compose.animation.core.spring(dampingRatio = .9f, stiffness = 320f), label = "Déploiement du deck")
        val channelHeight = (maxHeight - deckHeight - 8.dp).coerceAtLeast(0.dp)
        Column(Modifier.fillMaxSize()) {
        // Région haute : strips + diviseur + FX.
        BoxWithConstraints(Modifier.fillMaxWidth().height(channelHeight).then(Modifier.clipToBounds()).padding(top = 10.dp)) {
            val cw = maxWidth
            val slot = (cw - 6.dp) / 4f
            Box(Modifier.offset(x = 3.dp).width(slot * 2f).height(32.dp)) {
                Row(Modifier.width(slot * 1.5f - 22.dp).fillMaxHeight(), verticalAlignment = Alignment.CenterVertically) {
                    Image(painterResource(guest?.portrait ?: R.drawable.wave_artist_luma), null,
                        modifier = Modifier.size(28.dp).clip(CircleShape))
                    Spacer(Modifier.width(5.dp))
                    Text(guest?.name ?: "Luma", modifier = Modifier.weight(1f), color = WaveMixerTheme.pearl,
                        fontSize = 13.sp, maxLines = 1, overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis)
                }
                Box(Modifier.offset(x = slot * 1.5f - 20.dp, y = 8.dp).width(1.dp).height(16.dp).background(white(.12f)))
                Box(Modifier.offset(x = slot * 1.5f - 16.dp).size(32.dp), contentAlignment = Alignment.Center) {
                    Icon(WaveIcons.MusicNote, "Piste musicale", tint = WaveMixerTheme.pearl, modifier = Modifier.size(16.dp))
                }
            }
            // Strip Micro sous le slot Chat, Audio sous le slot Mixeur.
            WaveChannelStrip(
                label = guest?.name ?: "Luma", icon = WaveIcons.Mic,
                portraitRes = guest?.portrait ?: R.drawable.wave_artist_luma,
                showHeader = false,
                gain = micGain, muted = micMuted, isMic = true,
                onGainChange = onMicGain, onToggleMute = onMicMute,
                modifier = Modifier.offset(x = 3.dp).width(slot).fillMaxHeight().padding(top = 40.dp)
            )
            WaveChannelStrip(
                label = "Audio", icon = WaveIcons.MusicNote,
                showHeader = false,
                gain = audioGain, muted = audioMuted, isMic = false,
                onGainChange = onAudioGain, onToggleMute = onAudioMute,
                modifier = Modifier.offset(x = 3.dp + slot).width(slot).fillMaxHeight().padding(top = 40.dp)
            )
            // Séparateur vertical centré, blanc 0.07, marges v6.
            Box(
                Modifier
                    .offset(x = cw / 2f - 0.5.dp)
                    .width(1.dp)
                    .fillMaxHeight()
                    .padding(vertical = 6.dp)
                    .background(white(0.07f))
            )
            // Colonne FX (moitié droite, inset 16 depuis le diviseur).
            FxColumn(
                isPro = isPro, onProChange = onProChange,
                monitoring = monitoring, onMonitoring = onMonitoring,
                autotuneOn = autotuneOn, onAutotune = onAutotune,
                reverbOn = reverbOn, onReverb = onReverb,
                reverbValue = reverbValue, onReverbValue = onReverbValue,
                tuneKey = tuneKey, tuneScale = tuneScale,
                selector = selector, onSelector = onSelector,
                onSelectKey = onSelectKey, onSelectScale = onSelectScale,
                modifier = Modifier
                    .offset(x = cw / 2f + 16.dp)
                    .width(cw / 2f - 16.dp)
                    .fillMaxHeight()
            )
        }
        WaveMixerDeckPanel(deck, multitrack, onMultitrack, onDeckPlay,
            Modifier.fillMaxWidth().height(deckHeight).padding(top = 4.dp, bottom = 4.dp))
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Colonne FX — cluster utilitaire + cartes / panneau sélecteur.               */
/* ------------------------------------------------------------------------- */

@Composable
private fun FxColumn(
    isPro: Boolean, onProChange: (Boolean) -> Unit,
    monitoring: Boolean, onMonitoring: () -> Unit,
    autotuneOn: Boolean, onAutotune: () -> Unit,
    reverbOn: Boolean, onReverb: () -> Unit,
    reverbValue: Float, onReverbValue: (Float) -> Unit,
    tuneKey: String, tuneScale: String,
    selector: String?, onSelector: (String?) -> Unit,
    onSelectKey: (String) -> Unit, onSelectScale: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Rangée utilitaire h32, alignée à droite : [Simple|Pro] + casque.
        Row(
            Modifier.fillMaxWidth().height(32.dp),
            horizontalArrangement = Arrangement.End,
            verticalAlignment = Alignment.CenterVertically
        ) {
            SimpleProToggle(isPro = isPro, onChange = onProChange)
            Spacer(Modifier.width(8.dp))
            HeadphoneButton(enabled = monitoring, onToggle = onMonitoring)
        }
        if (isPro) {
            ProPluginsPanel(Modifier.fillMaxWidth().weight(1f))
        } else if (selector == null) {
            // Carte Autotune.
            FxCard(
                title = "Autotune", icon = WaveIcons.Waveform,
                on = autotuneOn, onToggle = onAutotune,
                modifier = Modifier.fillMaxWidth().weight(1f)
            ) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TuneSelectorField(
                        label = "Clé", value = tuneKey,
                        enabled = autotuneOn,
                        onClick = { onSelector("key") },
                        modifier = Modifier.weight(0.40f)
                    )
                    TuneSelectorField(
                        label = "Gamme", value = tuneScale,
                        enabled = autotuneOn,
                        onClick = { onSelector("scale") },
                        modifier = Modifier.weight(0.60f)
                    )
                }
            }
            // Carte Réverb.
            FxCard(
                title = "Réverb", icon = WaveIcons.Reverb,
                on = reverbOn, onToggle = onReverb,
                modifier = Modifier.fillMaxWidth().weight(1f)
            ) {
                ReverbSlider(value = reverbValue, enabled = reverbOn, onChange = onReverbValue)
            }
        } else {
            TuneSelectorPanel(
                kind = selector,
                currentKey = tuneKey, currentScale = tuneScale,
                onSelectKey = onSelectKey, onSelectScale = onSelectScale,
                onClose = { onSelector(null) },
                modifier = Modifier.fillMaxWidth().weight(1f)
            )
        }
    }
}

/* ------------------------------------------------------------------------- */
/* Panneau Pro — Effets voix + ajout de plugin (parité iOS proPanel).          */
/* ------------------------------------------------------------------------- */

@Composable
private fun ProPluginsPanel(modifier: Modifier = Modifier) {
    Column(
        modifier.verticalScroll(rememberScrollState()),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            "Effets voix",
            color = white(0.86f),
            fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
            fontFamily = WaveMixerTheme.fontFamily
        )
        Row(
            Modifier
                .fillMaxWidth()
                .height(40.dp)
                .clip(RoundedCornerShape(10.dp))
                .satinControl(10.dp)
                .clickable { },
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(WaveIcons.Add, null, tint = white(0.88f), modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(6.dp))
            Text(
                "Ajouter un plugin",
                color = white(0.88f),
                fontSize = 12.sp, fontWeight = FontWeight.SemiBold,
                fontFamily = WaveMixerTheme.fontFamily
            )
        }
        Text(
            "Aucun plugin disponible.",
            color = white(0.48f),
            fontSize = 10.sp, fontWeight = FontWeight.Bold,
            fontFamily = WaveMixerTheme.fontFamily,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Toggle Simple/Pro — capsule E-bis sur l'option active.                      */
/* ------------------------------------------------------------------------- */

@Composable
private fun SimpleProToggle(isPro: Boolean, onChange: (Boolean) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.CenterVertically) {
        ProOption(label = "Simple", active = !isPro, onClick = { onChange(false) })
        ProOption(label = "Pro", active = isPro, onClick = { onChange(true) })
    }
}

@Composable
private fun ProOption(label: String, active: Boolean, onClick: () -> Unit) {
    Box(
        Modifier
            .height(26.dp)
            .then(if (active) Modifier.roomsStudioCapsule() else Modifier)
            .clip(RoundedCornerShape(13.dp))
            .clickable(onClick = onClick)
            .padding(horizontal = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            label,
            color = if (active) Color.White else white(0.46f),
            fontSize = 12.sp,
            fontWeight = if (active) FontWeight.SemiBold else FontWeight.Medium,
            fontFamily = WaveMixerTheme.fontFamily
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Bouton casque (monitoring) — matériau B regular / capsule E.                */
/* ------------------------------------------------------------------------- */

@Composable
private fun HeadphoneButton(enabled: Boolean, onToggle: () -> Unit) {
    Box(
        Modifier
            .size(26.dp)
            .clip(CircleShape)
            .then(
                if (enabled) Modifier.activeCapsule(13.dp)
                else Modifier.hardwareSurface(13.dp, raised = true, reflection = 0.085f)
            )
            .clickable(onClick = onToggle),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            WaveIcons.Headphones, null,
            tint = if (enabled) Color.White else white(0.58f),
            modifier = Modifier.size(11.dp)
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Panneau sélecteur — grille de clés (4 col.) ou liste de gammes, matériau C. */
/* ------------------------------------------------------------------------- */

private val AUTOTUNE_KEYS = listOf("C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B")
private val AUTOTUNE_SCALES = listOf("Chromatique", "Majeur", "Mineur")

@Composable
private fun TuneSelectorPanel(
    kind: String,
    currentKey: String,
    currentScale: String,
    onSelectKey: (String) -> Unit,
    onSelectScale: (String) -> Unit,
    onClose: () -> Unit,
    modifier: Modifier = Modifier,
) {
    HiFiBlackCard(modifier, cornerRadius = 12.dp) {
        Column(Modifier.padding(9.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    if (kind == "key") "Clé" else "Gamme",
                    color = white(0.62f), fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold, fontFamily = WaveMixerTheme.fontFamily
                )
                Spacer(Modifier.weight(1f))
                Box(
                    Modifier.size(26.dp).clip(CircleShape).clickable(onClick = onClose),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(WaveIcons.Close, null, tint = white(0.62f), modifier = Modifier.size(11.dp))
                }
            }
            if (kind == "key") {
                AUTOTUNE_KEYS.chunked(4).forEach { row ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        row.forEach { key ->
                            SelectorOption(
                                label = key, selected = key == currentKey,
                                onClick = { onSelectKey(key) },
                                modifier = Modifier.weight(1f)
                            )
                        }
                        repeat(4 - row.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
            } else {
                AUTOTUNE_SCALES.forEach { scale ->
                    SelectorOption(
                        label = scale, selected = scale == currentScale,
                        onClick = { onSelectScale(scale) },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

@Composable
private fun SelectorOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier
            .height(30.dp)
            .clip(RoundedCornerShape(8.dp))
            .satinControl(8.dp, selected = selected)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Text(
            label,
            color = if (selected) Color.White else white(0.86f),
            fontSize = 12.sp,
            fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Medium,
            fontFamily = WaveMixerTheme.fontFamily, maxLines = 1
        )
    }
}

/* ------------------------------------------------------------------------- */
/* Deck — transport + « Piste principale » + lane waveform/import.             */
/* ------------------------------------------------------------------------- */

@Composable
private fun WaveTabPlaceholder(tab: WaveTab, toolsLabel: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Icon(tab.icon, null, tint = WaveMixerTheme.muted, modifier = Modifier.size(28.dp))
            Text(
                toolsLabel, color = WaveMixerTheme.muted, fontSize = 13.sp,
                fontWeight = FontWeight.Medium, fontFamily = WaveMixerTheme.fontFamily
            )
        }
    }
}
