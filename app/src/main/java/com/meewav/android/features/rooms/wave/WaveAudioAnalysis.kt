package com.meewav.android.features.rooms.wave

import android.content.Context
import android.media.MediaCodec
import android.media.MediaExtractor
import android.media.MediaFormat
import android.net.Uri
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.CancellationException
import kotlin.coroutines.coroutineContext
import android.os.SystemClock
import java.nio.ByteOrder
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sqrt

/* ------------------------------------------------------------------------- */
/* Port Android de MWAudioAnalysisService (iOS) :                              */
/*  - decode le fichier audio en PCM frame par frame (MediaExtractor+Codec)    */
/*  - buckets minPeak / maxPeak / RMS par frame, normalisés par le pic global  */
/*  - rms compressée pow(0.72), plancher 0.015 — comme iOS                     */
/* Rendu par MWDetailedAudioWaveform -> DeckMainLane (traits très fins).       */
/* ------------------------------------------------------------------------- */

data class WaveformSample(
    val minPeak: Float,
    val maxPeak: Float,
    val rms: Float,
) {
    companion object { val Silence = WaveformSample(0f, 0f, 0f) }
}

object WaveAudioAnalysis {

    /* Analyse synchrone — à appeler hors thread UI (Dispatchers.IO). */
    suspend fun analyze(context: Context, uri: Uri, targetCount: Int = 2048,
        onDuration: suspend (Long) -> Unit = {},
        onMusicalResult: suspend (String) -> Unit = {},
        onProgress: suspend (List<WaveformSample>) -> Unit = {}): List<WaveformSample> {
        val extractor = MediaExtractor()
        var codec: MediaCodec? = null
        var musical: MusicalTrackAnalyzer? = null
        try {
            extractor.setDataSource(context, uri, null)
            var format: MediaFormat? = null
            for (i in 0 until extractor.trackCount) {
                val f = extractor.getTrackFormat(i)
                val mime = f.getString(MediaFormat.KEY_MIME) ?: continue
                if (mime.startsWith("audio/")) { format = f; extractor.selectTrack(i); break }
            }
            if (format == null) return emptyList()

            val mime = format.getString(MediaFormat.KEY_MIME)!!
            val sampleRate = format.getInteger(MediaFormat.KEY_SAMPLE_RATE)
            var channels = if (format.containsKey(MediaFormat.KEY_CHANNEL_COUNT))
                format.getInteger(MediaFormat.KEY_CHANNEL_COUNT) else 1
            val durationUs = if (format.containsKey(MediaFormat.KEY_DURATION))
                format.getLong(MediaFormat.KEY_DURATION) else 0L

            onDuration(durationUs / 1000)

            // buckets iOS : max(512, target) répartis sur la durée totale.
            val totalFrames = max(1L, durationUs * sampleRate / 1_000_000L)
            val bucketCount = max(512L, min(targetCount.toLong(), totalFrames)).toInt()
            val framesPerBucket = max(1L, totalFrames / bucketCount)

            val minPeaks = FloatArray(bucketCount)
            val maxPeaks = FloatArray(bucketCount)
            val rmsSums = DoubleArray(bucketCount)
            val rmsCounts = IntArray(bucketCount)

            codec = MediaCodec.createDecoderByType(mime).apply {
                configure(format, null, null, 0)
                start()
            }
            val info = MediaCodec.BufferInfo()
            musical = MusicalTrackAnalyzer(sampleRate, ((durationUs + 999_999) / 1_000_000).toInt())
            var globalFrame = 0L
            var pcmFloat = false
            var inputDone = false
            var outputDone = false

            var lastPublish = 0L
            while (!outputDone) {
                coroutineContext.ensureActive()
                if (!inputDone) {
                    val inIdx = codec.dequeueInputBuffer(0)
                    if (inIdx >= 0) {
                        val buf = codec.getInputBuffer(inIdx)!!
                        val n = extractor.readSampleData(buf, 0)
                        if (n < 0) {
                            codec.queueInputBuffer(
                                inIdx, 0, 0, 0,
                                MediaCodec.BUFFER_FLAG_END_OF_STREAM
                            )
                            inputDone = true
                        } else {
                            codec.queueInputBuffer(inIdx, 0, n, extractor.sampleTime, 0)
                            extractor.advance()
                        }
                    }
                }
                when (val outIdx = codec.dequeueOutputBuffer(info, 1_000)) {
                    MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                        val of = codec.outputFormat
                        if (of.containsKey(MediaFormat.KEY_CHANNEL_COUNT))
                            channels = of.getInteger(MediaFormat.KEY_CHANNEL_COUNT)
                        if (of.containsKey(MediaFormat.KEY_PCM_ENCODING))
                            pcmFloat = of.getInteger(MediaFormat.KEY_PCM_ENCODING) ==
                                android.media.AudioFormat.ENCODING_PCM_FLOAT
                    }
                    MediaCodec.INFO_TRY_AGAIN_LATER -> Unit
                    else -> {
                        if (outIdx < 0) continue
                        if (info.size > 0) {
                            val buf = codec.getOutputBuffer(outIdx)!!
                            buf.position(info.offset)
                            buf.limit(info.offset + info.size)
                            buf.order(ByteOrder.LITTLE_ENDIAN)
                            musical.consume(buf, info.offset, info.size, channels, pcmFloat)
                            if (pcmFloat) consumeFloat(buf, channels, globalFrame, framesPerBucket, bucketCount, minPeaks, maxPeaks, rmsSums, rmsCounts).also { globalFrame = it }
                            else consumeShort(buf, channels, globalFrame, framesPerBucket, bucketCount, minPeaks, maxPeaks, rmsSums, rmsCounts).also { globalFrame = it }
                        }
                        codec.releaseOutputBuffer(outIdx, false)
                        val now = SystemClock.elapsedRealtime()
                        if (globalFrame > 0 && now - lastPublish >= 200) {
                            onProgress(normalize(minPeaks, maxPeaks, rmsSums, rmsCounts))
                            lastPublish = now
                        }
                        if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) outputDone = true
                    }
                }
            }

