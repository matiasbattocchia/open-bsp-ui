import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateWebhook, type WebhookInsert } from "@/queries/useWebhooks";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";

export const Route = createFileRoute("/_auth/settings/webhooks/new")({
  component: AddWebhook,
});

function AddWebhook() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createWebhook = useCreateWebhook();

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<WebhookInsert>({
    defaultValues: {
      operations: ["insert", "update"],
      table_name: "messages",
    },
  });

  return (
    <>
      <SectionHeader title={t("Agregar webhook") as string} />

      <SectionBody>
        <form
          id="create-webhook-form"
          onSubmit={handleSubmit((data) =>
            createWebhook.mutate(
              data,
              {
                onSuccess: (webhook) =>
                  navigate({
                    to: `/settings/webhooks/${webhook!.id}`,
                    hash: (prevHash) => prevHash!,
                  }),
              }
            )
          )}
          className="flex flex-col gap-[24px] grow"
        >
          <label>
            <div className="label">{t("URL")}</div>
            <input
              type="url"
              className="text"
              {...register("url", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Tabla")}</div>
            <select {...register("table_name", { required: true })}>
              <option value="messages">{t("Mensajes")}</option>
              <option value="conversations">{t("Conversaciones")}</option>
            </select>
          </label>

          <label>
            <div className="label">{t("Operaciones")}</div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="insert"
                  {...register("operations")}
                />
                {t("Insertar")}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  value="update"
                  {...register("operations")}
                />
                {t("Actualizar")}
              </label>
            </div>
          </label>

          <label>
            <div className="label">{t("Token (Opcional)")}</div>
            <input
              className="text"
              type="text"
              {...register("token")}
            />
          </label>
        </form>
      </SectionBody>

      <SectionFooter>
        <button
          form="create-webhook-form"
          type="submit"
          disabled={createWebhook.isPending || !isValid}
          className="primary"
        >
          {createWebhook.isPending ? "..." : t("Crear")}
        </button>
      </SectionFooter>
    </>
  );
}
