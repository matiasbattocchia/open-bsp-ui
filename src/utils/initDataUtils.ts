import type { ConversationRow, MessageRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export type InitDataResponse = {
  conversations: ConversationRow[];
  messages: MessageRow[];
};

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
 * Merge an init_data page. Skips preview messages for conversations that
 * already have messages in the store (avoids init_data preview holes).
 */
export function applyInitDataPage(
  page: InitDataResponse,
  options?: { excludeConversationIds?: Set<string> },
) {
  const { pushConversations, pushMessages } = useBoundStore.getState().chat;
  pushConversations(page.conversations);

  let msgs = page.messages;
  if (options?.excludeConversationIds) {
    msgs = msgs.filter(
      (m) => !options.excludeConversationIds!.has(m.conversation_id),
    );
  } else {
    const knownConvIds = new Set(useBoundStore.getState().chat.messages.keys());
    msgs = msgs.filter((m) => !knownConvIds.has(m.conversation_id));
  }

  if (msgs.length) pushMessages(msgs);
}