            // Same reporting policy as MWAudioAnalysisPolicy on iOS main.
            val finalWaveform = normalize(minPeaks, maxPeaks, rmsSums, rmsCounts)
            onProgress(finalWaveform)
            val peak = maxOf(minPeaks.maxOf { abs(it) }, maxPeaks.maxOf { abs(it) })
            coroutineContext.ensureActive()
            onMusicalResult(if (globalFrame.toDouble() / sampleRate >= 8 && peak >= .000001f) musical.finish() else "Non détecté")
            return finalWaveform
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (t: Exception) {
            return emptyList()
        } finally {
            musical?.close()
            runCatching { codec?.stop() }
            runCatching { codec?.release() }
            runCatching { extractor.release() }
        }
    }

    private fun normalize(minPeaks: FloatArray, maxPeaks: FloatArray, rmsSums: DoubleArray, rmsCounts: IntArray): List<WaveformSample> {
            // Normalisation par le pic global — exactement comme iOS.
            var peakRef = 0f
            for (i in 0 until minPeaks.size) {
                peakRef = max(peakRef, max(abs(minPeaks[i]), abs(maxPeaks[i])))
            }
            if (peakRef <= 0f) return List(minPeaks.size) { WaveformSample.Silence }

            return List(minPeaks.size) { i ->
                if (rmsCounts[i] == 0) return@List WaveformSample.Silence
                val rms = if (rmsCounts[i] > 0)
                    sqrt(rmsSums[i] / rmsCounts[i]).toFloat() else 0f
                WaveformSample(
                    minPeak = (minPeaks[i] / peakRef).coerceIn(-1f, 0f),
                    maxPeak = (maxPeaks[i] / peakRef).coerceIn(0f, 1f),
                    rms = max(0.015f, min(1f, (max(rms / peakRef, 0f)).toDouble().pow(0.72).toFloat()))
                )
            }

    }

    private fun consumeShort(
        buf: java.nio.ByteBuffer, channels: Int, startFrame: Long,
        framesPerBucket: Long, bucketCount: Int,
        minPeaks: FloatArray, maxPeaks: FloatArray,
        rmsSums: DoubleArray, rmsCounts: IntArray
    ): Long {
        val sb = buf.asShortBuffer()
        var globalFrame = startFrame
        while (sb.remaining() >= channels) {
            var mn = Float.MAX_VALUE; var mx = -Float.MAX_VALUE; var e = 0f
            for (c in 0 until channels) {
                val s = sb.get() / 32768f
                mn = min(mn, s); mx = max(mx, s); e += s * s
            }
            val b = (globalFrame / framesPerBucket).toInt().coerceAtMost(bucketCount - 1)
            if (mn < minPeaks[b]) minPeaks[b] = mn
            if (mx > maxPeaks[b]) maxPeaks[b] = mx
            rmsSums[b] += e / channels; rmsCounts[b]++
            globalFrame++
        }
        return globalFrame
    }

    private fun consumeFloat(
        buf: java.nio.ByteBuffer, channels: Int, startFrame: Long,
        framesPerBucket: Long, bucketCount: Int,
        minPeaks: FloatArray, maxPeaks: FloatArray,
        rmsSums: DoubleArray, rmsCounts: IntArray
    ): Long {
        val fb = buf.asFloatBuffer()
        var globalFrame = startFrame
        while (fb.remaining() >= channels) {
            var mn = Float.MAX_VALUE; var mx = -Float.MAX_VALUE; var e = 0f
            for (c in 0 until channels) {
                val s = fb.get()
                mn = min(mn, s); mx = max(mx, s); e += s * s
            }
            val b = (globalFrame / framesPerBucket).toInt().coerceAtMost(bucketCount - 1)
            if (mn < minPeaks[b]) minPeaks[b] = mn
            if (mx > maxPeaks[b]) maxPeaks[b] = mx
            rmsSums[b] += e / channels; rmsCounts[b]++
            globalFrame++
        }
        return globalFrame
    }
}
