import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Database, supabase } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export type WebhookRow = Database["public"]["Tables"]["webhooks"]["Row"];
export type WebhookInsert = Database["public"]["Tables"]["webhooks"]["Insert"];
export type WebhookUpdate = Database["public"]["Tables"]["webhooks"]["Update"];

export function useWebhooks() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.webhooks.all(orgId),
    queryFn: async () =>
      await supabase
        .from("webhooks")
        .select()
        .eq("organization_id", orgId!)
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as WebhookRow[],
  });
}

export function useWebhook(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.webhooks.detail(orgId, id),
    queryFn: async () =>
      await supabase
        .from("webhooks")
        .select()
        .eq("id", id)
        .eq("organization_id", orgId!)
        .single()
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as WebhookRow,
    experimental_prefetchInRender: true,
  });
}

export function useCreateWebhook() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: WebhookInsert) => {
      if (!orgId) throw new Error("No active organization");

      const { data: webhook } = await supabase
        .from("webhooks")
        .insert({ ...data, organization_id: orgId })
        .select()
        .single()
        .throwOnError();

      return webhook;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all(orgId) });
      queryClient.setQueryData(
        queryKeys.webhooks.detail(orgId, data.id),
        data,
      );
    },
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: WebhookUpdate) => {
      if (!orgId) throw new Error("No active organization");
      if (!data.id) throw new Error("No webhook id");

      const { data: webhook } = await supabase
        .from("webhooks")
        .update(data)
        .eq("id", data.id)
        .select()
        .single()
        .throwOnError();

      return webhook;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all(orgId) });
      queryClient.setQueryData(
        queryKeys.webhooks.detail(orgId, variables.id),
        data,
      );
    },
  });
}

export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No active organization");

      await supabase.from("webhooks").delete().eq("id", id).throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.webhooks.all(orgId) });
    },
  });
}
