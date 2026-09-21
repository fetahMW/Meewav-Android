package com.meewav.android.features.rooms.wave

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.util.UUID

internal class RoomChatRemote(private val api:LogeRemoteRepository,private val state:WaveChatSession) {
    private val room=UUID.fromString(api.roomId).toString()
    private val keys=mutableMapOf<String,Long>()
    private val attempts=mutableMapOf<String,String>()
    private var pollId:String?=null
    private fun rows(a:JSONArray)=(0 until a.length()).map{a.getJSONObject(it)}
    private fun key(id:String)=keys.getOrPut(id){(keys.size+1).toLong()}
    suspend fun refresh() {
        val roomRow=api.table("rooms_v2?id=eq.$room&select=host_id,status").getJSONObject(0)
        val host=roomRow.getString("host_id")
        val me=api.currentUserId()
        val messages=rows(api.table("room_messages_v2?room_id=eq.$room&select=id,user_id,content,created_at,is_system&order=created_at.desc,id.desc&limit=80")).reversed()
        val pins=rows(api.table("room_pinned_items_v2?room_id=eq.$room&is_active=eq.true&select=source_message_id,source_user_id,content,expires_at,created_at&order=created_at.desc&limit=1"))
        val ids=(messages.map{it.optString("user_id")}+pins.map{it.optString("source_user_id")}).filter{runCatching{UUID.fromString(it)}.isSuccess}.distinct()
        val profiles=if(ids.isEmpty())emptyMap()else rows(api.table("public_profiles?id=in.(${ids.joinToString(",")})&select=id,display_name,username")).associateBy{it.getString("id")}
        fun name(id:String)=profiles[id]?.optString("display_name")?.takeIf{it.isNotBlank()&&it!="null"}
            ?:profiles[id]?.optString("username")?.takeIf{it.isNotBlank()&&it!="null"}?:"Artiste"
        val projected=messages.map{m->val user=m.optString("user_id");val id=m.getString("id")
            WaveChatMessage(key(id),user,name(user),m.getString("content"),Instant.parse(m.getString("created_at")).toEpochMilli(),
                isHost=user==host,isOwn=user==me,isSystem=m.optBoolean("is_system"),serverId=id)}
        val activePin=pins.firstOrNull()?.takeIf{p->p.isNull("expires_at")||Instant.parse(p.getString("expires_at")).toEpochMilli()>System.currentTimeMillis()}
        val pinned=activePin?.let{p->val id=p.optString("source_message_id");projected.find{it.serverId==id}
            ?:WaveChatMessage(key("pin:$id"),p.optString("source_user_id"),name(p.optString("source_user_id")),p.getString("content"),
                Instant.parse(p.getString("created_at")).toEpochMilli(),isHost=p.optString("source_user_id")==host,serverId=id.takeUnless{it=="null"||it.isBlank()})}
        val poll=rows(api.table("room_polls_v2?room_id=eq.$room&select=id,question,options,duration_seconds,is_active,created_at&order=created_at.desc&limit=1")).firstOrNull()
        pollId=poll?.getString("id")
        state.poll.value=poll?.let{p->val options=p.getJSONArray("options");val expires=Instant.parse(p.getString("created_at")).toEpochMilli()+p.getInt("duration_seconds")*1000L
            WaveChatPoll(p.getString("question"),(0 until options.length()).map{index->val option=options.get(index);if(option is JSONObject)option.optString("label")else option.toString()},if(p.optBoolean("is_active"))expires else minOf(expires,System.currentTimeMillis()))}
        state.messages.value=projected
        state.pinned=pinned
    }
    suspend fun send(text:String) {
        val attempt=attempts.getOrPut(text){UUID.randomUUID().toString()}
        api.rpc("rooms_send_message_idempotent_v1",JSONObject().put("p_room_id",room).put("p_content",text).put("p_client_request_id",attempt))
        attempts.remove(text)
    }
    suspend fun delete(message:WaveChatMessage) {
        api.rpc("rooms_delete_message_v2",JSONObject().put("p_room_id",room).put("p_message_id",requireNotNull(message.serverId)))
    }
    suspend fun pin(message:WaveChatMessage?) {
        val args=JSONObject().put("p_room_id",room)
        if(message!=null)args.put("p_message_id",requireNotNull(message.serverId)).put("p_expiration_seconds",JSONObject.NULL)
        api.rpc(if(message==null)"rooms_clear_pinned_item_v2"else"rooms_pin_message_item_v2",args)
    }
    suspend fun createPoll(question:String,options:List<String>,seconds:Int) {
        api.rpc("rooms_create_poll_v2",JSONObject().put("p_room_id",room).put("p_question",question)
            .put("p_options",JSONArray(options.map{JSONObject().put("label",it)})).put("p_duration_seconds",seconds))
    }
    suspend fun stopPoll(){pollId?.let{api.rpc("rooms_stop_poll_v2",JSONObject().put("p_poll_id",it))}}
}

@Composable internal fun BindRoomChat(state:WaveChatSession,roomId:String?) {
    val context=LocalContext.current
    LaunchedEffect(state,roomId) {
        if(roomId==null)return@LaunchedEffect
        val remote=RoomChatRemote(LogeRemoteRepository(context.applicationContext,roomId),state)
        suspend fun mutate(action:suspend()->Unit):Boolean {
            if(state.busy)return false
            state.busy=true
            try{
                action()
                state.error=null
                try{remote.refresh()}catch(e:CancellationException){throw e}catch(e:Exception){state.error="Action enregistrée, actualisation en attente."}
                return true
            }catch(e:CancellationException){throw e}
            catch(e:Exception){state.error=e.message?:"Action non confirmée. Réessaie.";return false}
            finally{state.busy=false}
        }
        state.send={text->mutate{remote.send(text)}}
        state.delete={message->launch{mutate{remote.delete(message)}}}
        state.pin={message->launch{mutate{remote.pin(message)}}}
        state.launchPoll={question,options,seconds->launch{mutate{remote.createPoll(question,options,seconds)}}}
        state.stopPoll={launch{mutate{remote.stopPoll()}}}
        try{while(true){
            if(!state.busy)try{remote.refresh();state.error=null}catch(e:CancellationException){throw e}catch(e:Exception){state.error="Chat indisponible. Reconnexion en cours…"}
            delay(2000)
        }}finally{state.send=null;state.delete=null;state.pin=null;state.launchPoll=null;state.stopPoll=null}
    }
}
