package com.meewav.android.features.rooms.wave

import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.util.UUID

/** Shared Web/iOS gift contracts. Only confirmed server rows enter the UI. */
internal class RoomGiftRemote(private val api:LogeRemoteRepository) {
    private val codes=listOf("force-card","vip-pass","private-access","golden-like","supporter-bonus","la-certif")
    private val labels=listOf("Carte de Force","Pass VIP","Accès privé","Golden Like","Bonus supporter","La Certif")
    private fun date(row:JSONObject,key:String):Long? = row.optString(key).takeIf{it.isNotBlank()&&it!="null"}?.let{Instant.parse(it).toEpochMilli()}
    private fun gift(row:JSONObject,draw:Boolean):LogeGift {
        val winner=row.optString("winner_display_name").takeIf{it.isNotBlank()&&it!="null"}
        return LogeGift(id=row.getString("id"),code=codes.indexOf(row.getString("gift_code")),
            title=row.getString("gift_label"),recipientId=row.optString("recipient_profile_id"),
            recipientName=row.optString("recipient_display_name_snapshot"),status=row.getString("status"),
            scheduledAt=date(row,"scheduled_at"),startedAt=date(row,"started_at"),
            eligibleCount=if(draw)row.optInt("eligible_count")else null,animationSeconds=row.optInt("animation_duration_seconds",7),
            pool=if(draw)listOf(LogeCandidate("draw","Tirage · ${row.optInt("eligible_count")} participants"))else emptyList(),
            winner=winner?.let{LogeCandidate(row.optString("winner_profile_id"),it)})
    }
    suspend fun refresh(state:LogeToolsState) {
        val inventory=api.rpc("profile_list_my_gift_inventory_v1",JSONObject()).optJSONArray("items")?:JSONArray()
        val stock=MutableList(6){0}
        for(i in 0 until inventory.length()){val r=inventory.getJSONObject(i);val code=codes.indexOf(r.optString("gift_code"));if(code>=0)stock[code]=r.optInt("available_quantity")}
        val room=UUID.fromString(api.roomId).toString()
        val deliveries=api.table("room_gift_deliveries_v1?room_id=eq.$room&order=created_at.desc&limit=100")
        val draws=api.table("room_gift_draws_v1?room_id=eq.$room&order=created_at.desc&limit=100")
        val gifts=(0 until deliveries.length()).map{gift(deliveries.getJSONObject(it),false)}+
            (0 until draws.length()).map{gift(draws.getJSONObject(it),true)}
        state.acceptGiftInventory(stock,gifts.filter{it.code>=0})
    }
    suspend fun send(g:LogeGift,state:LogeToolsState):LogeGift {
        require(g.code in codes.indices)
        val draw=g.pool.isNotEmpty()
        val payload=JSONObject().put("p_room_id",api.roomId).put("p_gift_code",codes[g.code])
            .put("p_gift_label",labels[g.code]).put("p_idempotency_key",g.id)
            .put("p_scheduled_at",g.scheduledAt?.let{Instant.ofEpochMilli(it).toString()}?:JSONObject.NULL)
        if(draw){
            val manual=g.pool.all{it.id.startsWith("manual:")}
            payload.put("p_pool_mode",if(manual)"manual"else"selected")
                .put("p_animation_duration_seconds",g.animationSeconds)
                .put("p_candidates",JSONArray(g.pool.map{JSONObject().put("display_name",it.name)
                    .put("profile_id",if(manual)JSONObject.NULL else UUID.fromString(it.id).toString())}))
        } else {
            require(g.status!="round"){"Choisis un envoi immédiat ou une date."}
            payload.put("p_recipient_profile_id",UUID.fromString(g.recipientId).toString())
                .put("p_action",if(g.status=="scheduled")"schedule"else"send_now")
        }
        val row=api.rpc(if(draw)"rooms_create_gift_draw_v1"else"rooms_submit_gift_v1",payload)
            .getJSONArray("items").getJSONObject(0)
        val confirmed=gift(row,draw)
        state.acceptGiftInventory(state.data.stock,state.data.gifts.filterNot{it.id==confirmed.id}+confirmed)
        // A failed refresh must not turn a confirmed send into a failed send.
        runCatching{refresh(state)}
        return confirmed
    }
    suspend fun command(action:String,id:String) {
        val rpc=when(action){"start"->"rooms_start_gift_draw_v1";"cancel"->"rooms_cancel_gift_draw_v1";else->error("Commande inconnue")}
        api.rpc(rpc,JSONObject().put("p_draw_id",UUID.fromString(id).toString()))
    }
}
