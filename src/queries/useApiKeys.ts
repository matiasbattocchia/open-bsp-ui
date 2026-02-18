import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ApiKeyInsert, type ApiKeyRow, supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useApiKeys() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.apiKeys.all(orgId),
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
    queryKey: queryKeys.apiKeys.detail(orgId, id),
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
    mutationFn: async (data: Omit<ApiKeyInsert, "key" | "organization_id">) => {
      if (!orgId) throw new Error("No active organization");

      // Simple key generation logic
      const key = `sk_${crypto.randomUUID().replace(/-/g, "")}`;

      const { data: apiKey } = await supabase
        .from("api_keys")
        .insert({ ...data, organization_id: orgId, key })
        .select()
        .single()
        .throwOnError();

      return apiKey;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all(orgId) });
      queryClient.setQueryData(
        queryKeys.apiKeys.detail(orgId, data.id),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => old ? { ...old, data } : { data, error: null },
      );
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
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys.all(orgId) });
    },
  });
}
