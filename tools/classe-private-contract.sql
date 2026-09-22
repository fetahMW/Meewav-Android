CREATE OR REPLACE FUNCTION public.rooms_classe_private_messages_v1(p_room_id uuid, p_peer_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 perform public.rooms_classe_assert_live_v1(p_room_id,false);
 if not public.rooms_classe_current_user_is_member_v1(p_room_id) then
   raise exception using errcode='42501',message='CLASSE_ACTIVE_MEMBER_REQUIRED';
 end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,
   'is_outgoing',m.sender_id=auth.uid()) order by m.created_at,m.id)
 from (select * from public.room_classe_private_messages_v1
   where room_id=p_room_id and ((sender_id=auth.uid() and recipient_id=p_peer_id)
     or (recipient_id=auth.uid() and sender_id=p_peer_id))
   order by created_at desc,id desc limit 100) m),'[]'::jsonb);
end;
$function$

CREATE OR REPLACE FUNCTION public.rooms_classe_send_private_message_v1(p_room_id uuid, p_peer_id uuid, p_body text, p_client_request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_message public.room_classe_private_messages_v1%rowtype;
begin
 perform public.rooms_classe_assert_live_v1(p_room_id,false);
 if not public.rooms_classe_current_user_is_member_v1(p_room_id)
    or p_peer_id=auth.uid()
    or not exists(select 1 from public.room_participants_v2 where room_id=p_room_id and user_id=p_peer_id and left_at is null) then
   raise exception using errcode='42501',message='CLASSE_ACTIVE_MEMBER_REQUIRED';
 end if;
 select * into v_message from public.room_classe_private_messages_v1
 where room_id=p_room_id and sender_id=auth.uid() and client_request_id=p_client_request_id;
 if found then
   if v_message.recipient_id<>p_peer_id or v_message.body<>btrim(p_body) then
     raise exception using errcode='22023',message='CLASSE_MESSAGE_REQUEST_CONFLICT';
   end if;
 else
   if (select count(*) from public.room_classe_private_messages_v1 where room_id=p_room_id
       and sender_id=auth.uid() and created_at>now()-interval '1 minute')>=30 then
     raise exception using errcode='P0001',message='CLASSE_MESSAGE_RATE_LIMITED';
   end if;
   insert into public.room_classe_private_messages_v1(room_id,sender_id,recipient_id,body,client_request_id)
   values(p_room_id,auth.uid(),p_peer_id,btrim(p_body),p_client_request_id) returning * into v_message;
   perform public.rooms_classe_emit_v1(p_room_id,'classe.private.message','user',p_peer_id,
     jsonb_build_object('sender_id',auth.uid(),'message_id',v_message.id),null,now());
 end if;
 return jsonb_build_object('id',v_message.id,'body',v_message.body,'is_outgoing',true);
end;
$function$
