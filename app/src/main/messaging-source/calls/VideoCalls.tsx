import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {Video,VideoOff,Mic,MicOff,SwitchCamera,PhoneOff,Phone,UserRound,X,Volume2} from 'lucide-react';
import {previewEnabled,supabase,useAuth,nativeVoiceEnabled} from '../runtime';
import type {VideoTransport} from './byteplus';
import './video-calls.css';

type Contact={id:string;name:string;avatar?:string};
type Call={id:string;conversationId:string;peerId:string;peerName:string;incoming:boolean;status:'ringing'|'accepted'|'ended'|'declined'|'missed'};
type Phase='prepare'|'preview'|'incoming'|'ringing'|'connecting'|'connected'|'ended'|'error';
type Screen={contact:Contact;phase:Phase;message?:string};
async function request(action:string,callId?:string,conversationId?:string):Promise<Call|null>{
  const {data,error}=await supabase.rpc('messaging_video_call_v1',{p_action:action,p_call_id:callId||null,p_conversation_id:conversationId||null});
  if(error){
    if(error.message?.includes('call_busy'))throw Error('Ce contact est déjà en appel. Réessaie dans un instant.');
    if(error.message?.includes('call_rate_limited'))throw Error('Patiente un instant avant de rappeler.');
    if(error.code==='42501')throw Error('Cet appel nécessite une conversation directe acceptée.');
    throw Error('Le service d’appel est momentanément indisponible.');
  }
  return data;
}
export function openVideoCall(contact:Contact){window.dispatchEvent(new CustomEvent('meewav:video-call',{detail:contact}));}

