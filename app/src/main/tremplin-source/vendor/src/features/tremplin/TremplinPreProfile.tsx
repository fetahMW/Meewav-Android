import PortraitPreProfileDialog from "../../../../../shared-ui/PortraitPreProfileDialog";
import type { TremplinArtist } from "./tremplinArtistData";
export default function TremplinPreProfile({artist,onClose}: {artist:TremplinArtist;anchor:{x:number;y:number;clearance:number};followed:boolean;onClose:()=>void;onOpenProfile:()=>void;onFollow:(id:string)=>void;onContact:()=>void}) {
 return <PortraitPreProfileDialog person={{id:artist.profileId || artist.id,name:artist.name,avatarUrl:artist.portrait,role:artist.exactProfession ?? artist.disciplines.join(" · "),gradeLevel:artist.gradeLevel}} trigger={document.activeElement as HTMLElement|null} onClose={onClose}/>;
}
