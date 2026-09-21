import type { PlaceParticipantVideoSourceDto } from "./place.types";
// Original audio/video battle pool used by the Android host (WaveGuestVideo.kt).
const CLIPS=["akamalaime","naylil","iso","chil-p","snooper","rnueve","fenvo-2","la-2","dwrt","r-keto","fenvo","chaka","heptys"];
export function cageDemoMedia(profileId:string,side:"A"|"B",_varied:boolean):PlaceParticipantVideoSourceDto {
 const known:Record<string,number>={naya:0,keo:1,solen:2,azur:3};
 const suffix=Number.parseInt(profileId.slice(-6),10);
 let hash=0;for(const char of profileId)hash=(Math.imul(hash,31)+char.charCodeAt(0))|0;
 const index=known[profileId] ?? (Number.isFinite(suffix)?Math.max(0,suffix-1):(hash&0x7fffffff));
 const clip=CLIPS[index%CLIPS.length];
 return {id:`cage-rapper-${profileId}-${clip}`,type:"portrait_composite",aspectRatio:"9:16",transport:"file",videoUrl:`/media/cage-demo/${clip}.mp4`};
}
