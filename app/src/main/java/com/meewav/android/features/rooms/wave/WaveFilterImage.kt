package com.meewav.android.features.rooms.wave

import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

private val filterThumbnails = LruCache<Int, ImageBitmap>(36)

/** Decode source artwork away from the UI thread at thumbnail density; originals remain untouched. */
@Composable
internal fun WaveFilterImage(resource: Int) {
    val resources = LocalContext.current.resources
    val bitmap by produceState<ImageBitmap?>(filterThumbnails.get(resource), resource) {
        if (value == null) value = withContext(Dispatchers.IO) {
            filterThumbnails.get(resource) ?: run {
                val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeResource(resources, resource, bounds)
                var sample = 1
                while (bounds.outWidth / (sample * 2) >= 160 && bounds.outHeight / (sample * 2) >= 160) sample *= 2
                BitmapFactory.decodeResource(resources, resource, BitmapFactory.Options().apply { inSampleSize = sample })
                    ?.asImageBitmap()?.also { filterThumbnails.put(resource, it) }
            }
        }
    }
    val loaded = bitmap
    if (loaded != null) Image(loaded, null, modifier = Modifier.size(38.dp)) else Box(Modifier.size(38.dp))
}
