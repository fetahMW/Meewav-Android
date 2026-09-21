package com.meewav.android.features.rooms.wave

import android.content.Context
import android.util.Log
import com.ss.bytertc.engine.*
import com.ss.bytertc.engine.data.*
import com.ss.bytertc.engine.handler.IRTCEngineEventHandler
import com.ss.bytertc.engine.handler.IRTCRoomEventHandler
import com.ss.bytertc.engine.type.AudioProfileType
import com.ss.bytertc.engine.type.ChannelProfile
import com.ss.bytertc.engine.utils.AudioFrame
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.Instant
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.locks.LockSupport

internal enum class RoomsAudioMode(val label: String) { EXTERNAL("Voix traitée + programme"), INTERNAL("Micro brut · FX non diffusés"), LISTEN("Écoute seule") }
internal data class RoomsAudioStatus(val active: Boolean = false, val busy: Boolean = false, val text: String = "Audio live déconnecté")

/** One lifecycle owner; all SDK mutations on Main, sender stopped before engine destruction. */
internal class RoomsAudioSession(private val context: Context, private val repository: RoomsAudioRepository,
    private val audio: WaveCompositionAudio?, private val productionAudio: WaveCompositionAudio? = null) : AutoCloseable {
    companion object { private val owned = AtomicBoolean(false) }
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val mutableStatus = MutableStateFlow(RoomsAudioStatus())
    val status = mutableStatus.asStateFlow()
    private var engine: RTCEngine? = null
    private var rtc: RTCRoom? = null
    private var microphone: WaveMicrophone? = null
    private var output: WaveLiveOutput? = null
    private var sender: Thread? = null
    @Volatile private var sending = false
    private var job: Job? = null
    private var generation = 0
    private var owns = false
    private var mode = RoomsAudioMode.LISTEN
    private var identity: RoomsAudioIdentity? = null
    private var settings = WaveVocalSettings()
    private var musicPublic = false
    private var musicGain = 1f
    private var deckPublic = false
    private var deckGain = 1f
    private val subscribed = mutableSetOf<String>()
    private val published = mutableMapOf<String, String>() // streamId -> canonical userId
    private var joined: CompletableDeferred<Unit>? = null
    private var publication: CompletableDeferred<Unit>? = null

    fun configure(vocal: WaveVocalSettings, publicMusic: Boolean, gain: Float, publicDeck: Boolean = false, productionGain: Float = 1f) {
        val justMuted = !settings.mute && vocal.mute
        val flush = justMuted || (musicPublic && !publicMusic) || (deckPublic && !publicDeck) ||
            (musicGain > 0f && gain == 0f) || (deckGain > 0f && productionGain == 0f)
        settings = vocal; musicPublic = publicMusic; musicGain = gain
        deckPublic = publicDeck; deckGain = productionGain
        microphone?.settings = vocal
        output?.let {
            it.musicPublic = publicMusic; it.musicGain = gain
            it.production.enabled = publicDeck; it.production.gain = productionGain
            if (!publicDeck) it.production.clear()
            if (flush) it.bus.clear()
        }
        if (mode == RoomsAudioMode.INTERNAL) { engine?.muteAudioCapture(vocal.mute); engine?.setCaptureVolume((vocal.gain * 100).toInt()) }
    }
    fun start(selected: RoomsAudioMode) {
        if (job?.isActive == true) return
        mode = selected
        val epoch = ++generation
        mutableStatus.value = RoomsAudioStatus(busy = true, text = "Connexion audio Rooms…")
        job = scope.launch {
            try {
                check(owned.compareAndSet(false, true)) { "Une session Rooms audio est déjà active" }; owns = true
                val room = repository.resolve(joinIfMissing = true); identity = room
                val canPublish = selected != RoomsAudioMode.LISTEN
                check(!canPublish || room.canPublish) { "Ton rôle actuel ne permet pas de diffuser" }
                val token = repository.token(room, canPublish)
                ensureActive()
                val sdk = RTCEngine.createRTCEngine(EngineConfig().apply { this.context = this@RoomsAudioSession.context.applicationContext; appID = token.appId },
                    object : IRTCEngineEventHandler() {
                        override fun onConnectionStateChanged(state: Int, reason: Int) {
                            Log.i("WaveRTC", "connection=$state reason=$reason")
                        }
                    }) ?: error("BytePlus indisponible")
                engine = sdk
                requireOk(sdk.setAudioProfile(AudioProfileType.AUDIO_PROFILE_HD), "Profil audio")
                requireOk(sdk.setAudioSourceType(if (selected == RoomsAudioMode.EXTERNAL) AudioSourceType.AUDIO_SOURCE_TYPE_EXTERNAL else AudioSourceType.AUDIO_SOURCE_TYPE_INTERNAL), "Source audio")
                val channel = sdk.createRTCRoom(room.channel) ?: error("Canal RTC indisponible")
                rtc = channel; joined = CompletableDeferred(); publication = CompletableDeferred()
                channel.setRTCRoomEventHandler(object : IRTCRoomEventHandler() {
                    override fun onRoomStateChanged(id: String?, uid: String?, state: Int, extra: String?) {
                        scope.launch { if (epoch == generation) {
                            if (state == 0) joined?.complete(Unit)
                            else if (state < 0) fail("Connexion RTC refusée ($state)")
                        } }
                    }
                    override fun onAudioPublishStateChanged(id: String?, stream: StreamInfo?, state: PublishState?, reason: PublishStateChangeReason?) {
                        scope.launch { if (epoch == generation) {
                            if (state == PublishState.PUBLISHED) publication?.complete(Unit)
                            else if (mutableStatus.value.active && mode != RoomsAudioMode.LISTEN) fail("Publication audio interrompue")
                        } }
                    }
                    override fun onAudioStreamBanned(uid: String?, banned: Boolean) {
                        scope.launch { if (epoch == generation && uid == room.identity && banned) fail("Micro coupé par la régie") }
                    }
                    override fun onUserPublishStreamAudio(id: String?, stream: StreamInfo?, publishing: Boolean) {
                        scope.launch { if (epoch == generation && stream != null && !stream.isScreen) {
                            if (publishing) published[stream.streamId] = stream.userId else { published.remove(stream.streamId); subscribed.remove(stream.streamId) }
                            runCatching { reconcile() }.onFailure { fail("Écoute distante interrompue") }
                        } }
                    }
                    override fun onUserLeave(uid: String?, reason: Int) { scope.launch { if (epoch == generation) {
                        val left = published.filterValues { it == uid }.keys.toSet()
                        left.forEach { published.remove(it); subscribed.remove(it) }
                    } } }
                    override fun onTokenWillExpire() { renew(epoch) }
                    override fun onPublishPrivilegeTokenWillExpire() { renew(epoch) }
                    override fun onSubscribePrivilegeTokenWillExpire() { renew(epoch) }
                })
                requireOk(channel.joinRoom(token.token, UserInfo(room.identity, ""), canPublish,
                    RTCRoomConfig(ChannelProfile.CHANNEL_PROFILE_LIVE, room.identity, false, false, false, false)), "Entrée RTC")
                withTimeout(20000) { joined!!.await() }
                if (selected == RoomsAudioMode.EXTERNAL) {
                    check(audio != null) { "Moteur programme absent" }
                    val mic = WaveMicrophone { message -> scope.launch { if (epoch == generation) fail(message) } }
                    microphone = mic; mic.settings = settings; mic.start()
                    val live = WaveLiveOutput(mic, WavePerformanceBus()).also { it.musicPublic = musicPublic; it.musicGain = musicGain }
                    live.production.enabled = deckPublic; live.production.gain = deckGain
                    productionAudio?.programInput = live.production
                    output = live; audio.liveOutput = live
                    startSender(sdk, live.bus, epoch)
                } else if (selected == RoomsAudioMode.INTERNAL) {
                    requireOk(sdk.muteAudioCapture(settings.mute), "Mute micro")
                    requireOk(sdk.setCaptureVolume((settings.gain * 100).toInt()), "Gain micro")
                    requireOk(sdk.startAudioCapture(), "Capture interne")
                }
                if (canPublish) {
                    requireOk(channel.publishStreamAudio(true), "Publication audio")
                    withTimeout(15000) { publication!!.await() }
                }
                mutableStatus.value = RoomsAudioStatus(active = true, text = when(selected) {
                    RoomsAudioMode.EXTERNAL -> "Live · voix traitée diffusée"
                    RoomsAudioMode.INTERNAL -> "Live · micro brut, FX non diffusés"
                    RoomsAudioMode.LISTEN -> "Live · écoute seule"
                })
                var expires = Instant.parse(token.expiresAt).epochSecond
                while (isActive) {
                    delay(2000)
                    val current = repository.resolve()
                    check(current.identity == room.identity && current.channel == room.channel) { "Session audio modifiée" }
                    check(!canPublish || current.canPublish) { "Autorisation de diffusion retirée" }
                    identity = current; reconcile()
                    if (Instant.now().epochSecond >= expires - 120) {
                        val refreshed = repository.token(current, canPublish)
                        requireOk(channel.updateToken(refreshed.token), "Renouvellement audio")
                        expires = Instant.parse(refreshed.expiresAt).epochSecond
                    }
                }
            } catch (cancel: CancellationException) { throw cancel }
            catch (error: Throwable) {
                Log.w("WaveRTC", "Session stopped: ${error.javaClass.simpleName}")
                mutableStatus.value = RoomsAudioStatus(text = error.message ?: "Audio live interrompu")
            } finally { teardown(); job = null }
        }
    }
    private fun reconcile() {
        val local = identity ?: return
        val allowed = RoomsAudioPolicy.subscriptions(local, published)
        (subscribed - allowed).forEach { requireOk(rtc!!.subscribeStreamAudio(it, false), "Arrêt écoute"); subscribed.remove(it) }
        (allowed - subscribed).forEach { requireOk(rtc!!.subscribeStreamAudio(it, true), "Écoute distante"); subscribed.add(it) }
    }
    private fun renew(epoch: Int) { scope.launch {
        if (epoch != generation) return@launch
        try {
            val room = identity ?: return@launch
            val token = repository.token(room, mode != RoomsAudioMode.LISTEN)
            if (epoch == generation) rtc?.let { requireOk(it.updateToken(token.token), "Renouvellement") }
        } catch (cancel: CancellationException) { throw cancel }
        catch (_: Exception) { if (epoch == generation) fail("Renouvellement audio refusé") }
    } }
    private fun startSender(sdk: RTCEngine, bus: WavePerformanceBus, epoch: Int) {
        sending = true
        sender = Thread({
            android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_AUDIO)
            var deadline = System.nanoTime(); var failures = 0; var empty = 0
            val silence = ByteArray(1920)
            try { while (sending) {
                val remaining = deadline - System.nanoTime()
                if (remaining > 0) { LockSupport.parkNanos(remaining); continue }
                if (!sending) break
                val packet = bus.poll()
                empty = if (packet == null) empty + 1 else 0
                val result = sdk.pushExternalAudioFrame(AudioFrame(packet ?: silence, 480,
                    AudioSampleRate.AUDIO_SAMPLE_RATE_48000, AudioChannel.AUDIO_CHANNEL_STEREO))
                failures = if (result == 0) 0 else failures + 1
                if (failures >= 10 || empty >= 100) {
                    scope.launch { if (epoch == generation) fail("Flux audio externe interrompu · reconnecte l’audio") }; break
                }
                deadline += 10_000_000L
                if (System.nanoTime() - deadline > 30_000_000L) { bus.clear(); deadline = System.nanoTime() + 10_000_000L }
            } } catch (_: Throwable) {
                if (sending) scope.launch { if (epoch == generation) fail("Envoi PCM interrompu") }
            }
        }, "Wave-RTC-PCM").apply { start() }
    }
    private fun requireOk(code: Int, operation: String) { check(code == 0) { "$operation refusé ($code)" } }
    private fun fail(message: String) { mutableStatus.value = RoomsAudioStatus(text = message); job?.cancel() }
    fun stop() {
        generation++; job?.cancel()
        mutableStatus.value = RoomsAudioStatus()
    }
    private suspend fun teardown() = withContext(NonCancellable) {
        generation++
        output?.active = false
        audio?.liveOutput = null
        productionAudio?.programInput = null
        output?.production?.clear()
        runCatching { rtc?.publishStreamAudio(false) }
        sending = false; sender?.interrupt()
        withContext(Dispatchers.IO) { sender?.join(); microphone?.close() }
        sender = null; microphone = null; output?.bus?.clear(); output = null
        runCatching { engine?.stopAudioCapture() }
        runCatching { rtc?.leaveRoom() }; runCatching { rtc?.destroy() }; rtc = null
        if (engine != null) RTCEngine.destroyRTCEngine()
        engine = null; identity = null; published.clear(); subscribed.clear()
        if (owns) { owned.set(false); owns = false }
    }
    override fun close() { stop(); scope.cancel() }
}
