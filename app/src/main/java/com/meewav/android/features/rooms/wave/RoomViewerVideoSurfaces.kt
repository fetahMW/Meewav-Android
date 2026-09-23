package com.meewav.android.features.rooms.wave

import android.graphics.Color
import android.view.TextureView
import android.webkit.WebView
import android.widget.FrameLayout
import org.json.JSONObject
import kotlin.math.roundToInt

/** Native RTC canvases below the transparent web video tiles; web controls stay on top. */
internal class RoomViewerVideoSurfaces(private val web: WebView, private val parent: FrameLayout) : AutoCloseable {
    private val views = mutableMapOf<String, TextureView>()
    private var session: RoomsAudioSession? = null
    fun attach(value: RoomsAudioSession?) {
        views.forEach { (id, _) -> session?.bindRemoteVideo(id, null) }
        session = value
        views.forEach { (id, view) -> value?.bindRemoteVideo(id, view) }
    }
    fun update(data: JSONObject) {
        val viewport = data.optDouble("viewport", 0.0)
        if (!viewport.isFinite() || viewport <= 0 || web.width == 0) return
        val scale = web.width / viewport
        val tiles = data.optJSONArray("tiles") ?: return
        session?.setPlaybackGain(data.optDouble("volume", 0.0).takeIf { it.isFinite() }?.toFloat() ?: 0f)
        val visible = mutableSetOf<String>()
        for (index in 0 until minOf(tiles.length(), 12)) {
            val tile = tiles.optJSONObject(index) ?: continue
            val id = tile.optString("id")
            if (!id.matches(Regex("[a-fA-F0-9-]{36}"))) continue
            val x = tile.optDouble("x") * scale
            val y = tile.optDouble("y") * scale
            val w = tile.optDouble("width") * scale
            val h = tile.optDouble("height") * scale
            if (listOf(x,y,w,h).any { !it.isFinite() } || w <= 0 || h <= 0) continue
            visible.add(id)
            val view = views.getOrPut(id) {
                TextureView(web.context).also {
                    parent.addView(it, 0, FrameLayout.LayoutParams(1, 1))
                    session?.bindRemoteVideo(id, it)
                }
            }
            view.layoutParams = FrameLayout.LayoutParams(w.roundToInt(), h.roundToInt()).apply {
                leftMargin = web.left + x.roundToInt(); topMargin = web.top + y.roundToInt()
            }
        }
        (views.keys - visible).forEach { id ->
            session?.bindRemoteVideo(id, null)
            parent.removeView(views.remove(id))
        }
        web.setBackgroundColor(Color.TRANSPARENT)
    }
    override fun close() {
        attach(null)
        views.values.forEach(parent::removeView)
        views.clear()
    }
}
