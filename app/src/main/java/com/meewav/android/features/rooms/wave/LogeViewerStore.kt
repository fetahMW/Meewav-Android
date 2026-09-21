package com.meewav.android.features.rooms.wave

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

/** Same-device demo transport. Never used as a live-account authority. */
internal object LogeViewerStore {
    fun media(context:Context,title:String,id:String):java.io.File? {
        val prefs=context.getSharedPreferences("loge-tools-v1-"+("demo:"+title).hashCode(),Context.MODE_PRIVATE)
        val moments=JSONObject(prefs.getString("state",null)?:"{}").optJSONArray("moments")?:return null
        val item=(0 until moments.length()).map{moments.getJSONObject(it)}.firstOrNull{it.optString("id")==id&&it.optString("personId")=="loge-a"&&it.optString("status")=="completed"}?:return null
        val file=java.io.File(item.optString("file")).canonicalFile
        val root=java.io.File(context.filesDir,"loge-dedications").canonicalFile
        return file.takeIf{it.isFile&&it.path.startsWith(root.path+java.io.File.separator)}
    }
    @Synchronized fun request(context: Context, title: String, command: JSONObject?): JSONObject {
        val prefs=context.getSharedPreferences("loge-tools-v1-"+("demo:"+title).hashCode(),Context.MODE_PRIVATE)
        val state=JSONObject(prefs.getString("state",null)?:"{}")
        val viewer="loge-a"
        fun array(key:String)=state.optJSONArray(key)?:JSONArray().also{state.put(key,it)}
        if(command!=null) {
            when(command.getString("type")) {
                "request" -> {
                    val format=command.getString("format");require(format in setOf("live","audio"))
                    val list=array("moments")
                    require((0 until list.length()).none { val m=list.getJSONObject(it);m.optString("personId")==viewer&&m.optString("format")==format&&m.optString("status") in setOf("pending","scheduled","accepted","live") })
                    list.put(JSONObject().put("id",UUID.randomUUID().toString()).put("personId",viewer).put("format",format).put("status","pending").put("minutes",5).put("seconds",0).put("file",""))
                }
                "cancel-request" -> {
                    val list=array("moments");val item=(0 until list.length()).map{list.getJSONObject(it)}.firstOrNull{it.optString("id")==command.optString("id")&&it.optString("personId")==viewer}?:error("Demande introuvable")
                    require(item.optString("status")=="pending");item.put("status","cancelled")
                }
                "question" -> {
                    require(state.optBoolean("questionsOpen",true)) { "Les questions sont fermées." }
                    val text=command.getString("text").trim();require(text.length in 1..280)
                    val list=array("questions")
                    require((0 until list.length()).none{val q=list.getJSONObject(it);q.optString("personId")==viewer&&q.optString("status") in setOf("pending","selected")}) { "Une question est déjà en attente." }
                    list.put(JSONObject().put("id",UUID.randomUUID().toString()).put("personId",viewer).put("text",text).put("status","pending").put("supports",0))
                }
                "moment", "experience" -> {
                    val list=array(if(command.getString("type")=="moment")"moments" else "experiences")
                    val item=(0 until list.length()).map{list.getJSONObject(it)}.firstOrNull{it.optString("id")==command.optString("id")&&it.optString("personId")==viewer}?:error("Invitation introuvable")
                    require(item.optString("status")==if(command.getString("type")=="moment")"scheduled"else"pending") { "Cette invitation a déjà changé." }
                    item.put("status",if(command.getBoolean("accept"))"accepted"else"declined")
                }
                else -> error("Action non autorisée")
            }
            check(prefs.edit().putString("state",state.toString()).commit())
        }
        val result=JSONObject().put("viewerId",viewer).put("viewerName","Lou V.").put("questionsOpen",state.optBoolean("questionsOpen",true))
        for(key in listOf("questions","moments","experiences")) {
            val filtered=JSONArray();val all=array(key)
            for(i in 0 until all.length()) { val item=all.getJSONObject(i);if(item.optString("personId")==viewer || (key=="questions"&&item.optString("status")=="selected")) {
                val safe=JSONObject(item.toString());safe.remove("file")
                if(key=="moments"&&item.optString("file").isNotBlank()&&item.optString("status")=="completed")safe.put("privateContent","/native/loge-media?title="+android.net.Uri.encode(title)+"&id="+android.net.Uri.encode(item.getString("id")))
                filtered.put(safe)
            } }
            result.put(key,filtered)
        }
        return result
    }
}
