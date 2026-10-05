import { useEffect } from "react";
import { supabase } from "@/supabase/client";
import type { ConversationRow } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { fetchLatestConversationMessages } from "@/utils/IdbUtils";
import { digitsOnly, sanitizeIlikeTerm } from "@/utils/conversationSearch";

const SEARCH_LIMIT = 50;
const PREVIEW_FETCH_CAP = 30;
const DEBOUNCE_MS = 250;

/**
 * When the user searches the chat list, hydrate matching conversations that
 * are not in the current init_data window (name / phone / contact name).
 */
export function useConversationSearch(pattern: string) {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  useEffect(() => {
    const query = pattern.trim();
    if (!orgId || !query) return;

    const term = sanitizeIlikeTerm(query);
    const digits = digitsOnly(query);
    if (!term && digits.length < 3) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void runSearch();
    }, DEBOUNCE_MS);

    async function runSearch() {
      try {
        const convsById = new Map<string, ConversationRow>();

        const orFilters: string[] = [];
        if (term) orFilters.push(`name.ilike.%${term}%`);
        if (digits.length >= 3) {
          orFilters.push(`contact_address.ilike.%${digits}%`);
        }

        if (orFilters.length) {
          const { data } = await supabase
            .from("conversations")
            .select()
            .eq("organization_id", orgId!)
            .or(orFilters.join(","))
            .limit(SEARCH_LIMIT)
            .throwOnError();
          for (const conv of data ?? []) convsById.set(conv.id, conv);
        }

        if (term) {
          const [{ data: namedContacts }, { data: namedAddresses }] =
            await Promise.all([
              supabase
                .from("contacts")
                .select("id, addresses:contacts_addresses(address)")
                .eq("organization_id", orgId!)
                .ilike("name", `%${term}%`)
                .limit(SEARCH_LIMIT)
                .throwOnError(),
              supabase
                .from("contacts_addresses")
                .select("address")
                .eq("organization_id", orgId!)
                .or(
                  `extra->>name.ilike.%${term}%,extra->>username.ilike.%${term}%`,
                )
                .limit(SEARCH_LIMIT)
                .throwOnError(),
            ]);

          const addresses = [
            ...(namedContacts ?? []).flatMap(
              (contact) =>
                contact.addresses
                  ?.map((addr) => addr.address)
                  .filter(Boolean) ?? [],
            ),
            ...(namedAddresses ?? []).map((addr) => addr.address),
          ].filter((address): address is string => Boolean(address));

          const uniqueAddresses = [...new Set(addresses)].slice(
            0,
            SEARCH_LIMIT,
          );
          if (uniqueAddresses.length) {
            const { data } = await supabase
              .from("conversations")
              .select()
              .eq("organization_id", orgId!)
              .in("contact_address", uniqueAddresses)
              .limit(SEARCH_LIMIT)
              .throwOnError();
            for (const conv of data ?? []) convsById.set(conv.id, conv);
          }
        }

        if (cancelled) return;

        const matched = [...convsById.values()];
        if (!matched.length) return;

        const { pushConversations, pushMessages } =
          useBoundStore.getState().chat;
        pushConversations(matched);

        const messages = useBoundStore.getState().chat.messages;
        const missingPreview = matched
          .filter((conv) => !messages.get(conv.id)?.size)
          .slice(0, PREVIEW_FETCH_CAP);

        const previews = await Promise.all(
          missingPreview.map((conv) =>
            fetchLatestConversationMessages(conv.id, 1),
          ),
        );
        if (cancelled) return;

        const rows = previews.flat();
        if (rows.length) pushMessages(rows);
      } catch (err) {
        if (!cancelled) console.error(err);
      }
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orgId, pattern]);
}
