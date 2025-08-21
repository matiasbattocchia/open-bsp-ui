import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";
import useBoundStore from "@/store/useBoundStore";
import { updateAuthorizedCache } from "@/utils/IdbUtils";

const interval = 3 * 60000; // 3 minutes
export const useFetchAuthorizedData = (
  userId: string | undefined,
  days: number = 30,
) => {
  const [data, setData] = useState<{
    authorizedOrgs: string[];
    authorizedAddresses: string[];
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const setRoles = useBoundStore((state) => state.ui.setRoles);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const authQuery = await supabase
          .from("organizations")
          .select(
            "id, agents (id, extra->roles), organizations_addresses (address)",
          )
          .eq("agents.user_id", userId);

        if (authQuery.error) {
          throw authQuery.error;
        }

        /** Set roles section */
        const roles: Record<
          string,
          { agentId: string; role: "admin" | "operator" }
        > = {};

        authQuery.data.forEach((org) => {
          roles[org.id] = {
            agentId: org.agents[0].id,
            role: (org.agents[0].roles as string[])?.includes("admin")
              ? "admin"
              : "operator",
          };
        });

        setRoles(roles);

        const authorizedOrgs = authQuery.data.map((org) => org.id);

        if (!authorizedOrgs.length) {
          throw new Error(
            `Empty list of authorized orgs for user id ${userId}.`,
          );
        }

        const authorizedAddresses = authQuery.data
          .map((org) => org.organizations_addresses.map((addr) => addr.address))
          .flat();

        if (!authorizedAddresses.length) {
          throw new Error(
            `Empty list of authorized orgs addresses for user id ${userId}.`,
          );
        }
        const authData = {
          authorizedOrgs,
          authorizedAddresses,
        };
        setData(authData);
        updateAuthorizedCache(authData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, interval);

    return () => {
      clearInterval(timer);
    };
  }, [userId]);

  return { data, error, isLoading };
};
