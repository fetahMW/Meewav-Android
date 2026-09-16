package com.meewav.android.features.auth

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.graphics.Color as AndroidColor
import android.graphics.Rect
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.MotionEvent
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceError
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.boundsInWindow
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import java.io.ByteArrayInputStream
import java.io.IOException
import org.json.JSONObject
import com.meewav.android.features.messaging.MessagingActivity
import com.meewav.android.features.profile.ProfileActivity

/** Only the globe is rendered in the local WebView; navigation and CTA remain native. */
@Composable
internal fun AuthCompletionGlobe(
    modifier: Modifier = Modifier,
    interactive: Boolean = false,
    onClick: () -> Unit,
    onLoadingChange: (Boolean) -> Unit = {},
    previewMessages: Boolean = false,
) {
    val controller = remember(interactive) { AuthGlobeController(interactive) }
    controller.previewMessages = previewMessages
    LaunchedEffect(controller.ready, controller.unavailable) {
        onLoadingChange(!controller.ready && !controller.unavailable)
    }
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner, controller) {
        val lifecycle = lifecycleOwner.lifecycle
        val observer = LifecycleEventObserver { _, _ ->
            controller.setLifecycleActive(lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED))
        }
        lifecycle.addObserver(observer)
        controller.setLifecycleActive(lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED))
        onDispose {
            lifecycle.removeObserver(observer)
            controller.setLifecycleActive(false)
        }
    }
    Box(
        modifier = modifier
            .then(if (interactive) Modifier else Modifier.aspectRatio(1f))
            .onGloballyPositioned { coordinates ->
                val bounds = coordinates.boundsInWindow()
                controller.setInViewport(coordinates.isAttached && bounds.width > 0 && bounds.height > 0)
            }
            .then(if (interactive) Modifier.semantics {
                contentDescription = "Globe Meewav. Glisse pour tourner et pince pour zoomer."
                customActions = listOf(
                    CustomAccessibilityAction("Agrandir le globe") { controller.action("zoomIn"); true },
                    CustomAccessibilityAction("Réduire le globe") { controller.action("zoomOut"); true },
                    CustomAccessibilityAction("Tourner à gauche") { controller.action("rotateLeft"); true },
                    CustomAccessibilityAction("Tourner à droite") { controller.action("rotateRight"); true },
                    CustomAccessibilityAction("Recentrer le globe") { controller.action("resetView"); true },
                )
            } else Modifier),
        contentAlignment = Alignment.Center,
    ) {
        AndroidView(
            factory = { context -> controller.create(context, interactive) },
            modifier = Modifier.fillMaxSize(),
            update = { controller.setInteractive(interactive) },
            onRelease = { controller.release(it) },
        )
        if (controller.unavailable) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    "Le globe n’a pas pu se charger.",
                    color = Color.White,
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center,
                )
                TextButton(onClick = controller::reload) { Text("Réessayer", color = Color.White) }
            }
        } else if (!controller.ready && !interactive) {
            CircularProgressIndicator(Modifier.size(28.dp), color = Color(0xFF8B5CF6), strokeWidth = 2.dp)
        }
        if (!interactive && controller.ready) {
            // Touches and TalkBack trigger Compose directly. The page never
            // receives auth callbacks or a JavaScript-to-Android interface.
            Box(Modifier.matchParentSize()
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    role = Role.Button,
                    onClickLabel = "Entrer sur le globe",
                    onClick = onClick,
                )
                .semantics { contentDescription = "Entrer sur le globe" })
        }
    }
}

private const val GlobeOrigin = "https://appassets.androidplatform.net"
private const val GlobeAssetPath = "/assets/auth-globe"
private const val GlobePage = "$GlobeOrigin$GlobeAssetPath/index.html"
private val GlobeAssets = mapOf(
    "/index.html" to "text/html",
    "/globe.css" to "text/css",
    "/globe.js" to "application/javascript",
    "/earth_specular.jpg" to "image/jpeg",
)

