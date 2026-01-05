import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AgentInsert,
  type AgentRow,
  type AgentUpdate,
  type HumanAgentRow,
  supabase,
} from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export function useAgent<T = AgentRow>(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["agents", id],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select()
        .eq("id", id)
        .throwOnError()
        .single(),
    enabled: !!userId,
    select: (data) => data.data as T,
    experimental_prefetchInRender: true,
  });
}

export function useInvitations() {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["invitations"],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select()
        .eq("user_id", userId!)
        .eq("extra->invitation->>status", "pending")
        .throwOnError(),
    enabled: !!userId,
    select: (data) => data.data as HumanAgentRow[],
    experimental_prefetchInRender: true,
  });
}

export function useCurrentAgent() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: [orgId, "agents", "current"],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select()
        .eq("organization_id", orgId!)
        .eq("user_id", userId!)
        .is("ai", false)
        .throwOnError()
        .single(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data as HumanAgentRow,
  });
}

export function useCurrentAgents() {
  const userId = useBoundStore((state) => state.ui.user?.id);
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: [orgId, "agents"],
    queryFn: async () =>
      await supabase
        .from("agents")
        .select()
        .eq("organization_id", orgId!)
        .throwOnError(),
    enabled: !!userId && !!orgId,
    select: (data) => data.data,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: AgentInsert) => {
      if (!orgId) throw new Error("No active organization");

      const { data: agent } = await supabase
        .from("agents")
        .insert({ ...data, organization_id: orgId })
        .select()
        .single()
        .throwOnError();

      return agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [orgId, "agents"] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: AgentUpdate) => {
      if (!orgId) throw new Error("No active organization");
      if (!data.id) throw new Error("No agent id");

      const { data: agent } = await supabase
        .from("agents")
        .update(data)
        .eq("id", data.id)
        .select()
        .single()
        .throwOnError();

      return agent;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [orgId, "agents"] });
      queryClient.invalidateQueries({ queryKey: ["agents", variables.id] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (id: string) => {
      if (!orgId) throw new Error("No active organization");

      await supabase.from("agents").delete().eq("id", id).throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [orgId, "agents"] });
    },
  });
}
