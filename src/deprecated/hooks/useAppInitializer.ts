// @ts-nocheck
import { useEffect } from "react";
import { supabase } from "@/supabase/client";
import useBoundStore, { reset } from "@/store/useBoundStore";
import { useFetchAuthorizedData } from "./dataHooks/useFetchAuthorizedData";
import { useOrgData } from "./dataHooks/useOrgData";
import { useConversationData } from "./dataHooks/useConversationData";
import { useMessageData } from "./dataHooks/useMessageData";
import { useRealtimeSubscription } from "./dataHooks/useRealtimeSubscription";
import { useRouter, usePathname } from "next/navigation";

export function useAppInit() {
  const router = useRouter();
  const pathname = usePathname();
  const session = useBoundStore((state) => state.ui.session);
  const setSession = useBoundStore((state) => state.ui.setSession);

  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);

  const toggle = useBoundStore((state) => state.ui.toggle);
  const setUI = useBoundStore((state) => state.ui.setUI);
  const organizationsList = useBoundStore(
    (state) => state.ui.organizationsList,
  );

  // Hook the data in
  const { data: authorizedData } = useFetchAuthorizedData(session?.id);
  useOrgData(authorizedData?.authorizedOrgs);
  useConversationData(authorizedData?.authorizedOrgs);
  useMessageData(authorizedData?.authorizedOrgs, 30);
  useRealtimeSubscription(authorizedData?.authorizedOrgs);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        reset();
      } else if (
        event === "INITIAL_SESSION" ||
        (pathname === "/login" && session)
      ) {
        router.push("/conversations");
      }

      setSession(session?.user);
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle UI updates based on authorized data
  useEffect(() => {
    if (authorizedData?.authorizedOrgs) {
      // Set default active org if none selected or current selection is invalid
      if (
        !activeOrgId ||
        !authorizedData.authorizedOrgs.includes(activeOrgId)
      ) {
        setActiveOrg(authorizedData.authorizedOrgs[0]);
      }

      // Hide org list if only one org
      if (authorizedData.authorizedOrgs.length === 1 && organizationsList) {
        toggle("organizationsList");
      }

      setUI({ initialized: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizedData, activeOrgId]);

  useEffect(() => {
    if (!session) {
      reset();
    }
  }, [session]);
}
