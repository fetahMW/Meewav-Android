import { supabase } from './runtime';
import { messagingRepository } from './vendor/src/features/messaging/messaging.service';

// Adapter for the deployed iOS main contract; the frozen Web UI stays intact.
type Row = Record<string, any>;
async function rpc(name: string, params?: Row) {
  const {data,error}=await supabase.rpc(name,params); if(error)throw error; return data;
}
const one=(data:any)=>Array.isArray(data)?data[0]:data;
const voiceUrls=new Map<string,{url:string;expires:number}>();
async function voiceUrl(path:string) {
  const cached=voiceUrls.get(path); if(cached&&cached.expires>Date.now())return cached.url;
  const {data,error}=await supabase.storage.from('messaging-voice').createSignedUrl(path,3600);
  if(error)throw error;
  voiceUrls.set(path,{url:data.signedUrl,expires:Date.now()+50*60_000});return data.signedUrl;
}
async function mapMessage(row:Row) {
  let voiceMediaUrl:string|undefined;
  if(row.kind==='voice'&&row.voice_storage_path)voiceMediaUrl=await voiceUrl(row.voice_storage_path);
  return {...row,sender_profile_id:row.sender_id,sequence:Date.parse(row.created_at),
    body:row.body??(row.kind==='voice'?'Note vocale':''),reactions:[],deleted_at:null,
    reply_to_message_id:null,pinned_at:null,payload:{},voiceMediaUrl,voiceDurationMs:row.voice_duration_ms};
}

export const iosDirectRepository={
  ...messagingRepository,
  async listConversations({cursor,limit=30}:Row={}) {
    const rows:Row[]=await rpc('messaging_list_direct_conversations_v1');
    // This RPC returns the complete inbox, already sorted by activity.
    const offset=cursor?Math.max(0,rows.findIndex(row=>row.conversation_id===cursor)+1):0;
    return rows.slice(offset,offset+limit).map(row=>({
      ...row,kind:'direct',title:row.peer_username,counterpart_profile_id:row.peer_id,
      counterpart_username:row.peer_username,counterpart_display_name:row.peer_username,
      counterpart_avatar_url:null,counterpart_primary_role_key:null,member_count:2,
      page_cursor:row.conversation_id,pinned_at:null,muted_until:null,archived_at:null,
      notifications_enabled:true,last_message_body:row.last_message_body,
    }));
  },
  // The iOS direct-chat contract has no group invitations.
  async listConversationInvitations(){return [];},
  async listMessages({conversationId,limit=50,beforeCreatedAt,beforeId}:Row) {
    let query=supabase.from('messaging_messages_v1').select('*').eq('conversation_id',conversationId)
      .order('created_at',{ascending:false}).order('id',{ascending:false}).limit(limit);
    if(beforeCreatedAt&&beforeId)query=query.or(`created_at.lt.${beforeCreatedAt},and(created_at.eq.${beforeCreatedAt},id.lt.${beforeId})`);
    const {data,error}=await query;if(error)throw error;
    return Promise.all((data??[]).map(mapMessage));
  },
  async markConversationRead(conversationId:string){
    return rpc('messaging_mark_direct_conversation_read_v1',{p_conversation_id:conversationId});
  },
  async searchMessageableProfiles(query:string){
    const rows:Row[]=await rpc('messaging_find_contact_by_username_v1',{p_username:query.replace(/^@/,'').trim()});
    return rows.filter(row=>!row.is_self).map(row=>({...row,profile_id:row.id,display_name:row.username,
      avatar_url:null,profile_image_url:null,primary_role_key:null,grade_level:null}));
  },
  async getOrCreateDirectConversation(profileId:string){
    const {data,error}=await supabase.from('profiles').select('username').eq('id',profileId).single();
    if(error)throw error;
    const row=one(await rpc('messaging_resolve_direct_conversation_v1',{p_peer_username:data.username}));
    return {conversation_id:row.id};
  },
  async sendTextMessage(input:Row){
    const row=one(await rpc('messaging_send_text_message_v1',{p_conversation_id:input.conversationId,
      p_client_message_id:input.clientMessageId,p_body:input.body}));
    return {message_id:row.id,created_at:row.created_at,sequence:Date.parse(row.created_at)};
  },
};

// Keep one immutable object/client ID per draft, including an uncertain retry.
// Never delete an uploaded object after an ambiguous RPC result: it may already
// be attached to the recipient's message, exactly as in the iOS repository.
const voiceDrafts=new WeakMap<File,{conversationId:string;userId:string;id:string;path:string;uploaded:boolean;done:boolean;pending?:Promise<void>}>();
export async function sendIosVoice(conversationId:string,userId:string,file:File,durationMs:number){
  if(file.type!=='audio/mp4'||!file.size||file.size>10*1024*1024||!Number.isFinite(durationMs)||durationMs<600||durationMs>900_000)throw Error('invalid_voice');
  let draft=voiceDrafts.get(file);
  if(!draft){const id=crypto.randomUUID();draft={conversationId,userId,id,path:`${conversationId}/${userId}/${id}.m4a`,uploaded:false,done:false};voiceDrafts.set(file,draft);}
  if(draft.conversationId!==conversationId||draft.userId!==userId)throw Error('voice_owner_or_conversation_changed');
  if(draft.done)return;
  if(draft.pending)return draft.pending;
  const current=draft;
  current.pending=(async()=>{
    if(!current.uploaded){
      const {error}=await supabase.storage.from('messaging-voice').upload(current.path,file,{contentType:'audio/mp4',upsert:false});
      // A retry after the upload response was lost may encounter the same object.
      if(error&&String((error as any).statusCode)!=='409'&&!/already exists|duplicate/i.test(error.message))throw error;
      current.uploaded=true;
    }
    await rpc('messaging_send_voice_message_v1',{p_conversation_id:conversationId,p_client_message_id:current.id,
      p_storage_path:current.path,p_duration_ms:Math.round(durationMs),p_mime_type:'audio/mp4',p_byte_size:file.size});
    current.done=true;
  })();
  try{await current.pending;}finally{current.pending=undefined;}
}
