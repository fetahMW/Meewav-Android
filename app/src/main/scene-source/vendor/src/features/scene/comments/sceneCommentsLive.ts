import { supabase } from "../../../lib/supabaseClient";
import type { SceneComment } from "./sceneComments";
export async function submitSceneComment(mediaId:string,body:string,parentId:string|null,requestId:string){
 const {data,error}=await supabase.rpc('scene_submit_comment_v1',{p_media_id:mediaId,p_body:body,p_parent_id:parentId,p_request_id:requestId});
 if(error)throw error;
 return data;
}
export async function sceneInteraction(action: string, mediaId: string, commentId: string | null = null, body: string | null = null, parentId: string | null = null) {
 const {data,error} = await supabase.rpc('scene_interaction_v1', {p_action:action,p_media_id:mediaId,p_comment_id:commentId,p_body:body,p_parent_id:parentId});
 if(error) throw error;
 return data;
}
export async function listSceneComments(mediaId:string, signal?:AbortSignal,
 onPage?: (comments:SceneComment[],hasMore:boolean)=>void): Promise<SceneComment[]> {
 const comments=new Map<string,SceneComment>();
 let cursor:{time:string;id:string}|null=null;
 const visited=new Set<string>();
 do {
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  let request=supabase.rpc('scene_comments_recent_page_v2',{p_media_id:mediaId,p_before_time:cursor?.time??null,p_before_id:cursor?.id??null,p_limit:200});
  if(signal)request=request.abortSignal(signal);
  const {data,error}=await request;
  if(error)throw error;
  if(!data||!Array.isArray(data.items))throw Error('invalid_comments_response');
  for(const comment of data.items)comments.set(comment.id,comment);
  cursor=data.next;
  if(cursor){const key=JSON.stringify(cursor);if(visited.has(key))throw Error('invalid_comments_cursor');visited.add(key);}
  if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
  onPage?.([...comments.values()],Boolean(cursor));
 }while(cursor);
 return [...comments.values()];
}
