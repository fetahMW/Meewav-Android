import {useEffect,useState} from 'react';
import {nativeViewerEnabled} from './NativeViewerSurfaces';
import NativeViewerVideo from './NativeViewerVideo';

/** Shared native Rooms listening via the iOS BytePlus token contract; Classe owns a private floor. */
export default function WaveLiveAudio({roomId}:{roomId:string}) {
 const [state,setState]=useState({active:false,busy:false,text:'Audio live déconnecté'});
 const command=(action:string)=>location.assign('/native/wave-audio?action='+action+'&roomId='+encodeURIComponent(roomId));
 useEffect(()=>{
  const update=(event:Event)=>{const detail=(event as CustomEvent).detail;if(detail?.action==='wave-audio')setState(detail.data);};
  window.addEventListener('meewav:native-viewer-action',update);
  if(nativeViewerEnabled())command('start');
  return()=>{window.removeEventListener('meewav:native-viewer-action',update);if(nativeViewerEnabled())command('stop');};
 },[roomId]);
 if(!nativeViewerEnabled())return null;
 return <><NativeViewerVideo roomId={roomId}/>{!state.active?<div role="status" style={{padding:'4px 12px',display:'flex',alignItems:'center',gap:8,fontSize:12}}>
  <span style={{flex:1}}>{state.text}</span>
  <button type="button" onClick={()=>{if(state.active||state.busy){command('stop');setState({active:false,busy:false,text:'Audio live déconnecté'});}else command('start');}}>
   {state.active||state.busy?'Déconnecter':'Écouter le live'}
  </button>
 </div>:null}</>;
}
