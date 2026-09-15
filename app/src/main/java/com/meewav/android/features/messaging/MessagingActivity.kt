package com.meewav.android.features.messaging

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Button
import android.widget.Toast
import android.util.Base64
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.enableEdgeToEdge
import androidx.activity.SystemBarStyle
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.meewav.android.BuildConfig
import com.meewav.android.app.MeewavApplication
import com.meewav.android.app.MainActivity
import com.meewav.android.features.auth.localMediaAsset
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.launch
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import org.json.JSONObject
import org.json.JSONArray
import java.io.ByteArrayInputStream

/** Bundled messaging UI; only the configured Supabase origin can receive API traffic. */
open class MessagingActivity : ComponentActivity() {
    protected open val assetSurface = "messaging"
    protected open val defaultRoute = "/messages?space=messages"
    private val PAGE get() = "$ORIGIN/$assetSurface/index.html"
    private lateinit var web: WebView
    private lateinit var container: FrameLayout
    private var pageReady = false
    private var started = false
    private var resumed = false
    private var accessToken: String? = null
    private var profileId: String? = null
    private var fileResult: ValueCallback<Array<Uri>>? = null
    private var mediaPermissionRequest: PermissionRequest? = null
    private var stopped = false
    private var pendingSave: Pair<String, Int>? = null
    private val preview by lazy { BuildConfig.DEBUG && intent.getBooleanExtra("preview", false) }
    private val service by lazy { Uri.parse(BuildConfig.SUPABASE_URL) }
    private val manifest by lazy { JSONObject(assets.open("$assetSurface/asset-manifest.json").bufferedReader().use { it.readText() }) }
    private val globeManifest by lazy { JSONObject(assets.open("globe-vinyle/asset-manifest.json").bufferedReader().use { it.readText() }) }
    private val filePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val values = if (result.resultCode == RESULT_OK) result.data?.let { data ->
            data.clipData?.let { clip -> Array(clip.itemCount) { clip.getItemAt(it).uri } }
                ?: data.data?.let { arrayOf(it) }
        } else null
        fileResult?.onReceiveValue(values); fileResult = null
    }
    private val mediaPermissions = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        mediaPermissionRequest?.let { request ->
            val granted = request.resources.all { resource ->
                val permission = capturePermission(resource)
                permission != null && ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
            }
            if (granted && !stopped && !isFinishing && !isDestroyed && web.url == PAGE) request.grant(request.resources)
            else request.deny()
        }
        mediaPermissionRequest = null
    }
    private val savePicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val pending = pendingSave ?: return@registerForActivityResult
        pendingSave = null
        val destination = if (result.resultCode == RESULT_OK) result.data?.data else null
        lifecycleScope.launch {
            try {
                if (destination != null) {
                    val stream = withContext(Dispatchers.IO) { contentResolver.openOutputStream(destination, "w") }
                        ?: error("destination_unavailable")
                    stream.use {
                        var offset = 0
                        while (offset < pending.second) {
                            val encoded = javascript("window.meewavDownloads.chunk(${JSONObject.quote(pending.first)},$offset)")
                            val block = Base64.decode(JSONArray("[$encoded]").getString(0), Base64.DEFAULT)
                            if (block.isEmpty() || offset + block.size > pending.second) error("download_interrupted")
                            withContext(Dispatchers.IO) { it.write(block) }
                            offset += block.size
                        }
                    }
                    Toast.makeText(this@MessagingActivity, "Fichier enregistré", Toast.LENGTH_SHORT).show()
                }
            } catch (_: Exception) {
                Toast.makeText(this@MessagingActivity, "Le fichier n’a pas pu être enregistré.", Toast.LENGTH_LONG).show()
            } finally {
                if (!isDestroyed) web.evaluateJavascript("window.meewavDownloads.complete(${JSONObject.quote(pending.first)});", null)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge(statusBarStyle = SystemBarStyle.dark(Color.rgb(8, 8, 16)),
            navigationBarStyle = SystemBarStyle.dark(Color.rgb(8, 8, 16)))
        container = FrameLayout(this).apply { setBackgroundColor(Color.rgb(8, 8, 16)) }
        setContentView(container)
        ViewCompat.setOnApplyWindowInsetsListener(container) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout())
            val keyboard = insets.getInsets(WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, keyboard.bottom))
            insets
        }
        web = WebView(this).apply {
            setBackgroundColor(Color.rgb(8, 8, 16))
            isVerticalScrollBarEnabled = false; isHorizontalScrollBarEnabled = false
            overScrollMode = View.OVER_SCROLL_NEVER
            settings.apply {
                javaScriptEnabled = true; domStorageEnabled = false; databaseEnabled = false
                allowFileAccess = false; allowContentAccess = true
                allowFileAccessFromFileURLs = false; allowUniversalAccessFromFileURLs = false
                javaScriptCanOpenWindowsAutomatically = false; setSupportMultipleWindows(false)
                setGeolocationEnabled(false); mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
                mediaPlaybackRequiresUserGesture = true; textZoom = 100
                builtInZoomControls = false; displayZoomControls = false
            }
        }
        container.addView(web, FrameLayout.LayoutParams(-1, -1))
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                if (view.url != PAGE) return false
                fileResult?.onReceiveValue(null); fileResult = callback
                val types = params.acceptTypes.filter { it.contains('/') && !it.contains(',') }.toTypedArray()
                val request = Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).apply {
                    type = if (types.size == 1) types[0] else "*/*"
                    if (types.size > 1) putExtra(Intent.EXTRA_MIME_TYPES, types)
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, params.mode == FileChooserParams.MODE_OPEN_MULTIPLE)
                }
                try { filePicker.launch(request) } catch (_: Exception) { fileResult?.onReceiveValue(null); fileResult = null }
                return true
            }
            override fun onPermissionRequest(request: PermissionRequest) {
                if (request.origin.toString().trimEnd('/') != ORIGIN || web.url != PAGE || !resumed
                    || request.resources.isEmpty() || request.resources.any { capturePermission(it) == null }) { request.deny(); return }
                val permissions = request.resources.mapNotNull(::capturePermission).distinct().filter {
                    ContextCompat.checkSelfPermission(this@MessagingActivity, it) != PackageManager.PERMISSION_GRANTED
                }
                if (permissions.isEmpty()) {
                    request.grant(request.resources)
                } else {
                    if (mediaPermissionRequest != null) { request.deny(); return }
                    mediaPermissionRequest = request
                    mediaPermissions.launch(permissions.toTypedArray())
                }
            }
            override fun onPermissionRequestCanceled(request: PermissionRequest) {
                if (mediaPermissionRequest === request) mediaPermissionRequest = null
            }
        }
        web.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                if (!request.isForMainFrame) return true
                if (request.url.toString() == "$ORIGIN/native/messages" && assetSurface == "profile") {
                    startActivity(Intent(this@MessagingActivity, MessagingActivity::class.java).putExtra("preview", preview))
                    return true
                }
                if (request.url.toString() == "$ORIGIN/native/profile" && assetSurface == "messaging") {
                    startActivity(Intent(this@MessagingActivity, com.meewav.android.features.profile.ProfileActivity::class.java).putExtra("preview", preview))
                    return true
                }
                if (request.url.toString() == "$ORIGIN/native/globe") {
                    // Reuse the globe below either feature, including Profile -> Messages.
                    // Only the debug workshop can bypass the authentication entry.
                    startActivity(Intent(this@MessagingActivity, MainActivity::class.java)
                        .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
                        .putExtra(MainActivity.EXTRA_OPEN_GLOBE, BuildConfig.DEBUG))
                    finish()
                    return true
                }
                if (request.url.toString() == "$ORIGIN/native/close-app") {
                    finishAndRemoveTask()
                    startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
                        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
                    return true
                }
                if (request.url.scheme == "https" && request.url.host == "appassets.androidplatform.net" && request.url.path == "/native/save") {
                    request.url.getQueryParameter("id")?.let(::offerSave)
                    return true
                }
                if (request.url.toString() == PAGE) return false
                // A user-selected attachment may be opened by its HTTPS URL.
                if (request.hasGesture() && request.url.scheme == "https" && request.url.host == service.host) {
                    try { startActivity(Intent(Intent.ACTION_VIEW, request.url)) } catch (_: Exception) { }
                }
                return true
            }
            override fun onPageFinished(view: WebView, url: String) {
                if (url != PAGE) return
                pageReady = true; sendConfiguration()
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) showUnavailable(if (assetSurface == "profile") "Le profil n’a pas pu s’ouvrir." else "La messagerie n’a pas pu s’ouvrir.")
            }
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
                val uri = request.url
                if (uri.scheme != "https") return denied()
                if (uri.host != "appassets.androidplatform.net") {
                    return if (!preview && service.scheme == "https" && uri.host == service.host && uri.port == service.port) null else denied()
                }
                if (request.method != "GET") return denied()
                if (uri.path.orEmpty().startsWith("/globe-vinyle/")) {
                    val name = uri.path.orEmpty().removePrefix("/globe-vinyle/")
                    val item = globeManifest.optJSONObject(name) ?: return denied()
                    if (!item.getString("mime").startsWith("image/")) return denied()
                    return try { WebResourceResponse(item.getString("mime"), null, assets.open("globe-vinyle/$name")) } catch (_: Exception) { denied() }
                }
                val name = uri.path.orEmpty().removePrefix("/").removePrefix("$assetSurface/")
                if (name.split('/').any { it == ".." || it == "." } || !manifest.has(name)) return denied()
                return try {
                    val item = manifest.getJSONObject(name)
                    val mime = item.getString("mime")
                    if (mime.startsWith("audio/") || mime.startsWith("video/"))
                        localMediaAsset(this@MessagingActivity, "$assetSurface/$name", mime, item.getLong("bytes"), request.requestHeaders["Range"])
                    else WebResourceResponse(mime, if (mime.startsWith("image/") || mime.startsWith("font/")) null else "utf-8", 200, "OK",
                        mapOf("Cache-Control" to "no-store", "X-Content-Type-Options" to "nosniff", "Content-Security-Policy" to csp()), assets.open("$assetSurface/$name"))
                } catch (_: Exception) { denied() }
            }
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (pageReady && started) web.evaluateJavascript("window.meewavMessaging?.back?.()", null) else finish()
            }
        })
        web.loadUrl(PAGE)
        val repository = (application as MeewavApplication).authRepository
        if (!preview && repository.configured) lifecycleScope.launch {
            repository.auth.sessionStatus.collect { status ->
                when (status) {
                    is SessionStatus.Authenticated -> {
                        val previous = profileId
                        profileId = status.session.user?.id; accessToken = status.session.accessToken
                        if (started && previous != profileId) finish()
                        else if (started) web.evaluateJavascript("window.meewavMessaging?.updateToken(${JSONObject.quote(accessToken)});", null)
                        else sendConfiguration()
                    }
                    is SessionStatus.NotAuthenticated -> {
                        accessToken = null
                        if (started) { web.evaluateJavascript("window.meewavMessaging?.updateToken(null);", null); finish() }
                        else showUnavailable("Connecte-toi à Meewav pour retrouver tes conversations.")
                    }
                    else -> Unit
                }
            }
        } else if (!preview) showUnavailable("Connecte-toi à Meewav pour retrouver tes conversations.")
    }

    private fun sendConfiguration() {
        if (!pageReady || started || (!preview && (accessToken == null || profileId == null))) return
        started = true
        val requestedRoute = intent.getStringExtra("route")?.takeIf { it.startsWith(defaultRoute.substringBefore('?')) } ?: defaultRoute
        // A live session must never silently fall back to a fixture inbox.
        val route = if (!preview && Uri.parse(requestedRoute).getQueryParameter("mode") == "demo") defaultRoute else requestedRoute
        val payload = JSONObject().put("preview", preview).put("url", if (preview) "" else BuildConfig.SUPABASE_URL)
            .put("key", if (preview) "" else BuildConfig.SUPABASE_PUBLISHABLE_KEY)
            .put("token", if (preview) JSONObject.NULL else accessToken).put("userId", if (preview) JSONObject.NULL else profileId)
            .put("route", route)
        // Evaluate only into the fixed, local document. No JavaScript interface,
        // refresh token, URL credential, log or WebView persistence is used.
        if (web.url == PAGE) web.evaluateJavascript("window.meewavMessaging.configure($payload);", null)
    }
    private fun csp(): String {
        val remote = if (!preview && service.scheme == "https" && !service.host.isNullOrBlank()) "https://${service.authority} wss://${service.authority}" else ""
        return "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: $remote; connect-src 'self' $remote; media-src 'self' blob: $remote; font-src 'self'; worker-src 'self' blob:; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'"
    }
    private fun denied() = WebResourceResponse("text/plain", "utf-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(byteArrayOf()))
    private suspend fun javascript(expression: String): String = suspendCancellableCoroutine { continuation ->
        web.evaluateJavascript(expression) { result -> if (continuation.isActive) continuation.resume(result ?: "null") }
    }
    private fun offerSave(id: String) {
        if (pendingSave != null || !Regex("[a-f0-9-]{36}").matches(id) || web.url != PAGE) return
        lifecycleScope.launch {
            try {
                val info = JSONObject(javascript("window.meewavDownloads.describe(${JSONObject.quote(id)})"))
                val size = info.getInt("size")
                if (size < 0 || size > 64 * 1024 * 1024) return@launch
                pendingSave = id to size
                savePicker.launch(Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).apply {
                    type = info.getString("mime").substringBefore(';')
                    putExtra(Intent.EXTRA_TITLE, info.getString("name"))
                })
            } catch (_: Exception) {
                pendingSave = null
                web.evaluateJavascript("window.meewavDownloads.complete(${JSONObject.quote(id)});", null)
                Toast.makeText(this@MessagingActivity, "Enregistrement indisponible.", Toast.LENGTH_SHORT).show()
            }
        }
    }
    private fun showUnavailable(message: String) {
        if (isFinishing) return
        val content = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; gravity = android.view.Gravity.CENTER; setPadding(40, 40, 40, 40); setBackgroundColor(Color.rgb(8, 8, 16)) }
        content.addView(TextView(this).apply { text = message; textSize = 17f; setTextColor(Color.WHITE); gravity = android.view.Gravity.CENTER })
        content.addView(Button(this).apply { text = "Retour au globe"; setOnClickListener { finish() } })
        container.addView(content, FrameLayout.LayoutParams(-1, -1))
    }
    private fun capturePermission(resource: String): String? = when (resource) {
        PermissionRequest.RESOURCE_AUDIO_CAPTURE -> Manifest.permission.RECORD_AUDIO
        PermissionRequest.RESOURCE_VIDEO_CAPTURE -> Manifest.permission.CAMERA
        else -> null
    }
    private fun suspendMedia() {
        if (::web.isInitialized) { web.evaluateJavascript("window.meewavMessaging?.setActive(false);", null); web.onPause() }
    }
    override fun onResume() { super.onResume(); stopped = false; resumed = true; if (::web.isInitialized) { web.onResume(); web.evaluateJavascript("window.meewavMessaging?.setActive(true);", null) } }
    override fun onPause() {
        resumed = false
        // Android's permission sheet pauses this Activity. Cancelling the JS
        // request here made the first microphone tap discard its own result.
        if (mediaPermissionRequest == null) suspendMedia()
        super.onPause()
    }
    override fun onStop() {
        stopped = true
        mediaPermissionRequest?.deny(); mediaPermissionRequest = null
        suspendMedia()
        super.onStop()
    }
    override fun onDestroy() {
        mediaPermissionRequest?.deny(); mediaPermissionRequest = null
        fileResult?.onReceiveValue(null); fileResult = null
        if (::web.isInitialized) { container.removeView(web); web.stopLoading(); web.destroy() }
        accessToken = null; super.onDestroy()
    }
    companion object {
        private const val ORIGIN = "https://appassets.androidplatform.net"
    }
}
