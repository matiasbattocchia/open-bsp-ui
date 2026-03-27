import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type TemplateData } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

export function useTemplates(organizationAddress?: string) {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: ["templates", activeOrgId, organizationAddress],
    queryFn: async () => {
      if (!organizationAddress) return [];

      const { data } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "PUT", // PUT as workaround for Supabase JS client GET bug
          body: { organization_address: organizationAddress },
        },
      );

      return (data.data as TemplateData[]) || [];
    },
    enabled: !!activeOrgId && !!organizationAddress,
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
          body: { organization_address: organizationAddress, template },
        },
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["templates", activeOrgId, variables.organizationAddress],
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
          body: { organization_address: organizationAddress, template },
        },
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["templates", activeOrgId, variables.organizationAddress],
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
          body: { organization_address: organizationAddress, template },
        },
      );

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["templates", activeOrgId, variables.organizationAddress],
      });
    },
  });
}
