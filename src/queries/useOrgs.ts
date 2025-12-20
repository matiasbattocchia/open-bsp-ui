import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type OrganizationInsert,
  type OrganizationUpdate,
  supabase,
} from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export function useOrganizations() {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () =>
      await supabase
        .from("organizations")
        .select()
        .order("name")
        .throwOnError(),
    enabled: !!userId,
    select: (data) => data.data,
  });
}

export function useOrganization(id: string) {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: ["organizations", id],
    queryFn: async () =>
      await supabase
        .from("organizations")
        .select()
        .eq("id", id)
        .single()
        .throwOnError(),
    enabled: !!userId,
    select: (data) => data.data,
  });
}

export function useCurrentOrganization() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);
  console.log(orgId);

  return useOrganization(orgId || "");
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useMutation({
    mutationFn: async (data: OrganizationInsert) => {
      const { data: org } = await supabase
        .from("organizations")
        .insert({ ...data, user_id: userId })
        .select()
        .single()
        .throwOnError();

      return org;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useUpdateCurrentOrganization() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: OrganizationUpdate) => {
      if (!orgId) throw new Error("No active organization");

      await supabase
        .from("organizations")
        .update(data)
        .eq("id", orgId)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useDeleteCurrentOrganization() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No active organization");

      await supabase.from("organizations").delete().eq("id", orgId)
        .throwOnError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}
