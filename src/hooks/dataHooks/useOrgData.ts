import { useEffect } from "react";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";

export const useOrgData = (authorizedOrgs: string[] | undefined) => {
  const setOrganizations = useBoundStore(
    (state) => state.chat.setOrganizations,
  );

  useEffect(() => {
    const fetchOrgs = async () => {
      if (!authorizedOrgs?.length) return;

      try {
        const orgsQuery = await supabase
          .from("organizations")
          .select()
          .in("id", authorizedOrgs);

        if (orgsQuery.error) {
          throw orgsQuery.error;
        }

        setOrganizations(orgsQuery.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchOrgs();
  }, [authorizedOrgs, setOrganizations]);
};
