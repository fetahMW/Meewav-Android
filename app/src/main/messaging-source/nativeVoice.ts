type VoiceEvent={id:string;phase:'started'|'ready'|'error';url?:string;durationMs?:number;message?:string};
type VoiceResult={file:File;durationMs:number};
type Capture={id:string;started:()=>void;cancelled:()=>void;failed:(error:Error)=>void;ready:(value:VoiceResult)=>void};
let capture:Capture|null=null;
const send=(action:string,id:string)=>location.assign(`https://appassets.androidplatform.net/native/voice-${action}?id=${id}`);
(window as any).meewavVoice={
  async event(value:VoiceEvent){
    const current=capture;
    if(!current||current.id!==value.id){if(value.phase==='ready')send('release',value.id);return;}
    if(value.phase==='started'){current.started();return;}
    if(value.phase==='error'){capture=null;current.failed(new Error(value.message||'Micro indisponible'));return;}
    try{
      const response=await fetch(value.url!);if(!response.ok)throw Error('Le vocal ne peut pas être récupéré.');
      const blob=await response.blob();
      if(capture!==current)return;
      capture=null;current.ready({file:new File([blob],`note-vocale-${Date.now()}.m4a`,{type:'audio/mp4'}),durationMs:value.durationMs!});
    }catch{if(capture===current){capture=null;current.failed(new Error('Le vocal ne peut pas être récupéré. Réessaie.'));}}
    finally{send('release',value.id);}
  }
};
export function startNativeVoice(ready:(result:VoiceResult)=>void,failed:(error:Error)=>void):Promise<void>{
  cancelNativeVoice();
  return new Promise((resolve,reject)=>{
    const id=crypto.randomUUID();
    capture={id,started:resolve,cancelled:()=>reject(new DOMException('Enregistrement annulé','AbortError')),ready,failed:error=>{reject(error);failed(error);}};send('start',id);
  });
}
export function stopNativeVoice(){if(capture)send('stop',capture.id);}
export function cancelNativeVoice(){if(capture){const current=capture;capture=null;current.cancelled();send('cancel',current.id);}}
