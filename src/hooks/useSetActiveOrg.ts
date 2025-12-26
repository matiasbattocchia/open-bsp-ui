import { useOrganizations } from "@/queries/useOrgs";
import useBoundStore from "@/stores/useBoundStore";
import { useEffect } from "react";

export const useSetActiveOrg = () => {
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const { data } = useOrganizations();
  const orgIds = data?.map((o) => o.id) || [];

  useEffect(() => {
    setActiveOrg(orgIds.at(-1) || null);
  }, [orgIds]);
};
