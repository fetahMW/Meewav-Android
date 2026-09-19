package com.meewav.android.features.rooms.wave

import android.Manifest
import android.app.KeyguardManager
import android.content.pm.ActivityInfo
import android.content.pm.PackageManager
import android.graphics.Color
import android.view.View
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.meewav.android.features.auth.localMediaAsset
import org.json.JSONObject
import java.io.ByteArrayInputStream

/** The actual Web director, embedded above the existing native mixer/chat.
 * Only bundled files are served; no token/interface is exposed to this demo stage.
 */
class RoomVideoDirector(private val activity: ComponentActivity) : DefaultLifecycleObserver {
    companion object {
        private const val ORIGIN = "https://appassets.androidplatform.net"
        private const val PAGE = "$ORIGIN/rooms/director.html"
        private const val CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'none'"
    }
    var expanded by mutableStateOf(false)
        private set
    private val manifest = JSONObject(activity.assets.open("rooms/asset-manifest.json").bufferedReader().use { it.readText() })
    private var request: PermissionRequest? = null
    private var fullscreen: View? = null
    private var fullscreenCallback: WebChromeClient.CustomViewCallback? = null
    private var orientation = ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    private var disposed = false
    private val back = object : OnBackPressedCallback(false) {
        override fun handleOnBackPressed() = closeFullscreen()
    }
    private val permissionLauncher = activity.registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        val pending = request
        request = null
        if (pending != null) {
            if (mayCapture() && pending.resources.all { resource ->
                permission(resource)?.let { ContextCompat.checkSelfPermission(activity, it) == PackageManager.PERMISSION_GRANTED } == true
            }) pending.grant(pending.resources) else pending.deny()
        }
    }
    val web = WebView(activity).apply {
        setBackgroundColor(Color.rgb(3, 4, 6))
        isVerticalScrollBarEnabled = false
        isHorizontalScrollBarEnabled = false
        overScrollMode = View.OVER_SCROLL_NEVER
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            textZoom = 100
        }
        webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (request.isForMainFrame && request.method == "GET" && view.url == PAGE &&
                    request.url.scheme == "https" && request.url.host == "appassets.androidplatform.net" &&
                    request.url.path == "/native/director-size") {
                    expanded = request.url.getQueryParameter("expanded") == "true"
                }
                return true
            }
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                val uri = request.url
                if (request.method != "GET" || uri.scheme != "https" || uri.host != "appassets.androidplatform.net") return denied()
                val name = uri.path.orEmpty().removePrefix("/").removePrefix("rooms/")
                if (name.split('/').any { it == ".." || it == "." } || !manifest.has(name)) return denied()
                return try {
                    val item = manifest.getJSONObject(name)
                    val mime = item.getString("mime")
                    if (mime.startsWith("audio/") || mime.startsWith("video/"))
                        localMediaAsset(activity, "rooms/$name", mime, item.getLong("bytes"), request.requestHeaders["Range"])
                    else WebResourceResponse(mime, if (mime.startsWith("text/") || mime.contains("javascript") || mime.contains("json")) "utf-8" else null,
                        200, "OK", mapOf("Content-Security-Policy" to CSP, "X-Content-Type-Options" to "nosniff", "Cache-Control" to "no-store"), activity.assets.open("rooms/$name"))
                } catch (_: Exception) { denied() }
            }
        }
        webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(pending: PermissionRequest) {
                if (pending.origin.toString().trimEnd('/') != ORIGIN || !mayCapture() || pending.resources.isEmpty() ||
                    pending.resources.any { permission(it) == null } || request != null) { pending.deny(); return }
                val needed = pending.resources.mapNotNull(::permission).distinct().filter {
                    ContextCompat.checkSelfPermission(activity, it) != PackageManager.PERMISSION_GRANTED
                }
                if (needed.isEmpty()) pending.grant(pending.resources)
                else { request = pending; permissionLauncher.launch(needed.toTypedArray()) }
            }
            override fun onPermissionRequestCanceled(pending: PermissionRequest) { if (request === pending) request = null }
            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                if (fullscreen != null || disposed) { callback.onCustomViewHidden(); return }
                fullscreen = view; fullscreenCallback = callback; back.isEnabled = true
                orientation = activity.requestedOrientation
                activity.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                (activity.window.decorView as ViewGroup).addView(view, FrameLayout.LayoutParams(-1, -1))
                WindowCompat.getInsetsController(activity.window, view).apply {
                    systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                    hide(WindowInsetsCompat.Type.systemBars())
                }
            }
            override fun onHideCustomView() = closeFullscreen()
        }
        loadUrl(PAGE)
    }
    init {
        activity.lifecycle.addObserver(this)
        activity.onBackPressedDispatcher.addCallback(activity, back)
    }
    private fun permission(resource: String) = when (resource) {
        PermissionRequest.RESOURCE_VIDEO_CAPTURE -> Manifest.permission.CAMERA
        PermissionRequest.RESOURCE_AUDIO_CAPTURE -> Manifest.permission.RECORD_AUDIO
        else -> null
    }
    private fun mayCapture(): Boolean = !disposed && web.url == PAGE &&
        activity.lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) &&
        !activity.getSystemService(KeyguardManager::class.java).isDeviceLocked
    private fun closeFullscreen() {
        val view = fullscreen ?: return
        fullscreen = null; back.isEnabled = false
        (view.parent as? ViewGroup)?.removeView(view)
        activity.requestedOrientation = orientation
        WindowCompat.getInsetsController(activity.window, activity.window.decorView).show(WindowInsetsCompat.Type.systemBars())
        val callback = fullscreenCallback; fullscreenCallback = null
        callback?.onCustomViewHidden()
    }
    private fun denied() = WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(byteArrayOf()))
    override fun onResume(owner: LifecycleOwner) { if (!disposed) web.onResume() }
    override fun onPause(owner: LifecycleOwner) {
        if (disposed) return
        // The permission sheet can pause the Activity. Do not invalidate its request.
        if (request == null) web.evaluateJavascript("window.dispatchEvent(new Event('meewav:room-suspend'))", null)
        web.onPause()
    }
    override fun onStop(owner: LifecycleOwner) {
        request?.deny(); request = null
        if (!disposed) web.evaluateJavascript("window.dispatchEvent(new Event('meewav:room-suspend'))", null)
    }
    override fun onDestroy(owner: LifecycleOwner) {
        request?.deny(); request = null; closeFullscreen(); disposed = true
        (web.parent as? ViewGroup)?.removeView(web)
        web.destroy(); back.remove(); activity.lifecycle.removeObserver(this)
    }
}
