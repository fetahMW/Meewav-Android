package com.meewav.android.features.rooms.wave

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.withTimeout

/** Keeps the authorized live capture eligible while the host selects an audio file. */
class RoomsLiveMediaService : Service() {
    companion object {
        private const val CHANNEL = "rooms_live_media"
        private const val STOP = "com.meewav.android.STOP_LIVE_MEDIA"
        private class Request(val camera: Boolean, val stop: () -> Unit) {
            val ready = CompletableDeferred<Unit>()
        }
        // Accessed only on Main. RoomsAudioSession permits one engine owner.
        private var request: Request? = null
        internal suspend fun start(context: Context, camera: Boolean, onStop: () -> Unit) {
            check(request == null) { "Une diffusion est déjà active" }
            val next = Request(camera, onStop)
            request = next
            try {
                context.startForegroundService(Intent(context, RoomsLiveMediaService::class.java))
                withTimeout(5000) { next.ready.await() }
            } catch (failure: Throwable) {
                if (request === next) stop(context)
                throw failure
            }
        }
        internal fun stop(context: Context) {
            request = null
            context.stopService(Intent(context, RoomsLiveMediaService::class.java))
        }
    }
    override fun onBind(intent: Intent?): IBinder? = null
    private var activeRequest: Request? = null
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val current = request
        if (current == null) { stopSelf(); return START_NOT_STICKY }
        activeRequest = current
        if (intent?.action == STOP) { current.stop(); return START_NOT_STICKY }
        try {
            getSystemService(NotificationManager::class.java).createNotificationChannel(
                NotificationChannel(CHANNEL, "Diffusion live", NotificationManager.IMPORTANCE_LOW))
            val stopIntent = PendingIntent.getService(this, 7302,
                Intent(this, RoomsLiveMediaService::class.java).setAction(STOP),
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
            val notification = Notification.Builder(this, CHANNEL)
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentTitle("Live MeeWav en cours")
                .setContentText("Le live continue pendant la sélection du fichier.")
                .setOngoing(true).setOnlyAlertOnce(true)
                .addAction(Notification.Action.Builder(null, "Arrêter le live", stopIntent).build()).build()
            if (Build.VERSION.SDK_INT >= 30) {
                val types = ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK or
                    (if (current.camera) ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA else 0)
                startForeground(7302, notification, types)
            } else startForeground(7302, notification)
            current.ready.complete(Unit)
        } catch (failure: Exception) {
            current.ready.completeExceptionally(failure)
            stopSelf()
        }
        return START_NOT_STICKY
    }
    override fun onTaskRemoved(rootIntent: Intent?) { request?.stop(); stopSelf() }
    override fun onDestroy() {
        val previous = request?.takeIf { it === activeRequest }
        if (previous != null) request = null
        previous?.ready?.cancel()
        previous?.stop?.invoke()
        super.onDestroy()
    }
}
