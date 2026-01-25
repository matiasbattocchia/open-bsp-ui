import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useWebhook, useUpdateWebhook, useDeleteWebhook, type WebhookUpdate } from "@/queries/useWebhooks";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import { useCurrentAgent } from "@/queries/useAgents";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";


export const Route = createFileRoute("/_auth/settings/webhooks/$webhookId")({
  component: EditWebhook,
});

function EditWebhook() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { webhookId } = Route.useParams();
  const { data: webhook } = useWebhook(webhookId);
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty },
  } = useForm<WebhookUpdate>({
    values: webhook,
  });

  return webhook && (
    <>
      <SectionHeader
        title={t("Editar webhook")}
        onDelete={() => deleteWebhook.mutate(webhookId, {
          onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
        })}
        deleteDisabled={!isAdmin}
        deleteDisabledReason={t("Requiere permisos de administrador")}
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
              placeholder={t("https://ejemplo.com/webhook")}
              {...register("url", { required: true })}
            />
          </label>

          <SelectField
            name="table_name"
            control={control}
            label={t("Tabla")}
            options={[
              { value: "messages", label: t("Mensajes") },
              { value: "conversations", label: t("Conversaciones") },
            ]}
            required
          />

          <SelectField
            name="operations"
            control={control}
            label={t("Operaciones")}
            multiple
            options={[
              { value: "insert", label: t("Insertar") },
              { value: "update", label: t("Actualizar") },
            ]}
          />

          <label>
            <div className="label">{t("Token (opcional)")}</div>
            <input
              className="text"
              type="text"
              placeholder={t("Token de autenticación")}
              {...register("token")}
            />
          </label>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="webhook-form"
          type="submit"
          disabled={!isAdmin}
          invalid={!isValid || !isDirty}
          loading={updateWebhook.isPending}
          disabledReason={t("Requiere permisos de administrador")}
          className="primary"
        >
          {t("Actualizar")}
        </Button>
      </SectionFooter>
    </>
  );
}
