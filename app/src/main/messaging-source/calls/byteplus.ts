import BytePlusRTC, { RoomProfileType, type IRTCEngine } from '@byteplus/rtc';
import {supabase} from '../runtime';

type Access = {appId:string;token:string;identity:string;roomId:string;peerId:string;kind:'audio'|'video';expiresAt:number};
async function access(callId:string):Promise<Access> {
  const {data,error}=await supabase.functions.invoke('messaging-call-token',{body:{callId}});
  if(error || typeof data?.appId!=='string' || !/^[A-Za-z0-9_-]{1,128}$/.test(data.appId)
    || typeof data?.token!=='string' || !data.token.startsWith(`001${data.appId}`)
    || data.roomId!==`mw-call-${callId}` || !['audio','video'].includes(data.kind)
    || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(data.identity)
    || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(data.peerId)
    || data.identity===data.peerId || !Number.isFinite(data.expiresAt) || data.expiresAt*1000<=Date.now()) throw Error('Le service média ne peut pas autoriser cet appel.');
  return data;
}
export class VideoTransport {
  private engine?:IRTCEngine;
  private disposed=false;
  private timer?:number;
  private cameraIndex=0;
  private connection?:Promise<void>;
  private disposal?:Promise<void>;
  private stage="credentials";
  private videoAllowed=false;
  private microphoneEpoch=0;
  private cameraEpoch=0;
  constructor(private callId:string,private local:HTMLElement,private remote:HTMLElement,
    private ready:()=>void,private failed:(message:string)=>void,
    private autoplay:(resume:()=>Promise<unknown>)=>void,private audioEnabled=true,private videoEnabled=true) {}
  connect(){if(this.disposed)return Promise.resolve();return this.connection??=this.connectInternal().catch(error=>{
    console.warn('[MeeWav RTC]',JSON.stringify({stage:this.stage,name:error instanceof Error?error.name:'UnknownError',code:typeof error?.code==='number'?error.code:undefined}));throw error;
  });}
  private async connectInternal() {
    const credentials=await access(this.callId);
    this.videoAllowed=credentials.kind==='video';
    if(this.disposed)return;
    this.stage='engine';
    const engine=this.engine=BytePlusRTC.createEngine(credentials.appId);
    engine.on('onUserJoined',({userInfo})=>{
      if(!this.disposed&&userInfo.userId===credentials.peerId)this.ready();
    });
    engine.on('onUserPublishStream',({userId,mediaType})=>{
      if(this.disposed || userId!==credentials.peerId)return;
      if(this.videoAllowed&&(mediaType===2||mediaType===3))engine.setRemoteVideoPlayer(0,{userId,renderDom:this.remote});
      this.ready();
    });
    engine.on('onUserLeave',({userInfo})=>{if(userInfo.userId===credentials.peerId && !this.disposed)this.failed('Ton contact a quitté l’appel.');});
    engine.on('onError',()=>{if(!this.disposed)this.failed('La connexion vidéo a été interrompue.');});
    engine.on('onAutoplayFailed',event=>{if(!this.disposed)this.autoplay(()=>engine.play(event.userId||undefined,event.kind==='audio'?1:2,event.streamIndex));});
    this.stage='capture-config';
    await engine.setVideoCaptureConfig({width:{ideal:1280},height:{ideal:720},frameRate:{ideal:30},facingMode:'user'});
    if(this.disposed)return;
    this.stage='audio-capture';
    if(this.audioEnabled)await engine.startAudioCapture();
    if(this.disposed)return;
    this.stage='video-capture';
    if(this.videoAllowed&&this.videoEnabled)await engine.startVideoCapture();
    if(this.disposed)return;
    engine.setLocalVideoPlayer(0,{renderDom:this.local});
    this.stage='encoder-config';
    await engine.setVideoEncoderConfig({width:1280,height:720,frameRate:30,maxKbps:1800});
    if(this.disposed)return;
    this.stage='join-room';
    await engine.joinRoom(credentials.token,credentials.roomId,{userId:credentials.identity},{
      roomProfileType:RoomProfileType.chat,isAutoPublish:true,isAutoSubscribeAudio:true,isAutoSubscribeVideo:this.videoAllowed,
    });
    if(this.disposed)return;
    let refreshing=false;
    this.timer=window.setInterval(async()=>{
      if(refreshing || this.disposed)return;
      refreshing=true;
      try {const next=await access(this.callId);
        if(next.appId!==credentials.appId||next.identity!==credentials.identity||next.peerId!==credentials.peerId||next.kind!==credentials.kind)throw Error('call_identity_changed');
        if(!this.disposed)await engine.updateToken(next.token);}
      catch {if(!this.disposed)this.failed('L’autorisation de l’appel a expiré.');}
      finally {refreshing=false;}
    },25000);
  }
  async microphone(enabled:boolean){const engine=this.engine,epoch=++this.microphoneEpoch;if(!engine||this.disposed)return;
    await(enabled?engine.startAudioCapture():engine.stopAudioCapture());if(enabled&&(this.disposed||epoch!==this.microphoneEpoch))await engine.stopAudioCapture();}
  async camera(enabled:boolean){const engine=this.engine,epoch=++this.cameraEpoch;if(!engine||this.disposed||!this.videoAllowed)return;
    await(enabled?engine.startVideoCapture():engine.stopVideoCapture());if(enabled&&(this.disposed||epoch!==this.cameraEpoch))await engine.stopVideoCapture();}
  async flip(){const devices=await BytePlusRTC.enumerateVideoCaptureDevices();if(devices.length<2)return;
    this.cameraIndex=(this.cameraIndex+1)%devices.length;await this.engine?.setVideoCaptureDevice(devices[this.cameraIndex].deviceId);}
  dispose():Promise<void>{
    if(this.disposal)return this.disposal;this.disposed=true;window.clearInterval(this.timer);
    if(this.engine)void Promise.allSettled([this.engine.stopAudioCapture(),this.engine.stopVideoCapture()]);
    return this.disposal=this.disposeInternal();
  }
  private async disposeInternal(){
    await this.connection?.catch(()=>undefined);
    const engine=this.engine;this.engine=undefined;
    if(engine){engine.removeAllListeners();await Promise.allSettled([engine.stopAudioCapture(),engine.stopVideoCapture(),engine.leaveRoom()]);BytePlusRTC.destroyEngine(engine);}
  }
}