export default function VideoCalls(){
  const userId=useAuth().user?.id;
  const [screen,setScreen]=useState<Screen|null>(null);
  const [busy,setBusy]=useState(false);
  const [muted,setMuted]=useState(false);
  const [cameraOff,setCameraOff]=useState(false);
  const [elapsed,setElapsed]=useState(0);
  const [resumeAudio,setResumeAudio]=useState<(()=>Promise<unknown>)|null>(null);
  const screenRef=useRef(screen);screenRef.current=screen;
  const call=useRef<Call|null>(null);
  const transport=useRef<VideoTransport|null>(null);
  const preview=useRef<MediaStream|null>(null);
  const epoch=useRef(0);
  const mediaGeneration=useRef<string|null>(null);
  const local=useRef<HTMLDivElement>(null);
  const remote=useRef<HTMLDivElement>(null);
  const cleanup=useRef<Promise<unknown>>(Promise.resolve());
  const pending=useRef(false);
  const stopPreview=()=>{preview.current?.getTracks().forEach(t=>t.stop());preview.current=null;};
  const stopMedia=()=>{
    ++epoch.current;stopPreview();const active=transport.current;transport.current=null;mediaGeneration.current=null;
    if(active)cleanup.current=active.dispose();setResumeAudio(null);
  };
  const finish=(message?:string)=>{
    const ended=call.current;call.current=null;stopMedia();pending.current=false;setBusy(false);
    if(ended && !previewEnabled())void request('end',ended.id).catch(()=>undefined);
    setScreen(current=>message&&current?{...current,phase:'ended',message}:null);
  };
  const problem=(message:string)=>{finish(message);};

  const cameraPreview=async(contact:Contact)=>{
    const generation=++epoch.current;
    await cleanup.current;
    if(generation!==epoch.current)return;
    // Stop note recording and playback before asking for the same microphone.
    window.dispatchEvent(new Event('meewav:messaging-suspend'));
    document.querySelectorAll<HTMLMediaElement>('audio,video').forEach(media=>media.pause());
    setMuted(false);setCameraOff(false);setElapsed(0);setScreen({contact,phase:'prepare'});
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:720}},audio:{echoCancellation:true,noiseSuppression:true}});
      if(generation!==epoch.current){stream.getTracks().forEach(t=>t.stop());return;}
      preview.current=stream;setScreen({contact,phase:'preview'});
    }catch(error){
      if(generation!==epoch.current)return;
      setScreen({contact,phase:'error',message:error instanceof DOMException&&error.name==='NotAllowedError'
        ?'Autorise la caméra et le micro dans les paramètres de Meewav, puis réessaie.'
        :'La caméra ou le micro est indisponible. Ferme les autres applications qui les utilisent, puis réessaie.'});
    }
  };
  useEffect(()=>{
    if(!preview.current || !local.current)return;
    const element=document.createElement('video');element.autoplay=true;element.muted=true;element.playsInline=true;element.srcObject=preview.current;
    local.current.replaceChildren(element);void element.play().catch(()=>undefined);
    return()=>{element.pause();element.srcObject=null;element.remove();};
  },[screen?.phase]);

  const connect=async(value:Call)=>{
    if(mediaGeneration.current===value.id)return;
    mediaGeneration.current=value.id;
    const generation=++epoch.current;
    setScreen(current=>({contact:current?.contact||{id:value.conversationId,name:value.peerName},phase:'connecting'}));
    stopPreview();
    try{
      const {VideoTransport}=await import('./byteplus');
      if(generation!==epoch.current || !local.current || !remote.current)return;
      const rtc=new VideoTransport(value.id,local.current,remote.current,
        ()=>{if(generation===epoch.current)setScreen(current=>current&&({...current,phase:'connected'}));},
        message=>{if(generation===epoch.current)problem(message);},
        resume=>{if(generation===epoch.current)setResumeAudio(()=>resume);},!muted,!cameraOff);
      transport.current=rtc;await rtc.connect();
    }catch{if(generation===epoch.current)problem('Impossible d’établir la connexion vidéo. Tu peux rappeler.');}
  };
  const consume=(value:Call|null)=>{
    if(!value){if(call.current)finish('Appel terminé.');return;}
    if(call.current && call.current.id!==value.id)return;
    if(value.status==='ended'||value.status==='declined'||value.status==='missed'){
      if(call.current?.id===value.id){call.current=null;stopMedia();setBusy(false);pending.current=false;
        setScreen(current=>current&&({...current,phase:'ended',message:value.status==='declined'?'Appel refusé':value.status==='missed'?'Pas de réponse':'Appel terminé'}));}
      return;
    }
    if(!call.current && value.incoming){
      if(pending.current || preview.current || transport.current){void request('decline',value.id).catch(()=>undefined);return;}
      call.current=value;setScreen({contact:{id:value.conversationId,name:value.peerName},phase:'incoming'});
    }else call.current=value;
    if(value.status==='accepted')void connect(value);
  };
  const functions=useRef({finish,cameraPreview,consume});functions.current={finish,cameraPreview,consume};
  useEffect(()=>{
    const open=(event:Event)=>{
      const contact=(event as CustomEvent<Contact>).detail;
      if(!contact?.id || call.current || pending.current || transport.current)return;
      stopPreview();void functions.current.cameraPreview(contact);
    };
    const suspend=()=>functions.current.finish();
    const hidden=()=>{if(document.hidden)suspend();};
    window.addEventListener('meewav:video-call',open);
    // Separate native lifecycle event: preparing a call also pauses the composer.
    window.addEventListener('meewav:call-suspend',suspend);
    document.addEventListener('visibilitychange',hidden);
    return()=>{window.removeEventListener('meewav:video-call',open);window.removeEventListener('meewav:call-suspend',suspend);
      document.removeEventListener('visibilitychange',hidden);functions.current.finish();};
  },[]);
  useEffect(()=>{
    if(previewEnabled() || !userId)return;
    let disposed=false;let syncing=false;let failedAt=0;
    const sync=async()=>{
      if(disposed||syncing||document.hidden||pending.current)return;
      syncing=true;
      const previousCallId=call.current?.id;const generation=epoch.current;
      try{const value=await request('sync',previousCallId);if(!disposed&&generation===epoch.current&&previousCallId===call.current?.id&&!pending.current){failedAt=0;functions.current.consume(value);}}
      catch{if(call.current){failedAt ||= Date.now();if(Date.now()-failedAt>12000)functions.current.finish('Connexion perdue. L’appel a été arrêté.');}}
      finally{syncing=false;}
    };
    const channel=supabase.channel(`messaging:calls:${userId}`,{config:{private:true}})
      .on('broadcast',{event:'call_changed'},()=>void sync());
    void supabase.realtime.setAuth().then(()=>{if(!disposed)channel.subscribe(()=>void sync());}).catch(()=>undefined);
    const interval=window.setInterval(sync,2500);void sync();
    return()=>{disposed=true;window.clearInterval(interval);void supabase.removeChannel(channel);};
  },[userId]);
  useEffect(()=>{
    if(screen?.phase!=='connected')return;
    const start=Date.now();const timer=window.setInterval(()=>setElapsed(Math.floor((Date.now()-start)/1000)),1000);
    return()=>window.clearInterval(timer);
  },[screen?.phase]);
  useEffect(()=>{
    if(screen?.phase!=='connecting')return;
    const timeout=window.setTimeout(()=>functions.current.finish('La connexion vidéo n’a pas abouti. Réessaie.'),30_000);
    return()=>window.clearTimeout(timeout);
  },[screen?.phase]);
  useEffect(()=>{
    if(!nativeVoiceEnabled())return;
    const state=screen?.phase||'ended';
    location.assign(`https://appassets.androidplatform.net/native/call-audio?state=${state}`);
  },[screen?.phase]);
  useEffect(()=>()=>{if(nativeVoiceEnabled())location.assign('https://appassets.androidplatform.net/native/call-audio?state=ended');},[]);
  useEffect(()=>{
    if(!screen)return;
    const before=document.body.style.overflow;document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=before;};
  },[!!screen]);

  const dial=async()=>{
    if(!screen || previewEnabled() || pending.current)return;
    const generation=epoch.current;
    pending.current=true;setBusy(true);
    try{
      const value=await request('start',undefined,screen.contact.id);
      if(generation!==epoch.current){if(value)void request('end',value.id).catch(()=>undefined);return;}
      if(!value)throw Error('Cet appel n’a pas pu être lancé.');
      call.current=value;setScreen({...screen,phase:'ringing'});
    }catch(error){if(generation===epoch.current){stopMedia();setScreen({...screen,phase:'error',message:error instanceof Error?error.message:'Appel indisponible'});}}
    finally{pending.current=false;setBusy(false);}
  };
  const accept=async()=>{
    const value=call.current;if(!value||pending.current)return;
    pending.current=true;setBusy(true);
    setScreen(current=>current&&({...current,phase:'prepare'}));
    const generation=++epoch.current;
    try{
      window.dispatchEvent(new Event('meewav:messaging-suspend'));
      const media=await navigator.mediaDevices.getUserMedia({audio:true,video:{facingMode:'user'}});
      media.getTracks().forEach(track=>track.stop());
      if(generation!==epoch.current)return;
      const accepted=await request('accept',value.id);
      if(generation!==epoch.current){if(accepted)void request('end',value.id);return;}
      if(accepted)consume(accepted);
    }catch{if(generation===epoch.current)problem('Caméra ou micro indisponible. Autorise leur accès puis rappelle.');}
    finally{pending.current=false;setBusy(false);}
  };
  const decline=()=>{const value=call.current;call.current=null;if(value)void request('decline',value.id).catch(()=>undefined);finish();};
  const control=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);try{await action();}catch{problem('Impossible de modifier le périphérique. Réessaie.');}finally{setBusy(false);}};
  if(!screen)return null;
  const live=screen.phase==='connected'||screen.phase==='connecting';
  const hasMedia=live||screen.phase==='preview'||screen.phase==='ringing';
  const status=screen.message||({prepare:'Ouverture de la caméra…',preview:previewEnabled()?'Aperçu caméra · Aucun appel envoyé':'Prêt à appeler',incoming:'Appel vidéo entrant',ringing:'Appel en cours…',connecting:'Connexion vidéo…',connected:`${Math.floor(elapsed/60)}:${String(elapsed%60).padStart(2,'0')}`,ended:'Appel terminé',error:'Appel indisponible'}[screen.phase]);
  return createPortal(<section className={`mw-video-call is-${screen.phase}`} role="dialog" aria-modal="true" aria-label={`Appel vidéo avec ${screen.contact.name}`}>
    <div ref={remote} className="mw-video-call__remote"/>
    <header><span><Video size={18}/> Appel vidéo</span><button aria-label="Fermer l’appel vidéo" onClick={()=>finish()}><X/></button></header>
    <div className="mw-video-call__identity">{screen.contact.avatar?<img src={screen.contact.avatar} alt=""/>:<UserRound size={46}/>}
      <h2>{screen.contact.name}</h2><p role="status">{status}</p></div>
    <div ref={local} className={`mw-video-call__local${cameraOff?' is-off':''}`} aria-label="Ta caméra"/>
    {resumeAudio&&<button className="mw-video-call__resume" onClick={()=>void resumeAudio().then(()=>setResumeAudio(null)).catch(()=>undefined)}><Volume2/> Activer le son</button>}
    <footer>
      {hasMedia&&<div className="mw-video-call__controls">
        <button disabled={busy||screen.phase==='connecting'} aria-label={muted?'Activer le micro':'Couper le micro'} aria-pressed={muted} onClick={()=>void control(async()=>{
          if(transport.current)await transport.current.microphone(muted);else preview.current?.getAudioTracks().forEach(t=>t.enabled=muted);setMuted(!muted);
        })}>{muted?<MicOff/>:<Mic/>}<span>Micro</span></button>
        <button disabled={busy||screen.phase==='connecting'} aria-label={cameraOff?'Activer la caméra':'Couper la caméra'} aria-pressed={cameraOff} onClick={()=>void control(async()=>{
          if(transport.current)await transport.current.camera(cameraOff);else preview.current?.getVideoTracks().forEach(t=>t.enabled=cameraOff);setCameraOff(!cameraOff);
        })}>{cameraOff?<VideoOff/>:<Video/>}<span>Caméra</span></button>
        {live&&<button disabled={busy||cameraOff||screen.phase==='connecting'} aria-label="Changer de caméra" onClick={()=>void control(async()=>{await transport.current?.flip();})}><SwitchCamera/><span>Retourner</span></button>}
      </div>}
      {screen.phase==='incoming'?<div className="mw-video-call__answer"><button className="is-hangup" onClick={decline}><PhoneOff/> Refuser</button><button className="is-primary" disabled={busy} onClick={()=>void accept()}><Video/> {busy?'Autorisation…':'Accepter'}</button></div>
      :screen.phase==='preview'?<><button className="is-primary" disabled={busy||previewEnabled()} onClick={()=>void dial()}><Phone/> Appeler</button>{previewEnabled()&&<p>Les contacts de démonstration ne peuvent pas répondre. Connecte deux vrais comptes pour appeler.</p>}</>
      :hasMedia?<button className="is-hangup" aria-label="Raccrocher" onClick={()=>finish()}><PhoneOff/> Raccrocher</button>
      :screen.phase==='error'?<button className="is-primary" onClick={()=>void cameraPreview(screen.contact)}>Réessayer</button>
      :screen.phase==='ended'?<button onClick={()=>finish()}>Retour à la conversation</button>:null}
    </footer>
  </section>,document.body);
}
