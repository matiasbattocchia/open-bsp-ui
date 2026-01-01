import { useOrganizations } from "@/queries/useOrganizations";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect } from "react";

export const useSetActiveOrg = () => {
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const { data } = useOrganizations();

  // Select the most recent organization if none is selected
  useEffect(() => {
    if (activeOrgId) return;

    const orgIds = data?.sort((a, b) => +b.created_at - +a.created_at).map((o) => o.id) || [];

    setActiveOrg(orgIds.at(-1) || null);
  }, [data]);
};
