import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type OrganizationInsert,
  type OrganizationUpdate,
  supabase,
} from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useOrganizations() {
  const userId = useBoundStore((state) => state.ui.user?.id);

  return useQuery({
    queryKey: queryKeys.organizations.all(),
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
    queryKey: queryKeys.organizations.detail(id),
    queryFn: async () =>
      await supabase
        .from("organizations")
        .select()
        .eq("id", id)
        .single()
        .throwOnError(),
    enabled: !!userId && !!id,
    select: (data) => data.data,
  });
}

export function useCurrentOrganization() {
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useOrganization(orgId || "");
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: OrganizationInsert) => {
      // Note: because of RLS and the fact that the member(ship) that relates the user who created the organization
      // and the organization is added by an after insert trigger, insert+select does not work.
      const id = crypto.randomUUID();

      await supabase
        .from("organizations")
        .insert({ ...data, id })
        .throwOnError();

      const { data: org } = await supabase
        .from("organizations")
        .select()
        .eq("id", id)
        .single()
        .throwOnError();

      return org;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all() });
      queryClient.setQueryData(queryKeys.organizations.detail(data.id), data);
    },
  });
}

export function useUpdateCurrentOrganization() {
  const queryClient = useQueryClient();
  const orgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (data: OrganizationUpdate) => {
      if (!orgId) throw new Error("No active organization");

      const { data: org } = await supabase
        .from("organizations")
        .update(data)
        .eq("id", orgId)
        .select()
        .single()
        .throwOnError();

      return org;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all() });
      queryClient.setQueryData(queryKeys.organizations.detail(data.id), data);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all() });
    },
  });
}
