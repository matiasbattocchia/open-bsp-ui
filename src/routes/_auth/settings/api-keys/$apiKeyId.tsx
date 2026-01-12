import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useApiKey, useDeleteApiKey } from "@/queries/useApiKeys";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import type { ApiKeyUpdate } from "@/supabase/client";

export const Route = createFileRoute("/_auth/settings/api-keys/$apiKeyId")({
  component: ApiKeyDetail,
});

function ApiKeyDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { apiKeyId } = Route.useParams();
  const { data: apiKey } = useApiKey(apiKeyId);
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";
  const deleteApiKey = useDeleteApiKey();

  const { register } = useForm<ApiKeyUpdate>({
    values: apiKey,
  });

  return apiKey && (
    <>
      <SectionHeader
        title={t("Clave API")}
        onDelete={() => deleteApiKey.mutate(apiKeyId, {
          onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
        })}
        deleteDisabled={!isOwner}
        deleteDisabledReason={t("Requiere permisos de propietario")}
      />

      <SectionBody>
        <div className="flex flex-col gap-[24px] grow">
          <p className="text-muted-foreground text-[14px]">
            {t("Configura los siguientes encabezados HTTP para autenticarte:")}
          </p>
          <ul className="text-muted-foreground text-[14px] list-disc ml-[20px]">
            <li><code className="font-mono">authorization:</code> <code className="font-mono break-all">{import.meta.env.VITE_SUPABASE_ANON_KEY}</code></li>
            <li><code className="font-mono">api-key:</code> {t("el valor de la clave generada abajo")}</li>
          </ul>

          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              type="text"
              className="text hover:border-transparent"
              disabled
              {...register("name")}
            />
          </label>

          <label>
            <div className="label">{t("Rol")}</div>
            <div className="text-[16px] text-foreground">
              {apiKey.role === "owner" && t("Propietario")}
              {apiKey.role === "admin" && t("Administrador")}
              {apiKey.role === "member" && t("Miembro")}
            </div>
          </label>

          <label>
            <div className="label">{t("Clave")}</div>
            <input
              type="text"
              className="text hover:border-transparent"
              disabled
              {...register("key")}
            />
          </label>
        </div>
      </SectionBody>
    </>
  );
}