private class AuthGlobeController(private val fullScene: Boolean) {
    var previewMessages = false
    private val page = if (fullScene) "$GlobeOrigin/globe-vinyle/index.html" else GlobePage
    private val api = if (fullScene) "meewavFullGlobe" else "meewavAuthGlobe"
    private var view: AuthGlobeWebView? = null
    private var resumed = false
    private var inViewport = false
    private var interactive = false
    var ready by mutableStateOf(false)
        private set
    private var lastActive: Boolean? = null
    private val readinessHandler = Handler(Looper.getMainLooper())
    private var loadGeneration = 0
    var unavailable by mutableStateOf(false)
        private set

    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
    fun create(context: Context, interactive: Boolean): AuthGlobeWebView {
        this.interactive = interactive
        ready = false
        lastActive = null
        unavailable = false
        return AuthGlobeWebView(context).also { globeView ->
            view = globeView
            // WebView must use the Compose viewport, not wrap its HTML content.
            // WRAP_CONTENT collapses percentage/vh heights even when the native view is measured.
            globeView.layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT,
            )
            globeView.alpha = if (fullScene) 1f else 0f
            globeView.setBackgroundColor(if (fullScene) AndroidColor.rgb(8, 9, 13) else AndroidColor.TRANSPARENT)
            globeView.importantForAccessibility = if (fullScene) View.IMPORTANT_FOR_ACCESSIBILITY_AUTO
                else View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
            globeView.isVerticalScrollBarEnabled = false
            globeView.isHorizontalScrollBarEnabled = false
            globeView.overScrollMode = View.OVER_SCROLL_NEVER
            globeView.isLongClickable = false
            globeView.setOnLongClickListener { true }
            globeView.visibilityChanged = ::refreshActivity
            globeView.settings.apply {
                javaScriptEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                allowFileAccessFromFileURLs = false
                allowUniversalAccessFromFileURLs = false
                blockNetworkLoads = true
                domStorageEnabled = false
                databaseEnabled = false
                javaScriptCanOpenWindowsAutomatically = false
                setSupportMultipleWindows(false)
                setGeolocationEnabled(false)
                mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                cacheMode = WebSettings.LOAD_NO_CACHE
                mediaPlaybackRequiresUserGesture = true
                textZoom = 100
                setSupportZoom(false)
                builtInZoomControls = false
                displayZoomControls = false
            }
            globeView.webChromeClient = object : WebChromeClient() {
                override fun onPermissionRequest(request: PermissionRequest) { request.deny() }
            }
            val fullAssets = if (fullScene) JSONObject(context.assets.open("globe-vinyle/asset-manifest.json")
                .bufferedReader().use { it.readText() }) else null
            globeView.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    if (fullScene && request.isForMainFrame && request.method == "GET"
                        && request.url.scheme == "https" && request.url.host == "appassets.androidplatform.net"
                        && request.url.path in setOf("/native/messages", "/native/profile", "/native/tremplin", "/native/market", "/native/scene")) {
                        val destination = when (request.url.path) {
                            "/native/profile" -> ProfileActivity::class.java
                            "/native/tremplin" -> com.meewav.android.features.tremplin.TremplinActivity::class.java
                        "/native/market" -> com.meewav.android.features.market.MarketActivity::class.java
                        "/native/scene" -> com.meewav.android.features.scene.SceneActivity::class.java
                            else -> MessagingActivity::class.java
                        }
                        val defaultRoute = request.url.path.orEmpty().removePrefix("/native")
                        context.startActivity(Intent(context, destination)
                            .putExtra("preview", previewMessages)
                            .putExtra("route", request.url.getQueryParameter("route") ?: defaultRoute))
                        return true
                    }
                    return request.method != "GET" || request.url.toString() != page
                }

                override fun onReceivedError(webView: WebView, request: WebResourceRequest, error: WebResourceError) {
                    if (view === webView && request.isForMainFrame) showLoadFailure(webView)
                }

