package com.meewav.android.features.auth

import android.content.Context
import android.webkit.WebResourceResponse
import java.io.ByteArrayInputStream
import java.io.EOFException
import java.io.FilterInputStream
import java.io.InputStream

/** Lecture partielle des médias de l’APK, notamment les métadonnées de fin des M4A. */
internal fun localMediaAsset(
    context: Context, path: String, mime: String, size: Long, range: String?,
): WebResourceResponse {
    val headers = mutableMapOf(
        "Cache-Control" to "no-store", "X-Content-Type-Options" to "nosniff",
        "Accept-Ranges" to "bytes",
    )
    fun unsatisfiable(): WebResourceResponse {
        headers["Content-Range"] = "bytes */$size"
        headers["Content-Length"] = "0"
        return WebResourceResponse(mime, null, 416, "Range Not Satisfiable", headers, ByteArrayInputStream(byteArrayOf()))
    }
    var start = 0L
    var end = size - 1
    val match = range?.trim()?.let { Regex("bytes=(\\d*)-(\\d*)", RegexOption.IGNORE_CASE).matchEntire(it) }
    val partial = match != null && match.groupValues.drop(1).any { it.isNotEmpty() }
    if (partial) {
        val first = match!!.groupValues[1]
        val last = match.groupValues[2]
        if (first.isEmpty()) {
            val suffix = last.toLongOrNull() ?: return unsatisfiable()
            if (suffix <= 0) return unsatisfiable()
            start = (size - suffix).coerceAtLeast(0)
        } else {
            start = first.toLongOrNull() ?: return unsatisfiable()
            if (last.isNotEmpty()) end = (last.toLongOrNull() ?: return unsatisfiable()).coerceAtMost(end)
        }
        if (start > end || start >= size) return unsatisfiable()
        headers["Content-Range"] = "bytes $start-$end/$size"
    }
    val length = (end - start + 1).coerceAtLeast(0)
    headers["Content-Length"] = length.toString()
    val stream = context.assets.open(path)
    try {
        var skipped = 0L
        while (skipped < start) {
            val count = stream.skip(start - skipped)
            if (count > 0) skipped += count
            else {
                if (stream.read() < 0) throw EOFException("Media asset ended before requested range")
                skipped++
            }
        }
        return WebResourceResponse(mime, null, if (partial) 206 else 200,
            if (partial) "Partial Content" else "OK", headers, LimitedAssetStream(stream, length))
    } catch (error: Exception) {
        stream.close()
        throw error
    }
}

private class LimitedAssetStream(input: InputStream, private var remaining: Long) : FilterInputStream(input) {
    override fun read(): Int {
        if (remaining == 0L) return -1
        val value = `in`.read()
        if (value >= 0) remaining-- else remaining = 0
        return value
    }
    override fun read(buffer: ByteArray, offset: Int, length: Int): Int {
        if (length == 0) return 0
        if (remaining == 0L) return -1
        val count = `in`.read(buffer, offset, minOf(length.toLong(), remaining).toInt())
        if (count > 0) remaining -= count else if (count < 0) remaining = 0
        return count
    }
    override fun skip(count: Long): Long {
        val skipped = `in`.skip(minOf(count.coerceAtLeast(0), remaining))
        remaining -= skipped
        return skipped
    }
    override fun available(): Int = minOf(`in`.available().toLong(), remaining).toInt()
    override fun markSupported() = false
}
