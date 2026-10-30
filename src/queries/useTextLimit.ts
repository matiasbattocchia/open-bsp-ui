import { useQuery } from "@tanstack/react-query";
import { supabase, type ConversationRow } from "@/supabase/client";
import { queryKeys } from "./queryKeys";

type Service = ConversationRow["service"];

/**
 * The most characters a message of `type` sends on `service` — "file" asks for
 * a caption's. The database's own `text_limit`, which refuses longer outgoing
 * messages at insert; null when the service has none.
 */
export function useTextLimit(
  service: Service | undefined,
  type: "text" | "file",
) {
  return useQuery({
    queryKey: queryKeys.textLimit(service, type),
    queryFn: async () =>
      await supabase
        .rpc("text_limit", { service: service!, type })
        .throwOnError(),
    enabled: !!service,
    staleTime: Infinity,
    select: (data) => data.data as number | null,
  });
}

/**
 * Characters as the database counts them (code points, `char_length`): an
 * emoji is one or two, never the four UTF-16 units `.length` would say.
 */
export function textLength(text: string | undefined) {
  return text ? [...text].length : 0;
}

/**
 * How `text` stands against its limit: `near` past 80% of it, when a counter
 * shows, and `over` past it, when it can't be sent.
 */
export function useTextLength(
  service: Service | undefined,
  type: "text" | "file",
  text: string | undefined,
) {
  const { data: limit } = useTextLimit(service, type);
  const length = textLength(text);
  return {
    length,
    limit,
    near: limit != null && length > limit * 0.8,
    over: limit != null && length > limit,
  };
}
