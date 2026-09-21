package com.meewav.android.features.rooms.wave

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import java.util.UUID
import com.meewav.android.features.messaging.MessagingActivity
import com.meewav.android.features.profile.ProfileActivity
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.activity.compose.BackHandler
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.Dp
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.hideFromAccessibility
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.meewav.android.features.auth.fullGlobeAsset
import com.meewav.android.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

private const val ProfilePage = "https://appassets.androidplatform.net/globe-vinyle/guest-preprofile.html"

/** One persistent artist sheet, with actions and the shared Globe content as two pages. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun GuestPreProfileHost(state: WaveGuestState, availableHeight: Dp, onOffer:(WaveGuest)->Unit) {
    val offer by rememberUpdatedState(onOffer)
    val context = LocalContext.current
    val manifest by produceState<JSONObject?>(null, context) {
        value = withContext(Dispatchers.IO) {
            JSONObject(context.assets.open("globe-vinyle/asset-manifest.json").bufferedReader().use { it.readText() })
        }
    }
    val assets = manifest ?: return
    val content = remember(context, assets) {
        GuestProfileContent(context, assets,
            onClose = { state.profilePreviewId = null; state.previewId = null },
            onOffer = { person -> state.profilePreviewId=null;state.previewId=null;offer(person) },
            onContact = { id -> state.profilePreviewId = null; state.previewId = null; state.classroomQuickMessage = false; state.messageRecipientIds = setOf(id) })
    }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(content, lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            when (event) {
                Lifecycle.Event.ON_RESUME -> content.view.onResume()
                Lifecycle.Event.ON_PAUSE -> content.pause()
                else -> Unit
            }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer); content.dispose() }
    }
    val guest = state.guests.find { it.id == state.profilePreviewId } ?: state.externalProfile?.takeIf { it.id == state.profilePreviewId }
    val candidate = guest ?: state.guests.find { it.id == state.previewId }
    // Prepare portrait/media while the guest action sheet is already open.
    LaunchedEffect(candidate) { content.show(candidate) }
    LaunchedEffect(guest?.id) { if (guest == null) content.pauseMedia() }

    val dismiss = { state.profilePreviewId = null; state.previewId = null }
    if (candidate == null) {
        // Attached and warm without reserving screen space or exposing an accessibility tree.
        ProfileBrowser(content, Modifier.size(1.dp).alpha(0f).semantics { hideFromAccessibility() })
    } else {
        val sheetHeight = availableHeight
        ModalBottomSheet(onDismissRequest = dismiss,
            sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp),
            containerColor = Color(0xFF07090C), contentColor = Color.White,
            dragHandle = null) {
            BackHandler(enabled = guest != null) { state.profilePreviewId = null }
            Column(Modifier.fillMaxWidth().height(sheetHeight).border(.75.dp, Brush.linearGradient(
                listOf(Color(0xFF757487), Color(0xFF343440), Color(0xFF1C1D26), Color(0xFF494456))),
                RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)).background(Brush.verticalGradient(
                listOf(Color(0xFF24262F), Color(0xFF0B0D12), Color(0xFF030405)), endY = 320f))) {
                Box(Modifier.fillMaxWidth().height(44.dp), contentAlignment = Alignment.Center) {
                    Box(Modifier.width(44.dp).height(4.dp).clip(RoundedCornerShape(4.dp)).background(Color(0xFF686A7D)))
                    if (guest != null) IconButton(onClick = { state.profilePreviewId = null }, modifier = Modifier.align(Alignment.CenterStart)) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Retour aux actions", tint = WaveMixerTheme.capsuleAccentSoft)
                    }
                    IconButton(onClick = dismiss, modifier = Modifier.align(Alignment.CenterEnd)) {
                        Icon(WaveIcons.Close, "Fermer la fiche artiste", tint = WaveMixerTheme.capsuleAccentSoft.copy(alpha = .72f))
                    }
                }
                Box(Modifier.fillMaxWidth().weight(1f)) {
                    if (guest == null) {
                        GuestPreviewContent(state, candidate)
                        ProfileBrowser(content, Modifier.size(1.dp).alpha(0f).semantics { hideFromAccessibility() })
                    } else {
                        ProfileBrowser(content, Modifier.fillMaxSize())
                        if (content.renderedId != guest.id) {
                            Box(Modifier.fillMaxSize().background(Color(0xFF030405)), contentAlignment = Alignment.Center) {
                                CircularProgressIndicator(color = WaveMixerTheme.capsuleAccentSoft,
                                    modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProfileBrowser(content: GuestProfileContent, modifier: Modifier) {
    AndroidView(modifier = modifier, factory = { context -> FrameLayout(context).apply { content.attach(this) } },
        update = { content.attach(it) }, onRelease = { host ->
            if (content.view.parent === host) host.removeView(content.view)
        })
}

@SuppressLint("SetJavaScriptEnabled")
private class GuestProfileContent(context: Context, manifest: JSONObject,
    private val onClose: () -> Unit, private val onContact: (String) -> Unit, private val onOffer:(WaveGuest)->Unit) {
    private var ready = false
    private var disposed = false
    private var current: WaveGuest? = null
    @Volatile private var portraitResources: Set<Int> = emptySet()
    var renderedId by mutableStateOf<String?>(null)
        private set
    val view = WebView(context).apply {
        setBackgroundColor(android.graphics.Color.TRANSPARENT)
        isVerticalScrollBarEnabled = false
        isHorizontalScrollBarEnabled = false
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (!request.isForMainFrame || uri.scheme != "https" || uri.host != "appassets.androidplatform.net") return true
                when (uri.path) {
                    "/native/ready" -> { ready = true; publish() }
                    "/native/rendered" -> {
                        val id = uri.getQueryParameter("id")
                        view.postVisualStateCallback(0, object : WebView.VisualStateCallback() {
                            override fun onComplete(requestId: Long) {
                                if (!disposed && current?.id == id) renderedId = id
                            }
                        })
                    }
                    "/native/close" -> onClose()
                    "/native/contact" -> current?.let { onContact(it.id) }
                    "/native/collaboration", "/native/profile" -> current?.let { person ->
                        val real = runCatching { UUID.fromString(person.id) }.isSuccess
                        val profile = uri.path == "/native/profile"
                        val route = if (profile) Uri.Builder().path("/profile/view/${person.id}")
                            .appendQueryParameter("name", person.name).build().toString()
                        else Uri.Builder().path("/messages").appendQueryParameter("space", "collabs")
                            .appendQueryParameter("intent", "collaboration").appendQueryParameter("source", "rooms")
                            .appendQueryParameter("mode", if (real) "real" else "demo")
                            .appendQueryParameter(if (real) "profileId" else "mockArtistId", person.id)
                            .appendQueryParameter("mockArtistName", person.name).build().toString()
                        context.startActivity(Intent(context, if (profile) ProfileActivity::class.java else MessagingActivity::class.java)
                            .putExtra("route", route).putExtra("preview", !real))
                        onClose()
                    }
                    "/native/gift" -> current?.let(onOffer)
                }
                return true
            }
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                val uri = request.url
                // Share the exact artwork used by GuestGrade in the native actions sheet.
                if (uri.scheme == "https" && uri.host == "appassets.androidplatform.net" && uri.path?.startsWith("/guest-grade/") == true) {
                    val badges = listOf(R.drawable.wave_grade_1, R.drawable.wave_grade_2, R.drawable.wave_grade_3,
                        R.drawable.wave_grade_4, R.drawable.wave_grade_5, R.drawable.wave_grade_6)
                    val level = uri.lastPathSegment?.toIntOrNull()
                    if (level != null && level in 1..6) return WebResourceResponse("image/png", null, context.resources.openRawResource(badges[level - 1]))
                }
                // Immutable portrait URLs prevent an old request from displaying the next guest.
                if (uri.scheme == "https" && uri.host == "appassets.androidplatform.net" && uri.path?.startsWith("/guest-portrait/") == true) {
                    val res = uri.lastPathSegment?.toIntOrNull()
                    if (res != null && res in portraitResources) return WebResourceResponse("image/png", null, context.resources.openRawResource(res))
                }
                return fullGlobeAsset(context, request, manifest)
            }
        }
        loadUrl(ProfilePage)
    }

    fun show(guest: WaveGuest?) {
        if (current == guest) return
        current = guest
        if (guest != null) portraitResources = portraitResources + guest.portrait
        renderedId = null
        publish()
    }
    private fun publish() {
        if (!ready || disposed) return
        val payload = current?.let { JSONObject().put("id", it.id).put("name", it.name)
            .put("role", it.role).put("grade", it.gradeLevel).put("portrait", "/guest-portrait/${it.portrait}") }?.toString() ?: "null"
        view.evaluateJavascript("window.dispatchEvent(new CustomEvent('meewav:guest-profile',{detail:$payload}))", null)
    }
    fun attach(host: FrameLayout) {
        if (view.parent === host) return
        (view.parent as? ViewGroup)?.removeView(view)
        host.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    }
    fun pauseMedia() {
        view.evaluateJavascript("document.querySelectorAll('video,audio').forEach(media=>media.pause())", null)
    }
    fun pause() {
        pauseMedia()
        view.onPause()
    }
    fun dispose() { disposed = true; (view.parent as? ViewGroup)?.removeView(view); view.stopLoading(); view.destroy() }
}
