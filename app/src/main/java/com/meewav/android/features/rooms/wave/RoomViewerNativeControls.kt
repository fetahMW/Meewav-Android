package com.meewav.android.features.rooms.wave

import android.net.Uri
import android.view.View
import android.webkit.WebView
import android.widget.FrameLayout
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.unit.dp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import com.meewav.android.R
import org.json.JSONObject
import kotlin.math.roundToInt

/** Shared host controls, embedded above the local Viewer WebView. No host authority. */
internal class RoomViewerNativeControls(
    private val activity: ComponentActivity, private val web: WebView, private val parent: FrameLayout,
) : AutoCloseable {
    private var room by mutableStateOf("")
    private var mode by mutableStateOf("none")
    private var draft by mutableStateOf("")
    private var pending by mutableStateOf<String?>(null)
    private var sentText = ""
    private var emoji by mutableStateOf(false)
    private var name by mutableStateOf("Moi")
    private var mixerState = ViewerMixerControlState()
    private var rect = JSONObject()
    private val layer = ComposeView(activity).apply {
        setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
        visibility = View.GONE
    }
    init {
        parent.addView(layer, FrameLayout.LayoutParams(1, 1))
        layer.setContent {
            key(room) {
                val deck = remember { WaveMixerDeckState(activity.applicationContext, allowPublic = false) }
                DisposableEffect(deck) {
                    val observer = LifecycleEventObserver { _, event -> if (event == Lifecycle.Event.ON_STOP) deck.suspendAudio() }
                    activity.lifecycle.addObserver(observer)
                    onDispose { activity.lifecycle.removeObserver(observer); deck.close() }
                }
                if (mode == "mixer") ViewerMixerControls(deck, name, mixerState, ::emit)
                if (mode == "composer") {
                    val input = remember { WaveEmojiInputController() }
                    DisposableEffect(Unit) { onDispose { input.hideKeyboard() } }
                    Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Bottom) {
                        if (emoji) MwEmojiWall(208.dp, { input.insert(it) }, { emoji = false; position() })
                        WaveChatComposer(draft, input, emoji, { draft = it }, { emoji = !emoji; position() }) {
                            if (pending == null && draft.isNotBlank()) {
                                val id = java.util.UUID.randomUUID().toString()
                                pending = id; sentText = draft.trim()
                                emit("chat", JSONObject().put("id", id).put("text", sentText))
                                layer.postDelayed({
                                    if (pending == id) {
                                        pending = null
                                        Toast.makeText(activity, "Envoi non confirmé. Ton message est conservé.", Toast.LENGTH_SHORT).show()
                                    }
                                }, 15000)
                            }
                        }
                    }
                }
            }
        }
    }
    private fun emit(action: String, data: JSONObject) {
        val payload = JSONObject().put("action", action).put("data", data)
        web.evaluateJavascript("window.dispatchEvent(new CustomEvent('meewav:native-viewer-action',{detail:$payload}));", null)
    }
    fun handle(uri: Uri): Boolean {
        if (uri.path !in setOf("/native/viewer-controls", "/native/viewer-result")) return false
        val raw = uri.getQueryParameter("data") ?: return true
        if (raw.length > 12000) return true
        val data = runCatching { JSONObject(raw) }.getOrNull() ?: return true
        if (uri.path == "/native/viewer-result") {
            if (data.optString("id") == pending) {
                if (data.optBoolean("ok") && draft.trim() == sentText) draft = ""
                pending = null
            }
            if (!data.optBoolean("ok") && data.optString("action") == "mixer") {
                when(data.optString("key")) { "voiceMuted" -> mixerState.voiceMuted = true; "tune" -> mixerState.tune = false }
            }
            if (!data.optBoolean("ok")) Toast.makeText(activity, data.optString("error", "Action indisponible"), Toast.LENGTH_SHORT).show()
            return true
        }
        val nextRoom = data.optString("room").take(160)
        if (room != nextRoom) { draft = ""; pending = null; emoji = false; mixerState = ViewerMixerControlState(); room = nextRoom }
        val nextMode = data.optString("mode")
        if (mode != nextMode) emoji = false
        mode = if (nextMode in setOf("mixer", "composer")) nextMode else "none"
        name = data.optString("name", "Moi").take(80)
        rect = data
        position()
        return true
    }
    private fun position() {
        if (mode == "none" || room.isBlank() || web.width == 0) { layer.visibility = View.GONE; return }
        val viewport = rect.optDouble("viewport", 0.0)
        if (!viewport.isFinite() || viewport <= 0) return
        val scale = web.width / viewport
        val extra = if (mode == "composer" && emoji) 216 * activity.resources.displayMetrics.density else 0f
        val x = (rect.optDouble("x", 0.0) * scale).roundToInt().coerceIn(0, web.width)
        val bottom = ((rect.optDouble("y", 0.0) + rect.optDouble("height", 0.0)) * scale).roundToInt().coerceIn(0, web.height)
        val y = (rect.optDouble("y", 0.0) * scale - extra).roundToInt().coerceIn(0, bottom)
        val width = (rect.optDouble("width", 0.0) * scale).roundToInt().coerceIn(0, web.width - x)
        if (width <= 0 || bottom <= y) { layer.visibility = View.GONE; return }
        layer.layoutParams = FrameLayout.LayoutParams(width, bottom - y).apply { leftMargin = x; topMargin = y }
        layer.visibility = View.VISIBLE
        layer.bringToFront()
    }
    override fun close() { layer.disposeComposition(); parent.removeView(layer) }
}

