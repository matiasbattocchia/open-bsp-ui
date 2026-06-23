import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type LabelInsert,
  type LabelRow,
  type ConversationLabelRow,
  supabase,
} from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

// ─── Org labels ────────────────────────────────────────────────────────────

export function useLabels() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.labels.all(orgId),
    queryFn: async () =>
      await supabase
        .from("labels")
        .select()
        .eq("organization_id", orgId!)
        .order("name", { ascending: true })
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as LabelRow[],
  });
}

export function useCreateLabel() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: Omit<LabelInsert, "organization_id">) => {
      if (!orgId) throw new Error("No active organization");

      const { data: label } = await supabase
        .from("labels")
        .insert({ ...data, organization_id: orgId })
        .select()
        .single()
        .throwOnError();

      return label;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels.all(orgId) });
    },
  });
}

export function useUpdateLabel() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async ({
      name,
      color,
    }: {
      name: string;
      color: string | null;
    }) => {
      if (!orgId) throw new Error("No active organization");

      const { data: label } = await supabase
        .from("labels")
        .update({ color })
        .eq("name", name)
        .eq("organization_id", orgId)
        .select()
        .single()
        .throwOnError();

      return label;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels.all(orgId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.labels.detail(orgId, data?.name),
      });
    },
  });
}

export function useDeleteLabel() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (name: string) => {
      if (!orgId) throw new Error("No active organization");

      await supabase
        .from("labels")
        .delete()
        .eq("name", name)
        .eq("organization_id", orgId)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.labels.all(orgId) });
    },
  });
}

// ─── Conversation labels ───────────────────────────────────────────────────

export function useConversationLabels(conversationId: string | null) {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.conversationLabels.all(orgId, conversationId),
    queryFn: async () =>
      await supabase
        .from("conversation_labels")
        .select()
        .eq("conversation_id", conversationId!)
        .eq("organization_id", orgId!)
        .throwOnError(),
    enabled: !!userId && !!orgId && !!conversationId,
    select: (data) => data.data as ConversationLabelRow[],
  });
}

export function useApplyLabel() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useMutation({
    mutationFn: async ({
      conversationId,
      labelName,
    }: {
      conversationId: string;
      labelName: string;
    }) => {
      if (!orgId) throw new Error("No active organization");

      const { data } = await supabase
        .from("conversation_labels")
        .insert({
          conversation_id: conversationId,
          label_name: labelName,
          organization_id: orgId,
          applied_by: userId ?? null,
        })
        .select()
        .single()
        .throwOnError();

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationLabels.all(
          orgId,
          variables.conversationId,
        ),
      });
    },
  });
}

export function useRemoveLabel() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async ({
      conversationId,
      labelName,
    }: {
      conversationId: string;
      labelName: string;
    }) => {
      if (!orgId) throw new Error("No active organization");

      await supabase
        .from("conversation_labels")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("label_name", labelName)
        .eq("organization_id", orgId)
        .throwOnError();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversationLabels.all(
          orgId,
          variables.conversationId,
        ),
      });
    },
  });
}