                override fun onReceivedHttpError(webView: WebView, request: WebResourceRequest, response: WebResourceResponse) {
                    if (view === webView && request.isForMainFrame) showLoadFailure(webView)
                }

                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                    if (fullAssets != null) return fullGlobeAsset(context, request, fullAssets)
                    val asset = permittedAsset(request.url)
                    if (request.method != "GET" || asset == null) return denied()
                    return try {
                        WebResourceResponse(
                            GlobeAssets.getValue(asset),
                            if (asset.endsWith(".jpg")) null else "utf-8",
                            200, "OK",
                            mapOf("Cache-Control" to "no-store", "X-Content-Type-Options" to "nosniff"),
                            context.assets.open("auth-globe${asset}"),
                        )
                    } catch (_: IOException) { denied() }
                }

                override fun onPageFinished(webView: WebView, url: String) {
                    if (view !== webView || url != page || unavailable) return
                    awaitFirstFrame(webView, loadGeneration)
                }
            }
            // A real asset URL, handled above from the APK before any network access.
            // loadDataWithBaseURL generated a data: request that our filter rejected.
            reload()
        }
    }

    fun reload() {
        val globeView = view ?: return
        readinessHandler.removeCallbacksAndMessages(null)
        loadGeneration++
        ready = false
        unavailable = false
        lastActive = null
        globeView.alpha = if (fullScene) 1f else 0f
        globeView.onResume()
        globeView.loadUrl(page)
    }

    private fun awaitFirstFrame(webView: WebView, generation: Int, attempt: Int = 0) {
        if (view !== webView || generation != loadGeneration || unavailable) return
        webView.evaluateJavascript("window.$api?.status ?? 'loading'") { status ->
            if (view !== webView || generation != loadGeneration || unavailable) return@evaluateJavascript
            when (status) {
                "\"ready\"" -> {
                    ready = true
                    webView.alpha = 1f
                    webView.evaluateJavascript("window.$api.setInteractive($interactive);", null)
                    refreshActivity()
                }
                "\"loading\"" -> if (attempt < if (fullScene) 150 else 40) {
                    readinessHandler.postDelayed({ awaitFirstFrame(webView, generation, attempt + 1) }, 200L)
                } else showLoadFailure(webView)
                else -> showLoadFailure(webView)
            }
        }
    }

    private fun showLoadFailure(webView: WebView) {
        readinessHandler.removeCallbacksAndMessages(null)
        ready = false
        unavailable = true
        webView.alpha = 0f
        webView.evaluateJavascript("window.$api?.setActive(false);", null)
    }

    fun setLifecycleActive(active: Boolean) {
        resumed = active
        refreshActivity()
    }

    fun setInViewport(visible: Boolean) {
        inViewport = visible
        refreshActivity()
    }

    fun setInteractive(value: Boolean) {
        if (interactive == value) return
        interactive = value
        if (ready) view?.evaluateJavascript("window.$api.setInteractive($value);", null)
    }

    fun action(name: String) {
        // Fixed native actions only; never interpolate user content into JS.
        if (ready && interactive && name in setOf("zoomIn", "zoomOut", "rotateLeft", "rotateRight", "resetView")) {
            view?.evaluateJavascript("window.$api.$name();", null)
        }
    }

    private fun refreshActivity() {
        val globeView = view ?: return
        if (!ready) return
        val active = resumed && inViewport && globeView.isAttachedToWindow &&
            globeView.isShown && globeView.windowVisibility == View.VISIBLE &&
            globeView.getGlobalVisibleRect(Rect())
        if (lastActive == active) return
        lastActive = active
        if (active) globeView.onResume()
        globeView.evaluateJavascript("window.$api.setActive($active);", null)
        if (!active) globeView.onPause()
    }

    fun release(globeView: AuthGlobeWebView) {
        if (view !== globeView) return
        view = null
        ready = false
        loadGeneration++
        readinessHandler.removeCallbacksAndMessages(null)
        lastActive = null
        globeView.visibilityChanged = null
        globeView.stopLoading()
        // Let the local scene release GPU resources before destroying its
        // WebView. The short fallback also releases a stalled renderer.
        // No global pauseTimers call affects another WebView in the app.
        val mainHandler = Handler(Looper.getMainLooper())
        var destroyed = false
        val destroy = Runnable {
            if (!destroyed) {
                destroyed = true
                globeView.onPause()
                globeView.removeAllViews()
                globeView.destroy()
            }
        }
        mainHandler.postDelayed(destroy, 250L)
        globeView.evaluateJavascript("window.$api?.dispose();") {
            mainHandler.removeCallbacks(destroy)
            destroy.run()
        }
    }
}

