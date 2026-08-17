import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type TemplateData } from "@/supabase/client";
import useBoundStore from "@/stores/useBoundStore";

function templatesFromInvoke(payload: unknown): TemplateData[] {
  if (Array.isArray(payload)) {
    return payload as TemplateData[];
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const root = payload as { data?: unknown };
  if (Array.isArray(root.data)) {
    return root.data as TemplateData[];
  }
  if (root.data && typeof root.data === "object") {
    const nested = root.data as { data?: unknown };
    if (Array.isArray(nested.data)) {
      return nested.data as TemplateData[];
    }
  }
  return [];
}

async function invokeErrorMessage(
  error: unknown,
  data: unknown,
): Promise<string> {
  if (data && typeof data === "object" && "message" in data) {
    const body = data as { message?: unknown; cause?: unknown };
    const message = typeof body.message === "string" ? body.message : "";
    if (message && body.cause !== undefined) {
      return `${message}: ${JSON.stringify(body.cause)}`;
    }
    if (message) {
      return message;
    }
  }

  if (error && typeof error === "object" && "context" in error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        return invokeErrorMessage(undefined, await ctx.json());
      } catch {
        // ignore
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Could not fetch templates";
}

export function useTemplates(organizationAddress?: string) {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  return useQuery({
    queryKey: ["templates", activeOrgId, organizationAddress],
    queryFn: async () => {
      if (!organizationAddress) return [];

      const { data, error } = await supabase.functions.invoke(
        "whatsapp-management/templates",
        {
          method: "PUT",
          body: {
            organization_id: activeOrgId,
            organization_address: organizationAddress,
          },
        },
      );

      if (error) {
        throw new Error(await invokeErrorMessage(error, data));
      }

      return templatesFromInvoke(data);
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
          body: {
            organization_id: activeOrgId,
            organization_address: organizationAddress,
            template,
          },
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
          body: {
            organization_id: activeOrgId,
            organization_address: organizationAddress,
            template,
          },
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
          body: {
            organization_id: activeOrgId,
            organization_address: organizationAddress,
            template,
          },
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
