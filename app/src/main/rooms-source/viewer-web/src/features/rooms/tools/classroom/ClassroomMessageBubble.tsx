import { useEffect, useState } from "react";
import { MessageCircleMore, Send, X } from "lucide-react";
import { supabase } from "../../../../lib/supabaseClient";

import { readClassroomDemoMessages, subscribeClassroomDemoMessages, appendClassroomDemoMessage } from "./classroomDemoMessages";

type BubbleMessage = {id:string; body:string; own:boolean; conversationId?:string};
export default function ClassroomMessageBubble({roomId, accountId, peerId, peerName, source}:{roomId:string;accountId:string;peerId:string;peerName:string;source:"demo"|"live"}) {

  const [messages,setMessages] = useState<BubbleMessage[]>([]);
  const [body,setBody] = useState("");
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [dismissed,setDismissed] = useState<string | null>(null);
  const [version,setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      if(source === "demo") {
        const rows=readClassroomDemoMessages(roomId).filter(m => (m.senderId===peerId&&m.recipientId===accountId)||(m.senderId===accountId&&m.recipientId===peerId));
        if(active)setMessages(rows.map(m=>({...m,own:m.senderId===accountId})));
        return;
      }
      try {
        const {data,error}=await supabase.rpc("rooms_classe_private_messages_v1",{p_room_id:roomId,p_peer_id:peerId});
        if(error)throw error;
        if(active && Array.isArray(data))setMessages(data.map(m=>({id:m.id,body:m.body,own:m.is_outgoing})));

      } catch { /* Realtime and the recovery poll retry without replacing the draft. */ }
    };
    void load();
    const unsubscribe=source==="demo"?subscribeClassroomDemoMessages(()=>void load()):()=>{};
    const interval=source==="live"?window.setInterval(()=>void load(),2500):undefined;
    return ()=>{active=false;unsubscribe();window.clearInterval(interval);};
  },[roomId,accountId,peerId,source,version]);
  const received=messages.filter(m=>!m.own);
  const incoming=received[received.length-1];
  if(!incoming)return null;
  if(dismissed===incoming.id)return <button className="classe-private-reopen" type="button" aria-label="Ouvrir le message privé" onClick={()=>setDismissed(null)}><MessageCircleMore /></button>;
  return <aside className="classe-private-bubble" aria-label={`Message privé de ${peerName}`}><header><MessageCircleMore /><strong>{peerName} · Privé</strong><button type="button" aria-label="Réduire le message privé" onClick={()=>setDismissed(incoming.id)}><X /></button></header><div className="classe-private-bubble__messages" role="log">{messages.slice(-4).map(m=><p key={m.id} className={m.own?"is-own":""}>{m.body}</p>)}</div><form onSubmit={event=>{event.preventDefault();if(!body.trim()||busy)return;setBusy(true);setError("");const text=body.trim();const send=async()=>{if(source==="demo")appendClassroomDemoMessage(roomId,accountId,peerId,text);else {const {error}=await supabase.rpc("rooms_classe_send_private_message_v1",{p_room_id:roomId,p_peer_id:peerId,p_body:text,p_client_request_id:crypto.randomUUID()});if(error)throw error;}setBody("");setVersion(v=>v+1);};void send().catch(()=>setError("Réponse non envoyée. Réessayez.")).finally(()=>setBusy(false));}}><input aria-label="Répondre en privé" placeholder="Répondre ici…" maxLength={280} value={body} onChange={e=>setBody(e.target.value)} /><button type="submit" aria-label="Envoyer la réponse privée" disabled={busy||!body.trim()}><Send /></button></form>{error?<p role="alert">{error}</p>:null}</aside>;
}
