package com.meewav.android.features.rooms.wave

import com.meewav.android.BuildConfig
import com.meewav.android.app.MeewavApplication
import android.content.Context
import io.github.jan.supabase.auth.status.SessionStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.filterIsInstance
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeout
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

internal class LogeRemoteRepository(context:Context,val roomId:String) {
 private val auth=(context.applicationContext as MeewavApplication).authRepository
 fun currentUserId():String? = auth.auth.currentUserOrNull()?.id
 suspend fun rpc(name:String,payload:JSONObject):JSONObject = request("/rpc/"+name,payload)
 suspend fun table(path:String):org.json.JSONArray = request("/"+path,null).optJSONArray("items")?:org.json.JSONArray()
 private suspend fun request(path:String,payload:JSONObject?):JSONObject {
  val session=withTimeout(15000){auth.auth.sessionStatus.filterIsInstance<SessionStatus.Authenticated>().first()}.session
  return withContext(Dispatchers.IO) {
   val connection=URL(BuildConfig.SUPABASE_URL.trimEnd('/')+"/rest/v1"+path).openConnection() as HttpURLConnection
   try {
    connection.requestMethod=if(payload==null)"GET" else "POST";connection.connectTimeout=15000;connection.readTimeout=15000;connection.instanceFollowRedirects=false;connection.doOutput=payload!=null
    connection.setRequestProperty("apikey",BuildConfig.SUPABASE_PUBLISHABLE_KEY);connection.setRequestProperty("Authorization","Bearer "+session.accessToken);connection.setRequestProperty("Content-Type","application/json")
    if(payload!=null)connection.outputStream.use{it.write(payload.toString().toByteArray())}
    val ok=connection.responseCode in 200..299
    val raw=(if(ok)connection.inputStream else connection.errorStream).bufferedReader().use{it.readText()}
    val result=if(raw.trim().startsWith("["))JSONObject().put("items",org.json.JSONArray(raw)) else if(raw.isBlank()||raw.trim()=="null")JSONObject() else JSONObject(raw)
    check(ok){result.optString("message","Synchronisation impossible")};result
   }finally{connection.disconnect()}
  }
 }
 suspend fun read()=rpc("rooms_loge_read_v1",JSONObject().put("p_room_id",roomId))
 suspend fun action(action:String,payload:JSONObject)=rpc("rooms_loge_action_v1",JSONObject().put("p_room_id",roomId).put("p_action",action).put("p_payload",payload))
}
