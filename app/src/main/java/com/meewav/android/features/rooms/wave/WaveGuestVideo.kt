package com.meewav.android.features.rooms.wave

import android.content.Context
import android.graphics.Matrix
import android.graphics.SurfaceTexture
import android.media.MediaPlayer
import android.view.Surface
import android.view.TextureView
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

// Original local clips used by the Rooms home fixtures, alternating Short and desktop.
internal fun waveGuestDemoVideo(id: String): String {
    val clips = listOf("portrait-vocal-session", "landscape-guitar", "portrait-studio-rap",
        "landscape-dj", "portrait-producer", "landscape-roundtable")
    val index = when (id) { "naya" -> 0; "keo" -> 1; "solen" -> 2; "azur" -> 3
        else -> (id.hashCode() and Int.MAX_VALUE) % clips.size }
    return "rooms/media/shorts-demo/${clips[index]}.mp4"
}

@Composable
internal fun WaveGuestVideo(guest: WaveGuest, modifier: Modifier, volume: Float = 0f) {
    AndroidView(modifier = modifier, factory = { GuestVideoView(it, guest.demoVideo) },
        update = { it.setGain(volume) },
        onRelease = { it.releasePlayer() })
}

private class GuestVideoView(context: Context, private val asset: String) : TextureView(context), TextureView.SurfaceTextureListener {
    private var player: MediaPlayer? = null
    private var prepared = false
    private var gain = 0f
    fun setGain(value: Float) { gain = value.coerceIn(0f, 1f); if (prepared) player?.setVolume(gain, gain) }
    private var videoWidth = 0
    private var videoHeight = 0
    init { surfaceTextureListener = this; isOpaque = false }

    override fun onSurfaceTextureAvailable(texture: SurfaceTexture, width: Int, height: Int) {
        val media = MediaPlayer()
        player = media
        try {
            context.assets.openFd(asset).use { media.setDataSource(it.fileDescriptor, it.startOffset, it.length) }
            val surface = Surface(texture)
            media.setSurface(surface)
            surface.release()
            media.setVolume(0f, 0f)
            media.isLooping = true
            media.setOnVideoSizeChangedListener { _, w, h -> videoWidth = w; videoHeight = h; fitVideo() }
            media.setOnPreparedListener {
                prepared = true
                it.setVolume(gain, gain)
                if (windowVisibility == View.VISIBLE) it.start()
            }
            media.setOnErrorListener { _, _, _ -> releasePlayer(); true }
            media.prepareAsync()
        } catch (_: Exception) { releasePlayer() }
    }

    private fun fitVideo() {
        if (width == 0 || height == 0 || videoWidth == 0 || videoHeight == 0) return
        val scale = minOf(width.toFloat() / videoWidth, height.toFloat() / videoHeight)
        setTransform(Matrix().apply {
            setScale(videoWidth * scale / width, videoHeight * scale / height, width / 2f, height / 2f)
        })
    }
    override fun onSurfaceTextureSizeChanged(surface: SurfaceTexture, width: Int, height: Int) = fitVideo()
    override fun onSurfaceTextureUpdated(surface: SurfaceTexture) = Unit
    override fun onSurfaceTextureDestroyed(surface: SurfaceTexture): Boolean { releasePlayer(); return true }
    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (prepared) { if (visibility == View.VISIBLE) player?.start() else player?.pause() }
    }
    fun releasePlayer() { prepared = false; player?.release(); player = null }
}
