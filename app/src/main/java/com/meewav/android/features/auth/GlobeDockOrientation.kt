package com.meewav.android.features.auth

import android.content.Context
import android.hardware.display.DisplayManager
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.view.View
import android.webkit.WebView
import kotlin.math.abs
import kotlin.math.round

/** Only a confirmed Android display turn rotates the dock and scene. Handheld
 * gravity/tilt never drives graphics; the geographic camera stays unchanged. */
internal class GlobeDockOrientation(
    private val web: WebView,
    private val onDisplayRotation: (Int) -> Unit,
    private val onTurningChanged: (Boolean) -> Unit,
) : DisplayManager.DisplayListener, AutoCloseable {
    private val displays = web.context.getSystemService(Context.DISPLAY_SERVICE) as DisplayManager
    private val turn = GlobeOrientationTurn()
    private val surface = GlobeRotationSurface(web)
    private val handler = Handler(Looper.getMainLooper())
    private var active = false
    private var lastRotation = -1
    private var lastRoll: Double? = null
    private var lastSentAt = 0L
    private var lastTurning: Boolean? = null
    private var settleDeadline = 0L
    private val settle = Runnable {
        settleDeadline = 0L
        if (active) {
            val now = SystemClock.elapsedRealtimeNanos()
            if (turn.finish(now)) publish(now, force = true)
            else scheduleSettlement(now)
        }
    }
    private val layoutListener = View.OnLayoutChangeListener { _, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom ->
        if (active && (left != oldLeft || top != oldTop || right != oldRight || bottom != oldBottom))
            publish(SystemClock.elapsedRealtimeNanos(), force = true)
    }

    fun setActive(value: Boolean) {
        if (active == value) return
        active = value
        if (value) {
            turn.reset(rotation())
            lastRotation = -1
            lastTurning = null
            lastSentAt = 0L
            displays.registerDisplayListener(this, handler)
            web.addOnLayoutChangeListener(layoutListener)
            publish(SystemClock.elapsedRealtimeNanos())
        } else {
            surface.close()
            displays.unregisterDisplayListener(this)
            web.removeOnLayoutChangeListener(layoutListener)
            handler.removeCallbacks(settle)
            settleDeadline = 0L
            onTurningChanged(false)
        }
    }

    override fun onDisplayAdded(displayId: Int) = Unit
    override fun onDisplayRemoved(displayId: Int) = Unit
    override fun onDisplayChanged(displayId: Int) {
        if (active && web.display?.displayId == displayId)
            publish(SystemClock.elapsedRealtimeNanos())
    }

    private fun rotation() = (web.display?.rotation ?: 0) * 90

    private fun publish(now: Long, force: Boolean = false) {
        val rotation = rotation()
        turn.update(rotation, now)
        val value = turn.value
        val changedRotation = rotation != lastRotation
        val changedTurning = turn.turning != lastTurning
        if (changedRotation && lastRotation != -1) surface.prepare(rotation)
        scheduleSettlement(now)
        if (!force && !changedRotation && !changedTurning) {
            if (now - lastSentAt < 30_000_000L) return
            if (lastRoll != null && abs(value - lastRoll!!) < .15
                && !(value % 90 == 0.0 && value != lastRoll)) return
        }
        if (changedTurning) onTurningChanged(turn.turning)
        if (changedRotation) onDisplayRotation(rotation)
        lastTurning = turn.turning
        lastRotation = rotation
        lastRoll = value
        lastSentAt = now
        // Locale-independent numeric values only; never interpolate page data.
        val angle = (round(value * 100) / 100).toString()
        web.evaluateJavascript("window.meewavGlobeDock?.update($angle,$rotation,${turn.turning});", null)
    }

    private fun scheduleSettlement(now: Long) {
        val deadline = turn.deadline
        if (deadline == settleDeadline) return
        handler.removeCallbacks(settle)
        settleDeadline = deadline
        if (deadline != 0L)
            handler.postDelayed(settle, ((deadline - now + 999_999L) / 1_000_000L).coerceAtLeast(1L))
    }

    override fun close() = setActive(false)
}

/** A bounded transition starts only when Android changes display quadrant.
 * Neither continued hand motion nor layout callbacks can prolong it. */
internal class GlobeOrientationTurn {
    var value = 0.0
        private set
    var turning = false
        private set
    private var rotation = 0
    private var transitionUntil = 0L
    val deadline: Long get() = if (turning) transitionUntil else 0L

    fun reset(displayRotation: Int) {
        val normalized = normalize(displayRotation) ?: return
        rotation = normalized
        value = nearest(-rotation.toDouble(), value)
        turning = false; transitionUntil = 0L
    }

    fun update(displayRotation: Int, now: Long) {
        val normalized = normalize(displayRotation) ?: return
        if (normalized == rotation) return
        rotation = normalized
        value = nearest(-rotation.toDouble(), value)
        turning = true
        transitionUntil = now + 300_000_000L
    }

    fun finish(now: Long): Boolean {
        if (!turning || now < deadline) return false
        value = nearest(-rotation.toDouble(), value)
        turning = false
        transitionUntil = 0L
        return true
    }

    private fun nearest(angle: Double, previous: Double): Double =
        previous + ((angle - previous) % 360 + 540) % 360 - 180
    private fun normalize(displayRotation: Int): Int? =
        if (displayRotation % 90 == 0) ((displayRotation % 360) + 360) % 360 else null
}
