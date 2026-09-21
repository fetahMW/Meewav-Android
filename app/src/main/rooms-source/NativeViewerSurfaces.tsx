import {useEffect} from 'react';

export const nativeViewerEnabled=()=>location.hostname==='appassets.androidplatform.net';
export function viewerNativeReply(data:Record<string,unknown>) {
 if(nativeViewerEnabled()) location.assign('/native/viewer-result?data='+encodeURIComponent(JSON.stringify(data)));
}

/** Only geometry crosses this bridge. Chat and room permissions remain in the web model. */
export default function NativeViewerSurfaces({room,name}:{room:string;name:string}) {
 useEffect(()=>{
  if(!nativeViewerEnabled())return;
  document.documentElement.classList.add('android-native-viewer-controls');
  let last='',timer=0;
  const update=()=>{
   timer=0;
   const mixer=document.querySelector<HTMLElement>('.android-room-viewer .place-studio-panel.is-mixer .place-studio-panel__content');
   const composer=document.querySelector<HTMLElement>('.android-room-viewer .place-studio-panel.is-chat .place-chat__composer');
   const overlay=[...document.querySelectorAll<HTMLElement>('[role="dialog"]:not([aria-hidden="true"])')].some(el=>{
    const style=getComputedStyle(el),rect=el.getBoundingClientRect();
    return style.visibility!=='hidden'&&style.display!=='none'&&Number(style.opacity)>0&&rect.width>0&&rect.height>0&&rect.bottom>0&&rect.top<innerHeight&&rect.right>0&&rect.left<innerWidth;
   });
   const target=document.fullscreenElement||overlay?null:mixer??composer;
   const bounds=target?.getBoundingClientRect();
   const data={room,name,mode:target===mixer&&target?'mixer':target?'composer':'none',viewport:innerWidth,
    x:bounds?.x??0,y:bounds?.y??0,width:bounds?.width??0,height:bounds?.height??0};
   const next=JSON.stringify(data);
   if(next!==last){last=next;location.assign('/native/viewer-controls?data='+encodeURIComponent(next));}
  };
  const schedule=()=>{if(!timer)timer=window.setTimeout(update,60)};
  const observer=new MutationObserver(schedule);
  observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','style','aria-hidden']});
  window.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);
  update();
  return()=>{
   observer.disconnect();clearTimeout(timer);window.removeEventListener('resize',schedule);document.removeEventListener('fullscreenchange',schedule);
   document.documentElement.classList.remove('android-native-viewer-controls');
   location.assign('/native/viewer-controls?data='+encodeURIComponent(JSON.stringify({room:'',mode:'none'})));
  };
 },[room,name]);
 return null;
}
