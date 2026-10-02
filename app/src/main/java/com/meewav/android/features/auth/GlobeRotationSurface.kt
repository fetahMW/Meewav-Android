package com.meewav.android.features.auth

import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.ViewTreeObserver
import android.webkit.WebView
import com.meewav.android.BuildConfig

/** Keep Android's last complete window buffer until WebView has a frame for
 * the new axes. Layout and WebGL keep running; only the premature native draw
 * is held. No bitmap copy, extra renderer or sensor loop is needed. */
internal class GlobeRotationSurface(private val web: WebView) : AutoCloseable {
    private val handler = Handler(Looper.getMainLooper())
    private var generation = 0L
    private var holding = false
    private var rotation = 0
    private var started = 0L
    private var observer: ViewTreeObserver? = null
    private val beforeDraw = ViewTreeObserver.OnPreDrawListener { !holding }
    private var probe: Runnable? = null
    private val timeout = Runnable { release(generation, "timeout") }

    fun prepare(displayRotation: Int) {
        generation++
        rotation = displayRotation
        started = SystemClock.uptimeMillis()
        holding = true
        if (observer == null) {
            observer = web.viewTreeObserver.also { it.addOnPreDrawListener(beforeDraw) }
        }
        handler.removeCallbacks(timeout)
        probe?.let(handler::removeCallbacks)
        // A lost renderer must never prevent navigation or backgrounding.
        handler.postDelayed(timeout, 650L)
        val request = generation
        probe = Runnable { awaitFrame(request) }.also { handler.post(it) }
    }

    private fun awaitFrame(request: Long) {
        if (!holding || request != generation) return
        // The engine commits these values only after the complete WebGL draw.
        web.evaluateJavascript("""
            (() => {
              const c = document.querySelector('.globe-stage canvas');
              const native = window.meewavNativeGlobeStatus?.();
              const nativeReady = !native || (!native.error
                && native.presented >= Number(c?.dataset.nativeGlobeFrame || 1)
                && native.appliedLayout >= native.layout);
              return !!c && c.dataset.globeDisplayRotation === '$rotation'
                && c.clientWidth === c.parentElement.clientWidth
                && c.clientHeight === c.parentElement.clientHeight && nativeReady;
            })()
        """.trimIndent()) { ready ->
            if (!holding || request != generation) return@evaluateJavascript
            if (ready == "true") {
                // A DOM callback alone is not enough: wait for Chromium's
                // compositor to make that WebGL frame available to onDraw.
                web.postVisualStateCallback(request, object : WebView.VisualStateCallback() {
                    override fun onComplete(requestId: Long) = release(requestId, "ready")
                })
            } else {
                probe = Runnable { awaitFrame(request) }.also { handler.postDelayed(it, 16L) }
            }
        }
    }

    private fun release(request: Long, reason: String) {
        if (!holding || request != generation) return
        if (BuildConfig.DEBUG) Log.d("GlobeRotationSurface",
            "$rotation $reason ${SystemClock.uptimeMillis() - started}ms")
        holding = false
        handler.removeCallbacks(timeout)
        probe?.let(handler::removeCallbacks)
        probe = null
        observer?.takeIf { it.isAlive }?.removeOnPreDrawListener(beforeDraw)
        observer = null
        web.postInvalidateOnAnimation()
    }

    override fun close() {
        release(generation, "inactive")
        generation++
    }
}
