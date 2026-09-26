import {getSessionUser,supabase} from '../profile-source/runtime';
import {ROOMS_HOME_ROOM_TYPES,type RoomsHomeRoom,type RoomsHomeRoomType} from './vendor/src/features/rooms/home/roomsHome.types';

/** Same tables and membership rules as SupabaseRoomsRepository on iOS. */
export async function listLiveRooms():Promise<RoomsHomeRoom[]> {
 const {data,error}=await supabase.rpc('rooms_live_catalog_v1');
 if(error)throw error;
 const rows=(data??[]).filter((r:any)=>ROOMS_HOME_ROOM_TYPES.includes(r.type)) as {id:string;host_id:string;type:RoomsHomeRoomType;title:string;cover_url:string|null;video_format:string;participants_count:number;created_at:string}[];
 if(!rows.length)return [];
 const profiles=await supabase.from('public_profiles').select('id,display_name,username,avatar_url,primary_role_key,city').in('id',[...new Set(rows.map(r=>r.host_id))]);
 if(profiles.error)throw profiles.error;
 const byId=new Map((profiles.data??[]).map(p=>[p.id,p]));
 return rows.map(r=>{const p=byId.get(r.host_id);return {source:'live',id:r.id,slug:r.id,title:r.title,roomType:r.type,hostId:r.host_id,hostName:p?.display_name||p?.username||'Artiste',hostAvatar:p?.avatar_url||'',hostRole:p?.primary_role_key||'',musicStyle:'',thumbnail:r.cover_url||p?.avatar_url||'',videoSource:'',mediaFormat:r.video_format==='portrait'?'vertical':'horizontal',viewerCount:r.participants_count??0,buzzScore:0,recommendationScore:0,engagementScore:0,language:'fr',country:'FR',city:p?.city||undefined,tags:[],startedAt:r.created_at,isFollowedHost:false,accessType:'public',isJoinable:true};});
}
async function joinAsHost(id:string,userId:string) {
 const {error}=await supabase.from('room_participants_v2').upsert({room_id:id,user_id:userId,role:'host',left_at:null},{onConflict:'room_id,user_id'});
 if(error)throw error;
 return id;
}
export async function createLiveRoom(type:RoomsHomeRoomType,title:string,requestId:string,format:'portrait'|'landscape'='landscape'):Promise<string> {
 const {data:{user},error}=await getSessionUser();
 if(error||!user)throw new Error('Connecte-toi pour ouvrir une room.');
 const clean=title.trim();if(!clean||clean.length>160)throw new Error('Le titre doit contenir de 1 à 160 caractères.');
 if(type==='classe') {
  const result=await supabase.rpc('rooms_create_classe_v1',{p_title:clean,p_description:null,p_cover_url:null,p_video_format:format,p_client_request_id:requestId});
  if(result.error)throw result.error;
  if(!result.data?.id)throw new Error('Création non confirmée.');
  return result.data.id;
 }
 // Reuse the request ID on retry; never overwrite an existing room.
 const existing=await supabase.from('rooms_v2').select('id,host_id,type,status').eq('id',requestId).maybeSingle();
 if(existing.error)throw existing.error;
 if(existing.data){if(existing.data.host_id!==user.id||existing.data.type!==type||existing.data.status!=='live')throw new Error('Room indisponible.');return joinAsHost(existing.data.id,user.id);}
 const result=await supabase.from('rooms_v2').insert({id:requestId,host_id:user.id,type,title:clean,status:'live',livekit_room_name:`room-${requestId}`,queue_open:false,video_format:format}).select('id').single();
 if(result.error)throw result.error;
 return joinAsHost(result.data.id,user.id);
}
