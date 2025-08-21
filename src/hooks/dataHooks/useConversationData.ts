import { useEffect } from "react";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";

export const useConversationData = (
  authorizedAddresses: string[] | undefined,
) => {
  const pushConversations = useBoundStore(
    (state) => state.chat.pushConversations,
  );

  useEffect(() => {
    const fetchConversations = async () => {
      if (!authorizedAddresses?.length) return;

      try {
        const convsQuery = await supabase
          .from("conversations")
          .select()
          .in("organization_address", authorizedAddresses)
          .order("updated_at", { ascending: false })
          .limit(999);

        if (convsQuery.error) {
          throw convsQuery.error;
        }

        pushConversations(convsQuery.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConversations();
  }, [authorizedAddresses, pushConversations]);
};
