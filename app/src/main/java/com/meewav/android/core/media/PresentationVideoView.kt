package com.meewav.android.core.media

import android.content.Context
import android.view.View
import android.widget.VideoView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver

/** Stops hidden video decoding, including preparation completing after ON_PAUSE. */
internal class PresentationVideoView(context: Context, private val lifecycle: Lifecycle) : VideoView(context) {
    // A platform View constructor can invoke visibility callbacks before initialization.
    private var gate: VideoPresentationGate? = null
    private var released = false
    private val observer = LifecycleEventObserver { _, _ -> updatePresentation() }
    var presentationEnabled = true
        set(value) { field = value; updatePresentation() }

    init { gate = VideoPresentationGate({ super.start() }, { super.pause() }) }

    private fun updatePresentation() {
        gate?.setActive(!released && presentationEnabled && isAttachedToWindow && isShown &&
            windowVisibility == View.VISIBLE && lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED))
    }

    override fun start() {
        val controller = gate
        if (controller == null) super.start() else controller.requestPlay()
    }

    override fun pause() {
        val controller = gate
        if (controller == null) super.pause() else controller.requestPause()
    }

    override fun stopPlayback() { gate?.reset(); super.stopPlayback() }

    fun onMediaPrepared() { updatePresentation(); gate?.prepared() }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (!released) lifecycle.addObserver(observer)
        updatePresentation()
    }

    override fun onDetachedFromWindow() {
        gate?.setActive(false)
        lifecycle.removeObserver(observer)
        super.onDetachedFromWindow()
    }

    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        updatePresentation()
    }

    override fun onVisibilityAggregated(isVisible: Boolean) {
        super.onVisibilityAggregated(isVisible)
        updatePresentation()
    }

    fun release() {
        released = true
        lifecycle.removeObserver(observer)
        gate?.close()
        setOnPreparedListener(null)
        setOnErrorListener(null)
        super.stopPlayback()
    }
}
