import type { MessageRow } from "@/supabase/client";

/** Keyset cursor for contiguous chat history (matches store sort order). */
export type MessageHistoryCursor = Pick<
  MessageRow,
  "timestamp" | "created_at" | "id"
>;

/**
 * Newest-first comparator. Returns a signed number and 0 on ties (required for
 * a stable, antisymmetric sort — returning only -1/1 breaks V8's sort).
 *
 * Ties are common: WhatsApp whole-second timestamps, and echoed outgoing
 * messages whose ms timestamp is overwritten by Meta's second-resolution one.
 * `created_at` then `id` break ties deterministically.
 */
export function timestampDescending(
  a?: MessageHistoryCursor,
  b?: MessageHistoryCursor,
) {
  const ta = +new Date(a?.timestamp || 0);
  const tb = +new Date(b?.timestamp || 0);
  if (ta !== tb) return tb - ta;

  const ca = +new Date(a?.created_at || 0);
  const cb = +new Date(b?.created_at || 0);
  if (ca !== cb) return cb - ca;

  return (b?.id || "").localeCompare(a?.id || "");
}

/** True when `msg` sorts strictly older than `cursor`. */
export function isOlderThanCursor(
  msg: MessageHistoryCursor,
  cursor: MessageHistoryCursor,
) {
  return timestampDescending(msg, cursor) > 0;
}

export function toHistoryCursor(
  msg: MessageHistoryCursor | null | undefined,
): MessageHistoryCursor | null {
  if (!msg?.timestamp || !msg.created_at || !msg.id) return null;
  return {
    timestamp: msg.timestamp,
    created_at: msg.created_at,
    id: msg.id,
  };
}

/** Oldest row in a newest-first page (for advancing the history cursor). */
export function oldestHistoryCursor(
  rows: MessageHistoryCursor[],
): MessageHistoryCursor | null {
  return toHistoryCursor(rows[rows.length - 1]);
}
