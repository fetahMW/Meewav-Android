package com.meewav.android.features.rooms.wave

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.ensureActive
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream
import kotlin.coroutines.coroutineContext
import kotlin.math.min

internal data class WaveExportStem(val clip: WaveCompositionClip, val pcm: WavePcm, val placements: List<Pair<Long, Long>>)

/** Offline rendering reads immutable snapshots; never moves either live player's transport. */
internal object WaveArrangementExport {
    suspend fun render(output: OutputStream, frames: Int, stems: List<WaveExportStem>, onProgress: suspend (Float) -> Unit) {
        val header = ByteBuffer.allocate(44).order(ByteOrder.LITTLE_ENDIAN)
        header.put("RIFF".toByteArray()).putInt(36 + frames * 4).put("WAVEfmt ".toByteArray())
        header.putInt(16).putShort(1).putShort(2).putInt(48000).putInt(192000).putShort(4).putShort(16)
        header.put("data".toByteArray()).putInt(frames * 4); output.write(header.array())
        val anySolo = stems.any { it.clip.solo }
        val buffer = ByteBuffer.allocate(4096 * 4).order(ByteOrder.LITTLE_ENDIAN)
        for (start in 0 until frames step 4096) {
            coroutineContext.ensureActive(); buffer.clear()
            for (frame in start until min(frames, start + 4096)) {
                var left = 0f; var right = 0f
                for (stem in stems) {
                    val clip = stem.clip
                    if (clip.mute || (anySolo && !clip.solo && !clip.isBase)) continue
                    val placement = stem.placements.firstOrNull { frame >= it.first && frame < it.second }
                    if (stem.placements.isNotEmpty() && placement == null) continue
                    if (clip.isBase && frame >= stem.pcm.frames) continue
                    if (placement == null && clip.repeats > 0 && frame >= stem.pcm.frames.toLong() * clip.repeats) continue
                    val local = ((placement?.let { frame - it.first } ?: frame.toLong()) % stem.pcm.frames).toInt()
                    val edge = placement?.let { min(1f, min((frame - it.first) / 240f, (it.second - frame) / 240f)) } ?: 1f
                    left += stem.pcm.samples.get(local * 2) * clip.gain * edge
                    right += stem.pcm.samples.get(local * 2 + 1) * clip.gain * edge
                }
                buffer.putShort((left.coerceIn(-.98f, .98f) * 32767).toInt().toShort())
                buffer.putShort((right.coerceIn(-.98f, .98f) * 32767).toInt().toShort())
            }
            output.write(buffer.array(), 0, buffer.position()); onProgress(min(frames, start + 4096).toFloat() / frames)
        }
    }
    suspend fun archive(output: OutputStream, frames: Int, stems: List<WaveExportStem>, bpm: Double, key: String, onProgress: suspend (Float) -> Unit) {
        ZipOutputStream(output).use { zip ->
            val manifest = JSONObject().put("format", "meewav-wave-daw-v1").put("bpm", bpm).put("key", key)
            val credits = JSONArray()
            stems.forEachIndexed { index, stem ->
                val file = "${index + 1}-${stem.clip.id.replace(Regex("[^a-zA-Z0-9-]"), "_")}.wav"
                credits.put(JSONObject().put("id", stem.clip.id).put("title", stem.clip.title).put("artist", stem.clip.artist).put("file", file).put("category", stem.clip.category))
                zip.putNextEntry(ZipEntry(file))
                render(zip, frames, listOf(stem)) { onProgress((index + it) / stems.size) }; zip.closeEntry()
            }
            zip.putNextEntry(ZipEntry("meewav-credits.json")); zip.write(manifest.put("credits", credits).toString(2).toByteArray()); zip.closeEntry()
        }
    }
    suspend fun copy(context: Context, source: String, output: Uri) {
        val input = if (source.startsWith("asset:")) context.assets.open(source.removePrefix("asset:"))
            else context.contentResolver.openInputStream(Uri.parse(source)) ?: error("Source indisponible")
        input.use { from -> context.contentResolver.openOutputStream(output, "wt")!!.use { to ->
            val block = ByteArray(65536)
            while (true) { coroutineContext.ensureActive(); val n = from.read(block); if (n < 0) break; to.write(block, 0, n) }
        } }
    }
}
