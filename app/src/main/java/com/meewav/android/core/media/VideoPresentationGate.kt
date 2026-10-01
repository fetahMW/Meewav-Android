package com.meewav.android.core.media

/** Retains the user's play/pause intent while presentation is temporarily hidden. */
internal class VideoPresentationGate(private val play: () -> Unit, private val pause: () -> Unit) {
    private var active = false
    private var requested = false
    private var closed = false

    fun requestPlay() {
        if (closed) return
        requested = true
        if (active) play()
    }

    fun requestPause() {
        if (closed) return
        requested = false
        pause()
    }

    /** Readiness must not overwrite a pause made while the file was loading. */
    fun prepared() { if (!closed && active && requested) play() }

    fun setActive(value: Boolean) {
        if (closed || active == value) return
        active = value
        if (!value) pause() else if (requested) play()
    }

    fun reset() { requested = false }
    fun close() { requested = false; active = false; closed = true }
}
