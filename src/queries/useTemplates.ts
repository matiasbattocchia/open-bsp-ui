import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type TemplateData, type SyncedTemplate } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";
import { queryKeys } from "./queryKeys";

export function useTemplates(organizationAddress?: string) {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.templates.list(activeOrgId, organizationAddress),
    queryFn: async () => {
      if (!organizationAddress) return [];

      const { data } = await supabase
        .from("organizations_addresses")
        .select("extra")
        .eq("organization_id", activeOrgId!)
        .eq("address", organizationAddress)
        .single();

      const extra = (data?.extra as Record<string, unknown> & { templates?: SyncedTemplate[] } | null) ?? {};
      return extra.templates ?? [];
    },
    enabled: !!activeOrgId && !!organizationAddress,
    retry: false,
  });
}

export function useTemplateDetail(
  organizationAddress?: string,
  templateId?: string,
) {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: queryKeys.templates.detail(activeOrgId, organizationAddress, templateId),
    queryFn: async () => {
      if (!organizationAddress || !templateId) return null;

      const { data } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "PUT",
          body: {
            organization_id: activeOrgId,
            organization_address: organizationAddress,
            template: { id: templateId },
          },
        },
      );

      return data as TemplateData;
    },
    enabled: !!activeOrgId && !!organizationAddress && !!templateId,
    retry: false,
  });
}

export function useSyncTemplates() {
  const queryClient = useQueryClient();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async (organizationAddress: string) => {
      const { data } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "PUT",
          body: { organization_id: activeOrgId, organization_address: organizationAddress },
        },
      );

      return (data as TemplateData[]) || [];
    },
    onSuccess: (_, organizationAddress) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.list(activeOrgId, organizationAddress),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.addresses(activeOrgId),
      });
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async ({
      template,
      organizationAddress,
    }: {
      template: TemplateData;
      organizationAddress: string;
    }) => {
      const { error } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "POST",
          body: { organization_id: activeOrgId, organization_address: organizationAddress, template },
        },
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.list(activeOrgId, variables.organizationAddress),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.addresses(activeOrgId),
      });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async ({
      template,
      organizationAddress,
    }: {
      template: TemplateData;
      organizationAddress: string;
    }) => {
      const { error } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "PATCH",
          body: { organization_id: activeOrgId, organization_address: organizationAddress, template },
        },
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.detail(activeOrgId, variables.organizationAddress, variables.template.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.list(activeOrgId, variables.organizationAddress),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.addresses(activeOrgId),
      });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useMutation({
    mutationFn: async ({
      template,
      organizationAddress,
    }: {
      template: TemplateData;
      organizationAddress: string;
    }) => {
      const { error } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "DELETE",
          body: { organization_id: activeOrgId, organization_address: organizationAddress, template },
        },
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.templates.list(activeOrgId, variables.organizationAddress),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.addresses(activeOrgId),
      });
    },
  });
}
