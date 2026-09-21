import {projectClasse,executeClasse} from './classroom/classroomIosAdapter';
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabaseClient";

import { normalizeWaveState } from "./waveTools.domain";
import {
  commandAllowed,

  reduceCommand,
  type RoomToolsRealtimeSubscription,
  type RoomToolsRepository,
} from "./roomTools.service";
import type { RoomActorRole, RoomToolsCommand, RoomToolsState, SpecializedRoomId } from "./roomTools.types";

type RpcResult<T> = { data: T | null; error: { code?: string; message?: string } | null };

function isMissingContract(error: { code?: string; message?: string } | null) {
  return Boolean(error && (
    error.code === "PGRST202"
    || error.code === "42883"
    || error.code === "42P01"
    || /schema cache|does not exist|could not find the function/i.test(error.message ?? "")
  ));
}

function commandPayload(command: RoomToolsCommand) {
  const { type: _type, ...payload } = command;
  if (command.type === "wave.submission.add") return command.submission;
  if (command.type === "loge.request.join") return { kind: command.kind };
  if (command.type === "loge.request.cancel") return { momentId: command.momentId };
  if (command.type === "loge.question.add") return { text: command.question.text };
  if (command.type === "classe.question.add") return { text: command.question.text.trim() };
  if (command.type === "classe.question.support") return { questionId: command.questionId };
  return payload;
}

function isControl(role: RoomActorRole) {
  return role === "host" || role === "regisseur" || role === "teacher";
}

export class SupabaseRoomToolsRepository implements RoomToolsRepository {


  constructor(private readonly client: SupabaseClient = supabase) {}

  private async fallbackProjection(_roomType: SpecializedRoomId, _roomId: string, _role: RoomActorRole, _accountId: string): Promise<RoomToolsState> {
    throw new Error("room_specialized_contract_unavailable");
  }

  private async fallbackExecute(_roomType: SpecializedRoomId, _roomId: string, _role: RoomActorRole, _command: RoomToolsCommand, _accountId?: string): Promise<RoomToolsState> {
    throw new Error("room_specialized_contract_unavailable");
  }
  private async projected(roomType: SpecializedRoomId, roomId: string, role: RoomActorRole, accountId: string) {
    if(roomType === "classe") return projectClasse(this.client,roomId,isControl(role));
    // A live Wave is never projected from the legacy whole-state JSONB store.
    // Its protected assets, votes and Beat transitions belong to the
    // normalized Wave repository and its append-only recovery stream.
    if (roomType === "wave") throw new Error("wave_normalized_repository_required");
    if (roomType === "cage") {
      const result = await this.client.rpc("rooms_get_cage_state_v1", { p_room_id: roomId }) as RpcResult<RoomToolsState>;
      if (result.error) throw new Error(result.error.message ?? "cage_load_failed");
      if (!result.data?.cage?.runtime || result.data.roomId !== roomId || result.data.roomType !== "cage") throw new Error("cage_configuration_missing");
      return result.data;
    }
    const result = await this.client.rpc("rooms_get_specialized_state_v1", { p_room_id: roomId }) as RpcResult<RoomToolsState>;
    if (result.error && !isMissingContract(result.error)) throw new Error(result.error.message ?? "room_specialized_load_failed");
    if (result.data) {
      if (result.data.roomType !== roomType || result.data.roomId !== roomId) throw new Error("room_specialized_projection_mismatch");
      if (result.data.wave) normalizeWaveState(result.data.wave);
      return result.data;
    }
    if (result.error && isMissingContract(result.error)) return this.fallbackProjection(roomType, roomId, role, accountId);
    if (!isControl(role)) return this.fallbackProjection(roomType, roomId, role, accountId);

    // Real initialization belongs to the canonical room launch contract.
    // Never upload investor fixtures when a live state is absent.
    throw new Error("room_specialized_configuration_missing");
  }
  async load(roomType: SpecializedRoomId, roomId: string) {
    return this.projected(roomType, roomId, "viewer", "anonymous");
  }

