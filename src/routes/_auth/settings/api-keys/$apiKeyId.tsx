import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useApiKey, useDeleteApiKey, type ApiKeyRow } from "@/queries/useApiKeys";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";

export const Route = createFileRoute("/_auth/settings/api-keys/$apiKeyId")({
  component: ApiKeyDetail,
});

function ApiKeyDetail() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { apiKeyId } = Route.useParams();
  const { promise, data: apiKey } = useApiKey(apiKeyId);
  const deleteApiKey = useDeleteApiKey();

  const { register } = useForm<ApiKeyRow>({
    defaultValues: async () => {
      return await promise;
    },
  });

  if (!apiKey) return null;

  return (
    <>
      <SectionHeader title={t("Clave API") as string} />

      <SectionBody>
        <div className="flex flex-col gap-[16px] grow pb-[14px]">
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

          <div className="grow" />

          <button
            className="destructive"
            onClick={() =>
              deleteApiKey.mutate(apiKeyId, {
                onSuccess: () =>
                  navigate({
                    to: "..",
                    hash: (prevHash) => prevHash!,
                  }),
              })
            }
            disabled={deleteApiKey.isPending}
          >
            {deleteApiKey.isPending ? "..." : t("Eliminar")}
          </button>
        </div>
      </SectionBody>
    </>
  );
}
