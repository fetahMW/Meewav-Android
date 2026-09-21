import { DEFAULT_CAGE_LAUNCH } from "../launch/cageLaunch";
import { createRoomToolsFixture } from "./roomTools.fixtures";
import { cageDemoGuestCandidates } from "./cageCompetition.demo";
import { applyCageCompetitionCommand, initializeCageCompetition, nextCageMatch } from "./cageCompetition";
import type { CageCompetitionAction, CageCompetitionPayload } from "./cageCompetition.types";
import type { RoomToolsState } from "./roomTools.types";

export const CAGE_DEMO_BREAK_MS = 2000;
export function simulationCommand(state: RoomToolsState, action: CageCompetitionAction, payload: CageCompetitionPayload = {}, actor = "preview-host") {
  applyCageCompetitionCommand(state, {type:"cage.competition.command",action,payload,expectedRevision:state.revision,expectedMatchId:state.cage?.runtime?.activeMatchId ?? undefined,expectedStepIndex:state.cage?.runtime?.matches.find(m=>m.id===state.cage?.runtime?.activeMatchId)?.stepIndex,idempotencyKey:crypto.randomUUID()}, actor);
  state.revision++;
}
export type CageSimulationFormat = "tournament" | "championship" | "open-mic" | "open-mic-battle";
export function startCageViewerSimulation(format: CageSimulationFormat = "tournament") {
  const state = createRoomToolsFixture("cage", "isolated-viewer-tournament");
  const entrants = cageDemoGuestCandidates().slice(0,8).map(person => ({...person,person:{...person.person,camera:"ready" as const,microphone:"ready" as const},registered:true,present:true,eligible:true,guestStatus:"backstage" as const,readiness:{camera:true,microphone:true,connection:true,mixer:true,permissions:true}}));
  if (entrants.length !== 8) throw new Error("La simulation nécessite 8 artistes.");
  initializeCageCompetition(state.cage!, {...structuredClone(DEFAULT_CAGE_LAUNCH),title:"Rencontre des huit talents",format:format === "open-mic" ? "championship" : format,participantCount:8,rosterMode:"first-eligible",rules:{...DEFAULT_CAGE_LAUNCH.rules,performanceMode:"successive",rounds:1,passageDurationSeconds:2,votingDurationSeconds:4}}, entrants);
  simulationCommand(state,"bracket.generate",{mode:"first-eligible"});
  // Demo Open Mic uses four independent face-to-face duels, as on Android host.
  if(format === "open-mic") state.cage!.runtime!.matches = state.cage!.runtime!.matches.filter(m=>m.round===1);
  simulationCommand(state,"bracket.lock");
  advanceCageViewerSimulation(state);
  return state;
}
export function advanceCageViewerSimulation(state: RoomToolsState) {
  const runtime = state.cage!.runtime!;
  if (runtime.status === "COMPLETED") return;
  const match = runtime.matches.find(item => item.id === runtime.activeMatchId);
  if (!match || match.status === "RESOLVED" || match.status === "CLOSED") {
    const next = nextCageMatch(runtime);
    if (!next) return;
    simulationCommand(state,"regie.prepare",{matchId:next.id});
    simulationCommand(state,"regie.promote",{matchId:next.id});
    simulationCommand(state,"match.start");
  } else if (match.status === "IN_PROGRESS") {
    simulationCommand(state,"match.end-step");
    if(match.status === "ON_STAGE") { simulationCommand(state,"match.start"); return; }
    simulationCommand(state,"vote.open");
    const a = match.order % 2 ? 43 + match.order : 25;
    const b = match.order % 2 ? 24 : 49 + match.order;
    for (let i=0;i<a+b;i++) simulationCommand(state,"vote.cast",{choice:i<a?"A":"B"},`public-${match.id}-${i}`);
  } else if (match.status === "VOTING") simulationCommand(state,"vote.close");
}
