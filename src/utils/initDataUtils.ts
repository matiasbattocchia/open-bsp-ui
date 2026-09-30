import { supabase } from "@/supabase/client";
import type { ConversationRow, MessageRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export type InitDataResponse = {
  conversations: ConversationRow[];
  messages: MessageRow[];
};

export async function fetchInitDataPage(
  organizationId: string,
  options: {
    limit: number;
    perConversation: number;
    until?: string;
  },
): Promise<InitDataResponse> {
  const { data } = await supabase
    .rpc("init_data", {
      p_organization_id: organizationId,
      p_limit: options.limit,
      p_per_conversation: options.perConversation,
      ...(options.until ? { p_until: options.until } : {}),
    })
    .throwOnError();

  return data as unknown as InitDataResponse;
}

/** Oldest preview timestamp among loaded conversations (bottom of the list). */
export function oldestLoadedConversationPreview(
  organizationId: string,
): string | null {
  const { conversations, messages } = useBoundStore.getState().chat;
  let oldest: string | null = null;

  for (const [convId, conv] of conversations) {
    if (conv.organization_id !== organizationId) continue;
    const preview = messages.get(convId)?.values().next().value;
    if (!preview) continue;
    if (!oldest || preview.timestamp < oldest) oldest = preview.timestamp;
  }

  return oldest;
}

export function oldestTimestampInPage(messages: MessageRow[]): string | null {
  if (!messages.length) return null;
  return messages.reduce(
    (min, m) => (m.timestamp < min ? m.timestamp : min),
    messages[0].timestamp,
  );
}

/**
 * Merge a bootstrap init_data page (first load). Pushes all messages as-is.
 */
export function applyInitBootstrapPage(page: InitDataResponse) {
  const { pushConversations, pushMessages } = useBoundStore.getState().chat;
  pushConversations(page.conversations);
  if (page.messages.length) pushMessages(page.messages);
}

/**
 * Merge an older init_data page for the conversation list. Skips preview
 * messages for conversations already in the store (avoids preview holes).
 */
export function applyInitDataPage(page: InitDataResponse) {
  const { pushConversations, pushMessages } = useBoundStore.getState().chat;
  pushConversations(page.conversations);

  const knownConvIds = new Set(useBoundStore.getState().chat.messages.keys());
  const msgs = page.messages.filter(
    (m) => !knownConvIds.has(m.conversation_id),
  );
  if (msgs.length) pushMessages(msgs);
}
