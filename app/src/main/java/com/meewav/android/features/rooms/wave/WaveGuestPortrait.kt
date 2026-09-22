package com.meewav.android.features.rooms.wave

import android.graphics.BitmapFactory
import android.util.LruCache
import androidx.compose.foundation.Image
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URL

private val guestPortraits=LruCache<String,ImageBitmap>(48)

/** Real public portrait, decoded off the UI thread; demo drawable remains unchanged. */
@Composable internal fun WaveGuestPortrait(guest:WaveGuest,contentDescription:String?,modifier:Modifier=Modifier,contentScale:ContentScale=ContentScale.Crop) {
    val source=guest.avatarUrl
    val bitmap by produceState<ImageBitmap?>(guestPortraits.get(source),source) {
        if(source.isBlank()||value!=null)return@produceState
        value=withContext(Dispatchers.IO) {
            try{
                val url=URL(source)
                require(url.protocol=="https")
                val connection=url.openConnection() as HttpURLConnection
                connection.connectTimeout=8000;connection.readTimeout=8000;connection.instanceFollowRedirects=false
                try{
                    check(connection.responseCode==200)
                    val bytes=connection.inputStream.use{input->
                        val output=java.io.ByteArrayOutputStream()
                        val buffer=ByteArray(8192)
                        while(true){val count=input.read(buffer);if(count<0)break;require(output.size()+count<=4*1024*1024);output.write(buffer,0,count)}
                        output.toByteArray()
                    }
                    require(bytes.size<=4*1024*1024)
                    val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true}
                    BitmapFactory.decodeByteArray(bytes,0,bytes.size,bounds)
                    var sample=1
                    while(bounds.outWidth/sample>512||bounds.outHeight/sample>512)sample*=2
                    BitmapFactory.decodeByteArray(bytes,0,bytes.size,BitmapFactory.Options().apply{inSampleSize=sample})
                        ?.asImageBitmap()?.also{guestPortraits.put(source,it)}
                }finally{connection.disconnect()}
            }catch(e:CancellationException){throw e}catch(e:Exception){null}
        }
    }
    bitmap?.let{Image(it,contentDescription,modifier,contentScale=contentScale)}
        ?:Image(painterResource(guest.portrait),contentDescription,modifier,contentScale=contentScale)
}
