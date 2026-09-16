package com.meewav.android.features.messaging

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.os.SystemClock
import android.webkit.WebResourceResponse
import java.io.File
import java.util.UUID
import org.json.JSONObject

/** AAC/M4A matches the deployed iOS messaging-voice contract. Files stay in cache. */
class NativeVoiceCapture(private val context: Context, private val event: (JSONObject) -> Unit) {
    private var recorder: MediaRecorder? = null
    private var activeId: String? = null
    private var output: File? = null
    private var startedAt = 0L
    private val completed = mutableMapOf<String, File>()

    fun start(id: String) {
        abort()
        val file = File(context.cacheDir, "meewav-voice-${UUID.randomUUID()}.m4a")
        output = file; activeId = id
        try {
            val capture = if (Build.VERSION.SDK_INT >= 31) MediaRecorder(context) else @Suppress("DEPRECATION") MediaRecorder()
            recorder = capture
            capture.setAudioSource(MediaRecorder.AudioSource.MIC)
            capture.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            capture.setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            capture.setAudioChannels(1); capture.setAudioSamplingRate(48_000); capture.setAudioEncodingBitRate(128_000)
            capture.setMaxDuration(899_500)
            // Keep AAC quality; stop before the shared Storage limit (10 MiB),
            // leaving room for MP4 finalization instead of creating an unsendable draft.
            capture.setMaxFileSize(10L * 1024 * 1024 - 256 * 1024)
            capture.setOutputFile(file.absolutePath)
            capture.setOnInfoListener { _, what, _ ->
                if (what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_DURATION_REACHED ||
                    what == MediaRecorder.MEDIA_RECORDER_INFO_MAX_FILESIZE_REACHED) stop(id)
            }
            capture.setOnErrorListener { _, _, _ -> abort(); reject(id, "L’enregistrement a été interrompu. Réessaie.") }
            capture.prepare(); capture.start(); startedAt = SystemClock.elapsedRealtime()
            emit(id, "started")
        } catch (_: Exception) { abort(); reject(id, "Impossible d’ouvrir le micro. Vérifie les autorisations et réessaie.") }
    }
    fun stop(id: String) {
        if (activeId != id) return
        val capture = recorder ?: return
        val file = output ?: return
        recorder = null; activeId = null; output = null
        try {
            val durationMs = SystemClock.elapsedRealtime() - startedAt
            capture.stop()
            if (file.length() !in 1..(10L * 1024 * 1024) || durationMs !in 600..900_000) error("invalid_voice")
            synchronized(completed) { completed[id] = file }
            event(JSONObject().put("id", id).put("phase", "ready").put("durationMs", durationMs)
                .put("url", "https://appassets.androidplatform.net/native/voice-file/$id.m4a"))
        } catch (_: Exception) { file.delete(); reject(id, "Le vocal est trop court ou a été interrompu. Réessaie.") }
        finally { capture.release() }
    }
    fun abort() {
        val capture = recorder; recorder = null; activeId = null
        try { capture?.stop() } catch (_: Exception) { }
        capture?.release(); output?.delete(); output = null
    }
    fun cancel(id: String) { if (activeId == id) abort() }
    fun reject(id: String, message: String) { event(JSONObject().put("id", id).put("phase", "error").put("message", message)) }
    private fun emit(id: String, phase: String) { event(JSONObject().put("id", id).put("phase", phase)) }
    fun response(id: String): WebResourceResponse? = synchronized(completed) {
        completed[id]?.takeIf { it.isFile }?.let { file ->
            WebResourceResponse("audio/mp4", null, 200, "OK", mapOf("Content-Length" to file.length().toString(), "Cache-Control" to "no-store"), file.inputStream())
        }
    }
    fun release(id: String) { synchronized(completed) { completed.remove(id)?.delete() } }
    fun destroy() { abort(); synchronized(completed) { completed.values.forEach { it.delete() }; completed.clear() } }
}