/** Only manifest-listed files in the bundled full scene can be fetched, including workers. */
private fun fullGlobeAsset(context: Context, request: WebResourceRequest, manifest: JSONObject): WebResourceResponse {
    val uri = request.url
    if (request.method != "GET" || uri.scheme != "https" || uri.host != "appassets.androidplatform.net" ||
        uri.port != -1 || uri.userInfo != null || uri.encodedQuery != null || uri.encodedFragment != null) return denied()
    val path = uri.path ?: return denied()
    if (!path.startsWith("/globe-vinyle/")) return denied()
    val asset = path.removePrefix("/globe-vinyle/")
    if (asset.split('/').any { it.isBlank() || it == "." || it == ".." } || '\\' in asset || '\u0000' in asset) return denied()
    val record = manifest.optJSONObject(asset) ?: return denied()
    val mime = record.getString("mime")
    return try {
        if (mime.startsWith("audio/") || mime.startsWith("video/")) {
            return localMediaAsset(context, "globe-vinyle/$asset", mime, record.getLong("bytes"),
                request.requestHeaders.entries.firstOrNull { it.key.equals("Range", ignoreCase = true) }?.value)
        }
        WebResourceResponse(mime,
            if (mime.startsWith("text/") || mime in setOf("application/javascript", "application/json", "image/svg+xml")) "utf-8" else null,
            200, "OK", mapOf("Cache-Control" to "no-store", "X-Content-Type-Options" to "nosniff",
                "Content-Length" to record.getLong("bytes").toString()),
            context.assets.open("globe-vinyle/$asset"))
    } catch (_: IOException) { denied() }
}

private class AuthGlobeWebView(context: Context) : WebView(context) {
    var visibilityChanged: (() -> Unit)? = null

    // WebView handles clicks and its accessibility tree; this only reserves the
    // gesture from Compose parents and must not synthesize a second click.
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.actionMasked == MotionEvent.ACTION_DOWN) parent?.requestDisallowInterceptTouchEvent(true)
        val handled = super.onTouchEvent(event)
        if (event.actionMasked == MotionEvent.ACTION_UP || event.actionMasked == MotionEvent.ACTION_CANCEL) {
            parent?.requestDisallowInterceptTouchEvent(false)
        }
        return handled
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        visibilityChanged?.invoke()
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        visibilityChanged?.invoke()
    }

    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        visibilityChanged?.invoke()
    }

    override fun onVisibilityAggregated(isVisible: Boolean) {
        super.onVisibilityAggregated(isVisible)
        visibilityChanged?.invoke()
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        visibilityChanged?.invoke()
    }
}

private fun permittedAsset(uri: Uri): String? {
    if (uri.scheme != "https" || uri.host != "appassets.androidplatform.net" ||
        uri.port != -1 || uri.userInfo != null || uri.encodedQuery != null || uri.encodedFragment != null) return null
    val path = uri.encodedPath ?: return null
    if (!path.startsWith("$GlobeAssetPath/")) return null
    return path.removePrefix(GlobeAssetPath).takeIf(GlobeAssets::containsKey)
}

private fun denied() = WebResourceResponse(
    "text/plain", "utf-8", 403, "Forbidden",
    mapOf("Cache-Control" to "no-store"), ByteArrayInputStream(ByteArray(0)),
)
