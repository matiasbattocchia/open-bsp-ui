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
          .from("agents")
          .select("id, organization_id, user_id, extra->roles")
          .eq("user_id", userId);

        if (authQuery.error) {
          throw authQuery.error;
        }

        /** Set roles section */
        const _roles: Record<
          string,
          { agentId: string; role: "admin" | "operator" }
        > = {};

        authQuery.data.forEach(({ id, organization_id, roles }) => {
          _roles[organization_id] = {
            agentId: id,
            role: ((roles as string[]) || []).includes("admin")
              ? "admin"
              : "operator",
          };
        });

        setRoles(_roles);

        const authorizedOrgs = authQuery.data.map(
          (agent) => agent.organization_id,
        );

        if (!authorizedOrgs.length) {
          throw new Error(
            `Empty list of authorized orgs for user id ${userId}.`,
          );
        }

        const authData = {
          authorizedOrgs,
          authorizedAddresses: [],
        };
        setData(authData);
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
