import {useEffect,useState} from 'react';
import {nativeViewerEnabled} from './NativeViewerSurfaces';
import NativeViewerVideo from './NativeViewerVideo';

/** Native BytePlus playback and explicit microphone consent after a server floor grant. */
export default function WaveLiveAudio({roomId}:{roomId:string}) {
 const [state,setState]=useState({active:false,busy:false,text:'Audio live déconnecté',canSpeak:false,speaking:false});
 const command=(action:string)=>location.assign('/native/wave-audio?action='+action+'&roomId='+encodeURIComponent(roomId));
 useEffect(()=>{
  const update=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.action==='wave-audio')setState(detail.data);};
  window.addEventListener('meewav:native-viewer-action',update);
  if(nativeViewerEnabled())command('start');
  return()=>{window.removeEventListener('meewav:native-viewer-action',update);if(nativeViewerEnabled())command('stop');};
 },[roomId]);
 if(!nativeViewerEnabled())return null;
 return <><NativeViewerVideo roomId={roomId}/>{!state.active||state.canSpeak||state.speaking?<div role="status" style={{padding:'4px 12px',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
  <span style={{flex:1}}>{state.text}</span>
  {state.active&&(state.canSpeak||state.speaking)?<button type="button" disabled={state.busy} onClick={()=>command(state.speaking?'mute':'speak')}>{state.speaking?'Couper mon micro':'Activer mon micro'}</button>:<button type="button" onClick={()=>{if(state.active||state.busy){command('stop');setState({active:false,busy:false,text:'Audio live déconnecté',canSpeak:false,speaking:false});}else command('start');}}>
   {state.active||state.busy?'Déconnecter':'Écouter le live'}
  </button>}
 </div>:null}</>;
}
