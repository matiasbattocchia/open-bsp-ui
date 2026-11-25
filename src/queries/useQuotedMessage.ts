import { useQuery } from "@tanstack/react-query";
import { type MessageRow, supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { quotedRef } from "@/utils/ReplyUtils";
import { queryKeys } from "./queryKeys";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The message a message answers: from the chat when it is loaded, else from
 * the database. Looked for across the account, not only the conversation: a
 * comment can answer one filed in another commenter's conversation. Undefined
 * when it answers nothing, or something that is no message here (an
 * Instagram story).
 */
export function useQuotedMessage(message: MessageRow): MessageRow | undefined {
  const ref = quotedRef(message);

  const loaded = useBoundStore((store) => {
    if (!ref) return;

    for (const msg of store.chat.messages
      .get(message.conversation_id)
      ?.values() || []) {
      if (msg.external_id === ref || msg.id === ref) return msg;
    }
  });

  // A local row is named by its own id, which only a uuid can be.
  const local = message.service === "local";

  const { data } = useQuery({
    queryKey: queryKeys.messages.quoted(
      message.organization_id,
      message.organization_address,
      message.service,
      ref,
    ),
    queryFn: async () => {
      const { data } = await supabase
        .from("messages")
        .select()
        .eq("organization_id", message.organization_id)
        .eq("organization_address", message.organization_address)
        .eq("service", message.service)
        .eq(message.service === "local" ? "id" : "external_id", ref!)
        .limit(1)
        .maybeSingle()
        .throwOnError();

      return data?.content.version === "1" ? (data as MessageRow) : null;
    },
    enabled: !!ref && !loaded && (!local || UUID.test(ref)),
    staleTime: Infinity,
  });

  return loaded ?? data ?? undefined;
}
