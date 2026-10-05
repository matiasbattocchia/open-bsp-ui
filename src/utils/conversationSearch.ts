import { formatPhoneNumber, isIncludedIn } from "@/utils/FormatUtils";

export type ConversationSearchFields = {
  alias?: string;
  name?: string | null;
  contactName?: string;
  extraName?: string;
  username?: string;
  contactAddress?: string | null;
  groupAddress?: string | null;
};

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Strip PostgREST `or`/`ilike` metacharacters so the pattern is literal. */
export function sanitizeIlikeTerm(value: string): string {
  return value
    .replace(/[%_,.()\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Match a conversation the way the list shows it: nickname, contact/chat name,
 * username, and phone (raw, formatted, or a digit substring).
 */
export function conversationMatchesSearch(
  fields: ConversationSearchFields,
  query: string,
): boolean {
  const q = query.trim();
  if (!q) return true;

  const nameFields = [
    fields.alias,
    fields.name,
    fields.contactName,
    fields.extraName,
    fields.username,
    fields.groupAddress,
  ];
  if (nameFields.some((field) => field && isIncludedIn(q, field))) {
    return true;
  }

  const address = fields.contactAddress;
  if (!address) return false;

  if (isIncludedIn(q, address)) return true;

  const formatted = formatPhoneNumber(address);
  if (formatted && isIncludedIn(q, formatted)) return true;

  const qDigits = digitsOnly(q);
  return qDigits.length >= 3 && digitsOnly(address).includes(qDigits);
}
