import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Database, supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"] & {
  name: string;
};
export type ApiKeyInsert =
  & Database["public"]["Tables"]["api_keys"]["Insert"]
  & { name: string };

export function useApiKeys() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: [orgId, "api_keys"],
    queryFn: async () =>
      await supabase
        .from("api_keys")
        .select()
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false })
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as ApiKeyRow[],
  });
}

export function useApiKey(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: [orgId, "api_keys", id],
    queryFn: async () =>
      await supabase
        .from("api_keys")
        .select()
        .eq("id", id)
        .eq("organization_id", orgId!)
        .single()
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as ApiKeyRow,
    experimental_prefetchInRender: true,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      if (!orgId) throw new Error("No active organization");

      // Simple key generation logic
      const key = `sk_${crypto.randomUUID().replace(/-/g, "")}`;

      const { data: apiKey } = await supabase
        .from("api_keys")
        .insert({
          organization_id: orgId,
          key: key,
          name: name,
        } as any) // Type cast because DB types aren't updated yet.
        .select()
        .single()
        .throwOnError();

      return apiKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [orgId, "api_keys"] });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No active organization");

      await supabase.from("api_keys").delete().eq("id", id).throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [orgId, "api_keys"] });
    },
  });
}
