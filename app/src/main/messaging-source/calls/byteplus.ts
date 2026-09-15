import BytePlusRTC, { RoomProfileType, type IRTCEngine } from '@byteplus/rtc';
import {supabase} from '../runtime';

type Access = {appId:string;token:string;identity:string;roomId:string;peerId:string};
async function access(callId:string):Promise<Access> {
  const {data,error}=await supabase.functions.invoke('messaging-call-token',{body:{callId}});
  if(error || !data?.token || !data?.appId) throw Error('Le service vidéo ne peut pas autoriser cet appel.');
  return data;
}
export class VideoTransport {
  private engine?:IRTCEngine;
  private disposed=false;
  private timer?:number;
  private cameraIndex=0;
  private connection?:Promise<void>;
  constructor(private callId:string,private local:HTMLElement,private remote:HTMLElement,
    private ready:()=>void,private failed:(message:string)=>void,
    private autoplay:(resume:()=>Promise<unknown>)=>void,private audioEnabled=true,private videoEnabled=true) {}
  connect(){return this.connection=this.connectInternal();}
  private async connectInternal() {
    const credentials=await access(this.callId);
    if(this.disposed)return;
    const engine=this.engine=BytePlusRTC.createEngine(credentials.appId);
    engine.on('onUserJoined',({userInfo})=>{
      if(!this.disposed&&userInfo.userId===credentials.peerId)this.ready();
    });
    engine.on('onUserPublishStream',({userId})=>{
      if(this.disposed || userId!==credentials.peerId)return;
      engine.setRemoteVideoPlayer(0,{userId,renderDom:this.remote});
      this.ready();
    });
    engine.on('onUserLeave',({userInfo})=>{if(userInfo.userId===credentials.peerId && !this.disposed)this.failed('Ton contact a quitté l’appel.');});
    engine.on('onError',()=>{if(!this.disposed)this.failed('La connexion vidéo a été interrompue.');});
    engine.on('onAutoplayFailed',({resume})=>{if(!this.disposed)this.autoplay(resume);});
    await engine.setVideoCaptureConfig({width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30},facingMode:'user'});
    if(this.disposed)return;
    if(this.audioEnabled)await engine.startAudioCapture();
    if(this.disposed)return;
    if(this.videoEnabled)await engine.startVideoCapture();
    if(this.disposed)return;
    engine.setLocalVideoPlayer(0,{renderDom:this.local});
    await engine.setVideoEncoderConfig({width:1280,height:720,frameRate:30,maxKbps:1800});
    if(this.disposed)return;
    await engine.joinRoom(credentials.token,credentials.roomId,{userId:credentials.identity},{
      roomProfileType:RoomProfileType.chat,isAutoPublish:true,isAutoSubscribeAudio:true,isAutoSubscribeVideo:true,
    });
    if(this.disposed)return;
    let refreshing=false;
    this.timer=window.setInterval(async()=>{
      if(refreshing || this.disposed)return;
      refreshing=true;
      try {const next=await access(this.callId);if(!this.disposed)await engine.updateToken(next.token);}
      catch {if(!this.disposed)this.failed('L’autorisation de l’appel a expiré.');}
      finally {refreshing=false;}
    },25000);
  }
  async microphone(enabled:boolean){if(this.engine)await (enabled?this.engine.startAudioCapture():this.engine.stopAudioCapture());}
  async camera(enabled:boolean){if(this.engine)await (enabled?this.engine.startVideoCapture():this.engine.stopVideoCapture());}
  async flip(){const devices=await BytePlusRTC.enumerateVideoCaptureDevices();if(devices.length<2)return;
    this.cameraIndex=(this.cameraIndex+1)%devices.length;await this.engine?.setVideoCaptureDevice(devices[this.cameraIndex].deviceId);}
  async dispose(){
    if(this.disposed)return;this.disposed=true;window.clearInterval(this.timer);
    await this.connection?.catch(()=>undefined);
    const engine=this.engine;this.engine=undefined;
    if(engine){engine.removeAllListeners();await Promise.allSettled([engine.stopAudioCapture(),engine.stopVideoCapture(),engine.leaveRoom()]);BytePlusRTC.destroyEngine(engine);}
  }
}
