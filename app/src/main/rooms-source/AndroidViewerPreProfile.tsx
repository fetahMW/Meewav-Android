import PortraitPreProfileDialog from "../shared-ui/PortraitPreProfileDialog";
import { useEffect } from "react";
import type { RoomPerson } from "./viewer-web/src/features/rooms/tools/roomTools.types";
export default function AndroidViewerPreProfile({person,onClose,returnFocusTo,closeRequested}: {
 person:RoomPerson;source:"demo"|"live";onClose:()=>void;returnFocusTo:HTMLElement|null;
 boundsElement?:HTMLElement|null;topBoundaryElement?:HTMLElement|null;bottomBoundaryElement?:HTMLElement|null;closeRequested?:boolean;
}) {
 useEffect(() => { if(closeRequested) onClose(); }, [closeRequested, onClose]);
 return <PortraitPreProfileDialog person={person} trigger={returnFocusTo} onClose={onClose} onOffer={() => {
   onClose(); window.dispatchEvent(new CustomEvent("meewav:offer-gift", {detail:person}));
 }}/>;
}
