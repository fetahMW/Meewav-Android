package com.meewav.android.core.navigation

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.SharedPreferences
import android.webkit.WebResourceRequest
import android.webkit.WebView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import org.json.JSONObject

interface NavigationDockOwner {
    fun onNavigationDockAvailabilityChanged(available: Boolean)
}

/** Uses the existing local URL bridge; no JavaScript interface or remote URL. */
object NativeNavigationDock {
    private const val KEY = "navigation_owner"
    private const val ORIGIN = "appassets.androidplatform.net"
    private const val PATH = "/native/navigation-mode"
    private fun preferences(context: Context) =
        context.applicationContext.getSharedPreferences("navigation_dock", Context.MODE_PRIVATE)

    fun mode(context: Context): NavigationDockMode =
        NavigationDockMode.fromWire(preferences(context).getString(KEY, null)) ?: NavigationDockMode.APP

    fun observe(context: Context, changed: () -> Unit): () -> Unit {
        val prefs = preferences(context)
        val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, key -> if (key == KEY) changed() }
        prefs.registerOnSharedPreferenceChangeListener(listener)
        return { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
    }

    fun apply(activity: Activity, dockAvailable: Boolean, immersiveStatus: Boolean) {
        val policy = navigationBarsPolicy(mode(activity), dockAvailable, immersiveStatus)
        WindowCompat.getInsetsController(activity.window, activity.window.decorView).apply {
            systemBarsBehavior = if (policy.showNavigation) WindowInsetsControllerCompat.BEHAVIOR_DEFAULT
                else WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            if (policy.showStatus) show(WindowInsetsCompat.Type.statusBars()) else hide(WindowInsetsCompat.Type.statusBars())
            if (policy.showNavigation) show(WindowInsetsCompat.Type.navigationBars()) else hide(WindowInsetsCompat.Type.navigationBars())
        }
        ViewCompat.requestApplyInsets(activity.window.decorView)
    }

    fun javascript(context: Context, request: Long = 0): String {
        val payload = JSONObject().put("mode", mode(context).wire).put("request", request)
        return "window.__meewavNavigationMode=${JSONObject.quote(mode(context).wire)};" +
            "window.dispatchEvent(new CustomEvent('meewav:navigation-mode',{detail:$payload}));"
    }

    fun html(context: Context, source: String): ByteArray {
        val head = Regex("<head(?:\\s[^>]*)?>", RegexOption.IGNORE_CASE).find(source)
            ?: error("Bundled globe HTML must contain its head element")
        val meta = "<meta name=\"meewav-navigation-mode\" content=\"${mode(context).wire}\">"
        return (source.substring(0, head.range.last + 1) + meta + source.substring(head.range.last + 1))
            .toByteArray(Charsets.UTF_8)
    }

    private fun owner(context: Context): NavigationDockOwner? {
        var current = context
        while (current is ContextWrapper) {
            if (current is NavigationDockOwner) return current
            val next = current.baseContext
            if (next === current) break
            current = next
        }
        return current as? NavigationDockOwner
    }

    fun consume(context: Context, view: WebView, request: WebResourceRequest, localPagePath: String): Boolean {
        val uri = request.url
        if (uri.path != PATH) return false
        val document = android.net.Uri.parse(view.url.orEmpty())
        if (!request.isForMainFrame || request.method != "GET" || uri.scheme != "https" || uri.host != ORIGIN
            || uri.port != -1 || uri.userInfo != null || uri.encodedFragment != null
            || document.scheme != "https" || document.host != ORIGIN || document.port != -1
            || document.userInfo != null || document.path != localPagePath) return true
        val id = uri.getQueryParameter("request")?.toLongOrNull()?.takeIf { it in 1..9_007_199_254_740_991L }
        val value = uri.getQueryParameter("value")
        val requestedMode = NavigationDockMode.fromWire(value)
        val dock = uri.getQueryParameter("dock")
        val available = when (dock) { "1" -> true; "0" -> false; else -> null }
        val fieldsValid = uri.queryParameterNames.all { it in setOf("value", "dock", "request") }
            && uri.queryParameterNames.all { uri.getQueryParameters(it).size == 1 }
            && id != null && (value == null || requestedMode != null) && (dock == null || available != null)
            && (requestedMode != null || available != null)
        val receiver = owner(context)
        if (fieldsValid && receiver != null) {
            // Only the explicit chevron action contains value. Mount/unmount
            // announces dock availability without overwriting a newer choice.
            if (requestedMode != null) preferences(context).edit().putString(KEY, requestedMode.wire).apply()
            if (available != null) receiver.onNavigationDockAvailabilityChanged(available)
        }
        view.evaluateJavascript(javascript(context, id ?: 0), null)
        return true
    }
}
