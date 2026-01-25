import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateWebhook, type WebhookInsert } from "@/queries/useWebhooks";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";

export const Route = createFileRoute("/_auth/settings/webhooks/new")({
  component: AddWebhook,
});

function AddWebhook() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createWebhook = useCreateWebhook();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty },
  } = useForm<WebhookInsert>({
    defaultValues: {
      operations: ["insert", "update"],
      table_name: "messages",
    },
  });

  return (
    <>
      <SectionHeader title={t("Agregar webhook")} />

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
        >
          <fieldset disabled={!isAdmin} className="contents">
            <p>
              {t("Los webhooks notifican a tu servidor cuando ocurren eventos. Selecciona la tabla y operaciones que quieres monitorear.")}
            </p>

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
          </fieldset>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="create-webhook-form"
          type="submit"
          disabled={!isAdmin}
          invalid={!isValid || !isDirty}
          loading={createWebhook.isPending}
          disabledReason={t("Requiere permisos de administrador")}
          className="primary"
        >
          {t("Crear")}
        </Button>
      </SectionFooter>
    </>
  );
}