private class ViewerMixerControlState {
    var voice by mutableStateOf(.72f)
    var audio by mutableStateOf(.62f)
    var voiceMuted by mutableStateOf(true)
    var audioMuted by mutableStateOf(false)
    var pro by mutableStateOf(false)
    var monitor by mutableStateOf(false)
    var tune by mutableStateOf(false)
    var reverb by mutableStateOf(false)
    var reverbValue by mutableStateOf(.15f)
    var key by mutableStateOf("A")
    var scale by mutableStateOf("Mineur")
    var selector by mutableStateOf<String?>(null)
    var expanded by mutableStateOf(false)
}

@Composable private fun ViewerMixerControls(deck: WaveMixerDeckState, name: String, state: ViewerMixerControlState, action: (String, JSONObject) -> Unit) = with(state) {
    fun command(key: String, value: Any) = action("mixer", JSONObject().put("key", key).put("value", value))
    LaunchedEffect(audio, audioMuted) { deck.volume(if (audioMuted) 0f else audio) }
    Box(Modifier.fillMaxSize()) {
        MixerBody(
            guest = WaveGuest("viewer", name, "", R.drawable.wave_chat_artist_0, WaveGuestLocation.REQUESTED),
            deck = deck, onDeckPlay = { deck.toggle() },
            micGain = voice, audioGain = audio, micMuted = voiceMuted, audioMuted = audioMuted,
            onMicGain = { voice = it; command("voiceGain", it) }, onAudioGain = { audio = it },
            onMicMute = { voiceMuted = !voiceMuted; command("voiceMuted", voiceMuted) }, onAudioMute = { audioMuted = !audioMuted },
            isPro = pro, onProChange = { pro = it }, monitoring = monitor, onMonitoring = { monitor = !monitor; command("monitoring", monitor) },
            autotuneOn = tune, onAutotune = { tune = !tune; command("tune", tune) },
            reverbOn = reverb, onReverb = { reverb = !reverb; command("reverb", reverb) },
            reverbValue = reverbValue, onReverbValue = { reverbValue = it; command("reverbAmount", it) },
            tuneKey = key, tuneScale = scale, selector = selector, onSelector = { selector = it },
            onSelectKey = { key = it; selector = null; command("tuneKey", it) },
            onSelectScale = { scale = it; selector = null; command("tuneScale", it) },
            multitrack = expanded, onMultitrack = { expanded = !expanded },
        )
    }
}
