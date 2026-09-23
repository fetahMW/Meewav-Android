import {useEffect} from 'react';
import {nativeViewerEnabled} from './NativeViewerSurfaces';

/** Keep RTC video under the web controls, using the same participant identity as the server. */
export default function NativeViewerVideo({roomId}:{roomId:string}) {
 useEffect(()=>{
  if(!nativeViewerEnabled())return;
  let previous='',timer=0;
  const paths=new Set<HTMLElement>();
  const style=document.createElement('style');
  style.textContent='.android-rtc-path{background:transparent!important;backdrop-filter:none!important}.android-rtc-tile>*{visibility:hidden!important}';
  document.head.append(style);
  const update=()=>{
   const nextPaths=new Set<HTMLElement>();
   const tiles=[...document.querySelectorAll<HTMLElement>('.android-room-viewer [data-rtc-user]')].filter(el=>el.getClientRects().length>0).map(el=>{
    el.classList.add('android-rtc-tile');
    for(let node:HTMLElement|null=el;node;node=node.parentElement)nextPaths.add(node);
    const r=el.getBoundingClientRect();
    return {id:el.dataset.rtcUser,x:r.x,y:r.y,width:r.width,height:r.height,volume:Number(el.dataset.rtcVolume)||0};
   });
   paths.forEach(el=>{if(!nextPaths.has(el))el.classList.remove('android-rtc-path')});
   paths.clear();nextPaths.forEach(el=>{el.classList.add('android-rtc-path');paths.add(el)});
   const data=JSON.stringify({roomId,viewport:innerWidth,tiles,volume:Math.max(0,...tiles.map(t=>t.volume))});
   if(data!==previous){previous=data;location.assign('/native/viewer-video?data='+encodeURIComponent(data))}
  };
  // Geometry is independent of React rendering, scrolling and animated collapse.
  timer=window.setInterval(update,80);update();
  return()=>{
   clearInterval(timer);style.remove();paths.forEach(el=>el.classList.remove('android-rtc-path'));
   document.querySelectorAll('.android-rtc-tile').forEach(el=>el.classList.remove('android-rtc-tile'));
   location.assign('/native/viewer-video?data='+encodeURIComponent(JSON.stringify({viewport:innerWidth,tiles:[]})));
  };
 },[roomId]);
 return null;
}
