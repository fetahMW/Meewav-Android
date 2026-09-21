import {startCageViewerSimulation,advanceCageViewerSimulation,simulationCommand} from '../app/src/main/rooms-source/viewer-web/src/features/rooms/tools/cageViewerSimulation';
for(const kind of ['tournament','championship','open-mic','open-mic-battle'] as const){
 const state=startCageViewerSimulation(kind);let ticks=0,votes=0;
 while(state.cage!.runtime!.status!=='COMPLETED'&&ticks++<200){
  const rt=state.cage!.runtime!,m=rt.matches.find(m=>m.id===rt.activeMatchId)!;
  if(m.status==='VOTING'){simulationCommand(state,'vote.cast',{choice:'A'},'preview-viewer');votes++;}
  advanceCageViewerSimulation(state);
 }
 const rt=state.cage!.runtime!;
 if(rt.status!=='COMPLETED')throw Error(kind+' blocked '+rt.matches.find(m=>m.id===rt.activeMatchId)?.status);
 if(rt.participants.length!==8)throw Error('Wrong roster');
 console.log(kind,rt.status,'matches',rt.matches.length,'votes',votes);
}