  subscribe(roomType: SpecializedRoomId, roomId: string, listener: (state: RoomToolsState) => void): RoomToolsRealtimeSubscription {
    let active = true;
    if(roomType === "classe") {
      const refresh=()=>{void this.load(roomType,roomId).then(state=>{if(active)listener(state);}).catch(()=>undefined);};
      const timer=setInterval(refresh,2500);refresh();
      return {unsubscribe:()=>{active=false;clearInterval(timer);}};
    }
    let channel: RealtimeChannel | null = this.client
      .channel(`room-specialized:${roomType}:${roomId}:${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_specialized_state_signal_v1", filter: `room_id=eq.${roomId}` }, () => {
        if (!active) return;
        void this.load(roomType, roomId).then(listener).catch(() => undefined);
      })
      .subscribe((status) => {
        if (!active || status !== "SUBSCRIBED") return;
        void this.load(roomType, roomId).then(listener).catch(() => undefined);
      });
    return {
      unsubscribe: () => {
        active = false;
        if (channel) void this.client.removeChannel(channel);
        channel = null;
      },
    };
  }

  async execute(roomType: SpecializedRoomId, roomId: string, role: RoomActorRole, command: RoomToolsCommand, accountId?: string): Promise<RoomToolsState> {
    if(roomType === "classe") return executeClasse(this.client,roomId,command,isControl(role));
    if (command.type === "scene.fundraiser.demo.contribute") throw new Error("scene_real_payment_required");
    if (command.type === "classe.demo.seat.purchase") throw new Error("class_checkout_unavailable");
    if (roomType === "wave") throw new Error("wave_normalized_repository_required");
    if (!commandAllowed(roomType, role, command)) throw new Error("room_tool_forbidden");
    if (roomType === "cage") {
      if (command.type === "cage.vote.cast") {
        const current = await this.projected(roomType, roomId, role, accountId ?? "");
        const match = current.cage!.runtime!.matches.find((item) => item.id === current.cage!.runtime!.activeMatchId);
        return this.execute(roomType, roomId, role, { type: "cage.competition.command", action: "vote.cast", payload: { choice: command.choice },
          idempotencyKey: crypto.randomUUID(), expectedRevision: current.revision, expectedMatchId: match?.id }, accountId);
      }
      if (command.type !== "cage.competition.command") throw new Error("cage_use_competition_command");
      const configure = command.action === "competition.configure";
      const results = command.action === "broadcast.results";
      const args = { p_room_id: roomId, p_payload: command.payload ?? {}, p_idempotency_key: command.idempotencyKey, p_expected_revision: command.expectedRevision,
        ...(configure || results ? {} : { p_action: command.action, p_expected_match_id: command.expectedMatchId ?? null,
          p_expected_step_index: command.expectedStepIndex ?? null, p_expected_entry_id: command.expectedEntryId ?? null }) };
      const result = await this.client.rpc(configure ? "rooms_configure_cage_v1" : results ? "rooms_publish_cage_results_v1" : "rooms_apply_cage_command_v1", args) as RpcResult<RoomToolsState>;
      if (result.error) throw new Error(result.error.message ?? "cage_command_failed");
      if (!result.data?.cage?.runtime || result.data.roomId !== roomId) throw new Error("cage_command_empty");
      return result.data;
    }

    if (isControl(role)) {
      const current = await this.projected(roomType, roomId, role, "control");
      const next = structuredClone(current);
      reduceCommand(next, command, accountId ?? role);
      const result = await this.client.rpc("rooms_commit_specialized_state_v1", {
        p_room_id: roomId,
        p_room_type: roomType,
        p_expected_revision: current.revision,
        p_next_state: next,
      }) as RpcResult<RoomToolsState>;
      if (result.error) {
        if (isMissingContract(result.error)) return this.fallbackExecute(roomType, roomId, role, command, accountId);
        throw new Error(result.error.message ?? "room_specialized_commit_failed");
      }
      if (!result.data) throw new Error("room_specialized_commit_empty");
      return result.data;
    }

    const rpcName = command.type === "scene.evaluation.cast"
      ? "rooms_cast_scene_evaluation_v1"
      : command.type === "classe.question.add" || command.type === "classe.question.support"
        ? "rooms_apply_classe_question_action_v1"
        : command.type === "loge.request.join" || command.type === "loge.request.cancel"
          ? "rooms_apply_loge_request_v1"
          : "rooms_apply_specialized_viewer_action_v1";
    const rpcArgs = command.type === "scene.evaluation.cast" ? {
      p_room_id: roomId,
      p_performance_id: command.performanceId,
      p_rating: command.rating,
      p_reactions: command.reactions,
      p_idempotency_key: crypto.randomUUID(),
    } : {
      p_room_id: roomId,
      p_action: command.type,
      p_payload: commandPayload(command),
      p_idempotency_key: crypto.randomUUID(),
    };
    const result = await this.client.rpc(rpcName, rpcArgs) as RpcResult<RoomToolsState>;
    if (result.error) {
      if (rpcName === "rooms_apply_loge_request_v1") throw new Error(result.error.message ?? "loge_request_unavailable");
      if (isMissingContract(result.error)) return this.fallbackExecute(roomType, roomId, role, command, accountId);
      throw new Error(result.error.message ?? "room_specialized_action_failed");
    }
    if (!result.data) throw new Error("room_specialized_action_empty");
    return result.data;
  }

  async publicProjection(roomType: SpecializedRoomId, roomId: string) {
    return this.projected(roomType, roomId, "viewer", "anonymous");
  }

  async projectionForRole(roomType: SpecializedRoomId, roomId: string, role: RoomActorRole, accountId: string) {
    return this.projected(roomType, roomId, role, accountId);
  }
}

export const liveRoomToolsRepository: RoomToolsRepository = new SupabaseRoomToolsRepository();
