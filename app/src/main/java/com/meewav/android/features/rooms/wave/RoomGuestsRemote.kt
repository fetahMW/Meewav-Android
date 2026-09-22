package com.meewav.android.features.rooms.wave

import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalContext
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject

/** Reads the same invitation/queue records used by iOS. Never synthesizes readiness. */
internal class RoomGuestsRemote(private val api:LogeRemoteRepository,private val state:WaveGuestState) {
    private val room=java.util.UUID.fromString(api.roomId).toString()
    private fun JSONArray.rows()=(0 until length()).map{getJSONObject(it)}
    suspend fun refresh(){
        val rooms=api.table("rooms_v2?id=eq.$room&select=queue_open,status")
        check(rooms.length()==1 && rooms.getJSONObject(0).optString("status")!="ended"){"Live terminé ou inaccessible"}
        val invitations=api.table("room_invitations_v2?room_id=eq.$room&ended_at=is.null&select=guest_id,status&status=in.(pending,accepted,ready,backstage,onstage)&order=created_at.asc").rows()
        val queue=api.table("room_queue_v2?room_id=eq.$room&removed_at=is.null&select=user_id&order=joined_queue_at.asc").rows()
        val ids=(invitations.map{it.getString("guest_id")}+queue.map{it.getString("user_id")}).distinct()
        val profiles=ids.chunked(50).flatMap{batch->api.table("public_profiles?id=in.(${batch.joinToString(",")})&select=id,display_name,username,avatar_url").rows()}.associateBy{it.getString("id")}
        val mixers=api.table("room_mixer_state_v2?room_id=eq.$room&select=guest_id,is_mic_muted,is_video_off,host_mic_forced_muted").rows().associateBy{it.getString("guest_id")}
        val people=ids.map{id->
            val invitation=invitations.find{it.getString("guest_id")==id}
            val status=invitation?.optString("status")
            val p=profiles[id];val m=mixers[id]
            WaveGuest(id=id,name=p?.optString("display_name")?.takeIf{it.isNotBlank()&&it!="null"}?:p?.optString("username")?:"Artiste",
                role="Artiste",portrait=android.R.drawable.ic_menu_myplaces,
                location=when(status){"backstage"->WaveGuestLocation.BACKSTAGE;"onstage"->WaveGuestLocation.STAGE;null->WaveGuestLocation.REQUESTED;else->WaveGuestLocation.INVITED},
                mic=m?.optBoolean("is_mic_muted",true)==false&&m.optBoolean("host_mic_forced_muted")==false,
                camera=m?.optBoolean("is_video_off",true)==false,demoVideo="",hostMuted=m?.optBoolean("host_mic_forced_muted")==true,
                origin=if(queue.any{it.getString("user_id")==id})GuestOrigin.CANDIDATURE else GuestOrigin.INVITATION,
                invitation=when(status){null->GuestInvitation.NONE;"pending"->GuestInvitation.PENDING;else->GuestInvitation.ACCEPTED},
                avatarUrl=p?.optString("avatar_url")?.takeUnless{it=="null"}.orEmpty())
        }
        state.replaceRemoteGuests(people)
        state.acceptRemoteRequests(rooms.getJSONObject(0).optBoolean("queue_open"))
    }
    suspend fun command(ids:Set<String>,action:String){
        api.rpc("rooms_guest_command_v1",JSONObject().put("p_room_id",room).put("p_user_ids",JSONArray(ids.toList())).put("p_action",action))
    }
    suspend fun requests(open:Boolean){api.rpc("rooms_set_queue_open_v3",JSONObject().put("p_room_id",room).put("p_open",open))}
    suspend fun mute(id:String,muted:Boolean){api.rpc("rooms_set_host_mic_forced_muted_v2",JSONObject().put("p_room_id",room).put("p_guest_id",id).put("p_is_forced_muted",muted))}
    suspend fun invite(id:String){api.rpc("rooms_invite_profile_v1",JSONObject().put("p_room_id",room).put("p_profile_id",id))}
}

@Composable internal fun BindRoomGuests(state:WaveGuestState,roomId:String?,classe:Boolean){
    val context=LocalContext.current
    LaunchedEffect(state,roomId,classe){
        if(roomId==null||classe)return@LaunchedEffect
        state.remoteMode=true;state.replaceRemoteGuests(emptyList())
        val remote=RoomGuestsRemote(LogeRemoteRepository(context.applicationContext,roomId),state)
        var busy=false
        fun mutate(action:suspend()->Unit){launch{
            if(busy)return@launch
            busy=true
            try{action();state.selected=emptySet();state.notice=null
                try{remote.refresh()}catch(e:CancellationException){throw e}catch(e:Exception){state.notice="Action enregistrée, actualisation en attente"}
            }catch(e:CancellationException){throw e}catch(e:Exception){state.notice=e.message?:"Action non confirmée"}finally{busy=false}
        }}
        state.remoteRequests={open->mutate{remote.requests(open)}}
        state.remoteMic={id,muted->mutate{remote.mute(id,muted)}}
        state.remoteInvite={person->mutate{remote.invite(person.id)}}
        state.remoteRefuse={ids->mutate{remote.command(ids,"refuse")}}
        state.remoteRemove={ids->mutate{remote.command(ids,"remove")}}
        state.remoteMove={ids,target->
            val action=when(target){WaveGuestLocation.STAGE->"stage";WaveGuestLocation.BACKSTAGE->"backstage";WaveGuestLocation.INVITED->"invite";else->null}
            if(action==null)state.notice="Cette transition nécessite son contrat serveur" else mutate{remote.command(ids,action)}
        }
        try{while(true){
            if(!busy)try{remote.refresh()}catch(e:CancellationException){throw e}catch(e:Exception){state.notice=e.message?:"Invités indisponibles"}
            delay(2500)
        }}finally{state.remoteRequests=null;state.remoteRefuse=null;state.remoteRemove=null;state.remoteMove=null;state.remoteMic=null;state.remoteInvite=null}
    }
}

@Composable internal fun BindGuestSearch(state:WaveGuestState,roomId:String?){
    val context=LocalContext.current
    LaunchedEffect(state,roomId){
        if(roomId==null)return@LaunchedEffect
        val api=LogeRemoteRepository(context.applicationContext,roomId)
        state.remoteSearch={query->
            val rows=api.rpc("search_messageable_profiles_v1",JSONObject().put("p_query",query).put("p_limit",30)).optJSONArray("items")?:JSONArray()
            (0 until rows.length()).map{index->val p=rows.getJSONObject(index)
                WaveGuest(p.getString("profile_id"),p.optString("display_name","Artiste"),p.optString("primary_role_key","Artiste"),android.R.drawable.ic_menu_myplaces,WaveGuestLocation.INVITED,
                    demoVideo="",gradeLevel=p.optInt("grade_level",1),avatarUrl=p.optString("avatar_url").takeUnless{it=="null"}.orEmpty())
            }.filter{candidate->state.guests.none{it.id==candidate.id}}
        }
        try{kotlinx.coroutines.awaitCancellation()}finally{state.remoteSearch=null}
    }
}
