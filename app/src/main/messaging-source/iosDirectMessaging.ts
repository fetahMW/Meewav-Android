import { supabase } from './runtime';
import { messagingRepository } from './vendor/src/features/messaging/messaging.service';

// All reads and mutations now use the shared contract, including legacy AAC
// notes exposed as private attachment manifests. The native recorder keeps its
// existing direct-chat upload/RPC contract below.
type Row = Record<string, any>;
async function rpc(name: string, params?: Row) {
 const {data,error}=await supabase.rpc(name,params);if(error)throw error;return data;
}
export const iosDirectRepository=messagingRepository;

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
