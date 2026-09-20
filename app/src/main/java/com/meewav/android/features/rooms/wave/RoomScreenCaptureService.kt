package com.meewav.android.features.rooms.wave

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

/** Local screen preview. Never claims to publish a track: native room RTC is not connected yet. */
class RoomScreenCaptureService : Service() {
    companion object {
        private val activeState = MutableStateFlow(false)
        private val frameState = MutableStateFlow<Bitmap?>(null)
        private val failureState = MutableStateFlow<String?>(null)
        val active = activeState.asStateFlow()
        val frame = frameState.asStateFlow()
        val failure = failureState.asStateFlow()
        fun clearFailure() { failureState.value = null }
    }
    private var projection: MediaProjection? = null
    private var display: VirtualDisplay? = null
    private var reader: ImageReader? = null
    private val worker = HandlerThread("room-screen-preview").apply { start() }
    private val handler = Handler(worker.looper)
    private var lastFrame = 0L
    private val callback = object : MediaProjection.Callback() {
        override fun onStop() { stopSelf() }
        override fun onCapturedContentResize(width: Int, height: Int) {
            if (width > 0 && height > 0 && display != null) handler.post { resize(width, height) }
        }
    }
    override fun onBind(intent: Intent?) = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "stop") { stopSelf(); return START_NOT_STICKY }
        if (projection != null) return START_NOT_STICKY
        val data = if (Build.VERSION.SDK_INT >= 33) intent?.getParcelableExtra("captureData", Intent::class.java)
            else @Suppress("DEPRECATION") (intent?.getParcelableExtra("captureData") as? Intent)
        val result = intent?.getIntExtra("resultCode", Activity.RESULT_CANCELED) ?: Activity.RESULT_CANCELED
        if (result != Activity.RESULT_OK || data == null) { stopSelf(); return START_NOT_STICKY }
        try {
            val notifications = getSystemService(NotificationManager::class.java)
            notifications.createNotificationChannel(NotificationChannel("room-screen", "Capture d’écran de la room", NotificationManager.IMPORTANCE_LOW))
            val stop = PendingIntent.getService(this, 1, Intent(this, javaClass).setAction("stop"), PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
            val notification = Notification.Builder(this, "room-screen")
                .setSmallIcon(android.R.drawable.ic_menu_view).setContentTitle("Aperçu d’écran actif")
                .setContentText("Capture locale Meewav · toucher Arrêter pour terminer")
                .setOngoing(true).addAction(Notification.Action.Builder(null, "Arrêter", stop).build()).build()
            if (Build.VERSION.SDK_INT >= 29) startForeground(7301, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION)
            else startForeground(7301, notification)
            val capture = requireNotNull(getSystemService(MediaProjectionManager::class.java).getMediaProjection(result, data))
            projection = capture
            capture.registerCallback(callback, handler)
            val metrics = resources.displayMetrics
            val size = previewSize(metrics.widthPixels, metrics.heightPixels)
            reader = makeReader(size.first, size.second)
            display = capture.createVirtualDisplay("Meewav screen preview", size.first, size.second, metrics.densityDpi,
                DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR, reader!!.surface, null, handler)
            activeState.value = true
        } catch (_: Exception) {
            failureState.value = "La capture d’écran n’a pas pu démarrer. Réessaie depuis la barre vidéo."
            stopSelf()
        }
        return START_NOT_STICKY
    }
    private fun previewSize(width: Int, height: Int): Pair<Int, Int> {
        val ratio = minOf(1f, 720f / maxOf(width, height))
        return (width * ratio).toInt().coerceAtLeast(1) to (height * ratio).toInt().coerceAtLeast(1)
    }
    private fun makeReader(width: Int, height: Int): ImageReader = ImageReader.newInstance(width, height, PixelFormat.RGBA_8888, 2).apply {
        setOnImageAvailableListener({ source ->
            val image = runCatching { source.acquireLatestImage() }.getOrNull() ?: return@setOnImageAvailableListener
            image.use {
                val now = SystemClock.elapsedRealtime()
                if (now - lastFrame < 200) return@setOnImageAvailableListener
                lastFrame = now
                val plane = it.planes[0]
                val paddedWidth = plane.rowStride / plane.pixelStride
                val padded = Bitmap.createBitmap(paddedWidth, it.height, Bitmap.Config.ARGB_8888)
                padded.copyPixelsFromBuffer(plane.buffer)
                val cropped = Bitmap.createBitmap(padded, 0, 0, it.width, it.height)
                if (cropped !== padded) padded.recycle()
                frameState.value = cropped
            }
        }, handler)
    }
    private fun resize(width: Int, height: Int) {
        val output = display ?: return
        val size = previewSize(width, height)
        if (reader?.width == size.first && reader?.height == size.second) return
        val previous = reader
        val next = makeReader(size.first, size.second)
        reader = next
        output.resize(size.first, size.second, resources.displayMetrics.densityDpi)
        output.surface = next.surface
        previous?.close()
    }
    override fun onDestroy() {
        activeState.value = false
        // Serialize cleanup after pending frames/resizes. No resources survive leaving the room.
        handler.post {
            display?.release(); display = null
            reader?.close(); reader = null
            projection?.unregisterCallback(callback); projection?.stop(); projection = null
            frameState.value = null
            worker.quitSafely()
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
        super.onDestroy()
    }
}
