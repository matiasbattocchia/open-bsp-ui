import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useWebhook, useUpdateWebhook, useDeleteWebhook, type WebhookUpdate } from "@/queries/useWebhooks";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";


export const Route = createFileRoute("/_auth/settings/webhooks/$webhookId")({
  component: EditWebhook,
});

function EditWebhook() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { webhookId } = Route.useParams();
  const { data: webhook } = useWebhook(webhookId);
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const {
    register,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<WebhookUpdate>({
    values: webhook,
  });

  return webhook && (
    <>
      <SectionHeader
        title={t("Editar webhook") as string}
        onDelete={() => deleteWebhook.mutate(webhookId, {
          onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
        })}
      />

      <SectionBody>
        <form
          id="webhook-form"
          onSubmit={handleSubmit((data) =>
            updateWebhook.mutate(
              {
                id: webhookId,
                ...data,
              }
            )
          )}
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
          form="webhook-form"
          type="submit"
          disabled={updateWebhook.isPending || !isValid || !isDirty}
          className="primary"
        >
          {updateWebhook.isPending ? "..." : t("Actualizar")}
        </button>
      </SectionFooter>
    </>
  );
}
