package com.meewav.android.features.rooms.wave

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import com.meewav.android.features.auth.fullGlobeAsset
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

private const val ProfilePage = "https://appassets.androidplatform.net/globe-vinyle/guest-preprofile.html"

/** One preloaded Globe card per Wave screen, independent of the video/rail bounds. */
@Composable
internal fun GuestPreProfileHost(state: WaveGuestState) {
    val context = LocalContext.current
    val manifest by produceState<JSONObject?>(null, context) {
        value = withContext(Dispatchers.IO) {
            JSONObject(context.assets.open("globe-vinyle/asset-manifest.json").bufferedReader().use { it.readText() })
        }
    }
    val assets = manifest ?: return
    val content = remember(context, assets) {
        GuestProfileContent(context, assets,
            onClose = { state.profilePreviewId = null },
            onContact = { id -> state.profilePreviewId = null; state.messageRecipientIds = setOf(id) })
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
    val guest = state.guests.find { it.id == state.profilePreviewId }
    val candidate = guest ?: state.guests.find { it.id == state.previewId }
    // Prepare portrait/media while the guest action sheet is already open.
    LaunchedEffect(candidate) { content.show(candidate) }

    if (guest == null) {
        // Attached and warm without reserving screen space or exposing an accessibility tree.
        ProfileBrowser(content, Modifier.size(1.dp).alpha(0f).semantics { hideFromAccessibility() })
    } else {
        Dialog(onDismissRequest = { state.profilePreviewId = null },
            properties = DialogProperties(usePlatformDefaultWidth = false)) {
            BoxWithConstraints(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.Center) {
                Box(Modifier.matchParentSize().clickable(interactionSource = null, indication = null) {
                    state.profilePreviewId = null
                })
                val cardWidth = minOf(maxWidth, maxHeight * (413f / 540f), 413.dp)
                val cardHeight = cardWidth * (540f / 413f)
                Box(Modifier.size(cardWidth, cardHeight).clip(RoundedCornerShape(18.dp))
                    .background(Color(0xFF030405)), contentAlignment = Alignment.Center) {
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

@Composable
private fun ProfileBrowser(content: GuestProfileContent, modifier: Modifier) {
    AndroidView(modifier = modifier, factory = { context -> FrameLayout(context).apply { content.attach(this) } },
        update = { content.attach(it) }, onRelease = { host ->
            if (content.view.parent === host) host.removeView(content.view)
        })
}

@SuppressLint("SetJavaScriptEnabled")
private class GuestProfileContent(context: Context, manifest: JSONObject,
    private val onClose: () -> Unit, private val onContact: (String) -> Unit) {
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
                }
                return true
            }
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                val uri = request.url
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
            .put("grade", it.gradeLevel).put("portrait", "/guest-portrait/${it.portrait}") }?.toString() ?: "null"
        view.evaluateJavascript("window.dispatchEvent(new CustomEvent('meewav:guest-profile',{detail:$payload}))", null)
    }
    fun attach(host: FrameLayout) {
        if (view.parent === host) return
        (view.parent as? ViewGroup)?.removeView(view)
        host.addView(view, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
    }
    fun pause() {
        view.evaluateJavascript("document.querySelectorAll('video,audio').forEach(media=>media.pause())", null)
        view.onPause()
    }
    fun dispose() { disposed = true; (view.parent as? ViewGroup)?.removeView(view); view.stopLoading(); view.destroy() }
}
