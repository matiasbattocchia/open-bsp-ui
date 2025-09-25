import {
  BaseMessage,
  supabase,
  MessageInsert,
  ConversationRow,
  MessageRow,
  TemplateMessage,
} from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";

export function newMessage(
  conv: ConversationRow,
  type: "incoming" | "outgoing" | "internal",
  message: BaseMessage | TemplateMessage,
  agentId?: string,
  file?: File,
): MessageInsert {
  if (file) {
    const mediaId = `/${conv.organization_id}/${conv.organization_address}/${crypto.randomUUID()}`;

    (message as BaseMessage).media = {
      ...(message as BaseMessage).media,
      id: mediaId,
      mime_type: file.type,
      file_size: file.size,
      filename: file.name,
    };
  }

  return {
    id: crypto.randomUUID(),
    service: conv.service as "whatsapp" | "local", // TODO: alter conversations table service column type to type - cabra 2024/07/28
    organization_address: conv.organization_address,
    contact_address: conv.contact_address,
    type,
    direction: type,
    message,
    agent_id: agentId ? agentId : null,
  };
}

export function pushMessageToStore(record: MessageInsert) {
  // Let's provide a temporary timestamp so the message can be sorted.
  // We do not trust the client's time for setting the `timestamp` and `updated_at` fields. That's why.
  const now = new Date().toISOString();
  record = {
    ...record,
    timestamp: now,
    updated_at: now, // important because of timestamp <= updated_at filter in chatSlice.ts
    status: { pending: now },
  };
  // TODO: optimistic insert (MessageInsert) lacks some fields that the store considers as present (MessageRow) - cabra 2024/07/28
  useBoundStore.getState().chat.pushMessages([record as MessageRow]);
}

export async function pushMessageToDb(
  record: MessageInsert,
  ignoreDuplicates = true,
) {
  const insertQuery = await supabase.from("messages").upsert(record, {
    ignoreDuplicates,
  });

  if (insertQuery.error) {
    throw insertQuery.error;
  }
}
