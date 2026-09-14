package com.meewav.android.features.auth

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color as AndroidColor
import android.graphics.Rect
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.View
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
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
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import java.io.ByteArrayInputStream
import java.io.IOException

/** Only the globe is rendered in the local WebView; navigation and CTA remain native. */
@Composable
internal fun AuthCompletionGlobe(
    modifier: Modifier = Modifier,
    interactive: Boolean = false,
    onClick: () -> Unit,
) {
    val controller = remember { AuthGlobeController() }
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
            modifier = Modifier.matchParentSize(),
            update = { controller.setInteractive(interactive) },
            onRelease = { controller.release(it) },
        )
        if (controller.unavailable) {
            Text(
                "Le globe ne peut pas s’afficher sur cet appareil.",
                color = Color.White,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center,
            )
        }
        if (!interactive) {
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

private const val GlobeOrigin = "https://meewav-auth-globe.invalid"
private const val GlobePage = "$GlobeOrigin/index.html"
private val GlobeAssets = mapOf(
    "/index.html" to "text/html",
    "/globe.css" to "text/css",
    "/globe.js" to "application/javascript",
    "/earth_specular.jpg" to "image/jpeg",
)

private class AuthGlobeController {
    private var view: AuthGlobeWebView? = null
    private var resumed = false
    private var inViewport = false
    private var interactive = false
    private var pageReady = false
    private var lastActive: Boolean? = null
    var unavailable by mutableStateOf(false)
        private set

    @SuppressLint("SetJavaScriptEnabled")
    @Suppress("DEPRECATION")
    fun create(context: Context, interactive: Boolean): AuthGlobeWebView {
        this.interactive = interactive
        pageReady = false
        lastActive = null
        unavailable = false
        return AuthGlobeWebView(context).also { globeView ->
            view = globeView
            globeView.setBackgroundColor(AndroidColor.TRANSPARENT)
            globeView.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS
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
            globeView.webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = true

                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
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
                    if (view !== webView || url != GlobePage) return
                    webView.evaluateJavascript("Boolean(window.meewavAuthGlobe)") { ready ->
                        if (view !== webView) return@evaluateJavascript
                        pageReady = ready == "true"
                        unavailable = !pageReady
                        if (pageReady) {
                            webView.evaluateJavascript("window.meewavAuthGlobe.setInteractive(${this@AuthGlobeController.interactive});", null)
                            refreshActivity()
                        }
                    }
                }
            }
            globeView.loadUrl(GlobePage)
        }
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
        if (pageReady) view?.evaluateJavascript("window.meewavAuthGlobe.setInteractive($value);", null)
    }

    fun action(name: String) {
        // Fixed native actions only; never interpolate user content into JS.
        if (pageReady && interactive && name in setOf("zoomIn", "zoomOut", "rotateLeft", "rotateRight", "resetView")) {
            view?.evaluateJavascript("window.meewavAuthGlobe.$name();", null)
        }
    }

    private fun refreshActivity() {
        val globeView = view ?: return
        if (!pageReady) return
        val active = resumed && inViewport && globeView.isAttachedToWindow &&
            globeView.isShown && globeView.windowVisibility == View.VISIBLE &&
            globeView.getGlobalVisibleRect(Rect())
        if (lastActive == active) return
        lastActive = active
        if (active) globeView.onResume()
        globeView.evaluateJavascript("window.meewavAuthGlobe.setActive($active);", null)
        if (!active) globeView.onPause()
    }

    fun release(globeView: AuthGlobeWebView) {
        if (view !== globeView) return
        view = null
        pageReady = false
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
        globeView.evaluateJavascript("window.meewavAuthGlobe?.dispose();") {
            mainHandler.removeCallbacks(destroy)
            destroy.run()
        }
    }
}

private class AuthGlobeWebView(context: Context) : WebView(context) {
    var visibilityChanged: (() -> Unit)? = null

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
}

private fun permittedAsset(uri: Uri): String? = uri.encodedPath?.takeIf {
    uri.scheme == "https" && uri.host == "meewav-auth-globe.invalid" &&
        uri.port == -1 && uri.userInfo == null && uri.encodedQuery == null &&
        uri.encodedFragment == null && GlobeAssets.containsKey(it)
}

private fun denied() = WebResourceResponse(
    "text/plain", "utf-8", 403, "Forbidden",
    mapOf("Cache-Control" to "no-store"), ByteArrayInputStream(ByteArray(0)),
)
