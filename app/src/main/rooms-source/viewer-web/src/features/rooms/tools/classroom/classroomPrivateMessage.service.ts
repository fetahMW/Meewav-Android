import { supabase } from "../../../../lib/supabaseClient";
export type ClassroomPrivateMessageInput = {
  roomId: string;
  recipientId: string;
  body: string;
  source: "demo" | "live";
};

export type ClassroomPrivateMessageAttempt = {
  roomId: string;
  recipientId: string;
  body: string;
  conversationId?: string;
  idempotencyKey: string;
  clientMessageId: string;
};

export function createClassroomPrivateMessageAttempt(
  roomId: string,
  recipientId: string,
  body: string,
): ClassroomPrivateMessageAttempt {
  return {
    roomId: roomId.trim(),
    recipientId: recipientId.trim(),
    body: body.trim(),
    idempotencyKey: crypto.randomUUID(),
    clientMessageId: crypto.randomUUID(),
  };
}

export async function sendClassroomPrivateMessage(
  input: ClassroomPrivateMessageInput,
  attempt: ClassroomPrivateMessageAttempt,
  client = supabase,
) {
  const roomId = input.roomId.trim();
  const recipientId = input.recipientId.trim();
  const body = input.body.trim();
  if (!roomId || roomId.length > 128 || !recipientId || recipientId.length > 128) {
    throw new Error("class_private_message_recipient_invalid");
  }
  if (!body || body.length > 280) throw new Error("class_private_message_invalid");
  if (attempt.roomId !== roomId || attempt.recipientId !== recipientId || attempt.body !== body) {
    throw new Error("class_private_message_attempt_mismatch");
  }

  // The isolated Classe demo must remain fully usable without creating fake
  // conversations in the user's real Messaging account.
  if (input.source === "demo") {
    return { conversationId: null, messageId: null, demo: true as const };
  }

  const { data, error } = await client.rpc("rooms_classe_send_private_message_v1", {
    p_room_id: roomId, p_peer_id: recipientId, p_body: body,
    p_client_request_id: attempt.clientMessageId,
  });
  if (error || !data?.id) throw new Error("class_private_message_send_failed");
  return { conversationId: null, messageId: data.id as string, demo: false as const };
}
