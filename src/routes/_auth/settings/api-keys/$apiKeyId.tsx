import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useApiKey, useDeleteApiKey, type ApiKeyRow } from "@/queries/useApiKeys";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";

export const Route = createFileRoute("/_auth/settings/api-keys/$apiKeyId")({
  component: ApiKeyDetail,
});

function ApiKeyDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { apiKeyId } = Route.useParams();
  const { data: apiKey } = useApiKey(apiKeyId);
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");
  const deleteApiKey = useDeleteApiKey();

  const { register } = useForm<ApiKeyRow>({
    values: apiKey,
  });

  return apiKey && (
    <>
      <SectionHeader
        title={t("Clave API") as string}
        onDelete={() => deleteApiKey.mutate(apiKeyId, {
          onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
        })}
        deleteDisabled={!isAdmin}
      />

      <SectionBody>
        <div className="flex flex-col gap-[24px] grow">
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              type="text"
              className="text"
              disabled
              {...register("name")}
            />
          </label>

          <label>
            <div className="label">{t("Clave")}</div>
            <input
              type="text"
              className="text"
              disabled
              {...register("key")}
            />
          </label>
        </div>
      </SectionBody>
    </>
  );
}
