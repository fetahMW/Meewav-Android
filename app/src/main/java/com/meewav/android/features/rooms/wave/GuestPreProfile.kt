package com.meewav.android.features.rooms.wave

import android.annotation.SuppressLint
import android.net.Uri
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.meewav.android.features.auth.fullGlobeAsset
import org.json.JSONObject

/** Hosts the actual Globe/Vinyl card, sharing its assets, media and grade renderer. */
@SuppressLint("SetJavaScriptEnabled")
@Composable
internal fun GuestPreProfile(state: WaveGuestState, guest: WaveGuest) {
    Dialog(onDismissRequest = { state.profilePreviewId = null }, properties = DialogProperties()) {
        AndroidView(modifier = Modifier.fillMaxWidth().fillMaxHeight(.88f).heightIn(max = 640.dp),
            factory = { context ->
                val manifest = JSONObject(context.assets.open("globe-vinyle/asset-manifest.json").bufferedReader().use { it.readText() })
                WebView(context).apply {
                    setBackgroundColor(android.graphics.Color.TRANSPARENT)
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.allowFileAccess = false
                    settings.allowContentAccess = false
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView, url: String) {
                            if (url != "https://appassets.androidplatform.net/globe-vinyle/guest-preprofile.html") return
                            val payload = JSONObject().put("id", guest.id).put("name", guest.name).put("grade", guest.gradeLevel)
                            view.evaluateJavascript("window.dispatchEvent(new CustomEvent('meewav:guest-profile',{detail:$payload}))", null)
                        }
                        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                            if (request.isForMainFrame && request.url.host == "appassets.androidplatform.net") {
                                if (request.url.path == "/native/contact") {
                                    state.profilePreviewId = null
                                    state.messageRecipientIds = setOf(guest.id)
                                } else if (request.url.path == "/native/close") state.profilePreviewId = null
                            }
                            return true
                        }
                        override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                            if (request.url.scheme == "https" && request.url.host == "appassets.androidplatform.net" && request.url.path == "/guest-portrait") {
                                return WebResourceResponse("image/png", null, context.resources.openRawResource(guest.portrait))
                            }
                            return fullGlobeAsset(context, request, manifest)
                        }
                    }
                    loadUrl("https://appassets.androidplatform.net/globe-vinyle/guest-preprofile.html")
                }
            }, onRelease = { it.stopLoading(); it.destroy() })
    }
}
