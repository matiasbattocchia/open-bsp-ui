import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateApiKey } from "@/queries/useApiKeys";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import Button from "@/components/Button";

export const Route = createFileRoute("/_auth/settings/api-keys/new")({
  component: AddApiKey,
});

function AddApiKey() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createApiKey = useCreateApiKey();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");

  const {
    register,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<{ name: string }>({
    defaultValues: {
      name: "",
    },
  });

  return (
    <>
      <SectionHeader title={t("Generar clave API")} />

      <SectionBody>
        <form
          id="create-apikey-form"
          onSubmit={handleSubmit((data) =>
            createApiKey.mutate(
              data,
              {
                onSuccess: (apiKey) =>
                  navigate({
                    to: `/settings/api-keys/${apiKey.id}`,
                    hash: (prevHash) => prevHash!,
                  }),
              }
            )
          )}
        >
          <fieldset disabled={!isAdmin} className="contents">
            <p className="text-muted-foreground text-[14px]">
              {t("Esto generará una nueva clave API que podrás usar para autenticarte.")}
            </p>

            <label>
              <div className="label">{t("Nombre")}</div>
              <input
                className="text"
                placeholder={t("Nombre de la clave")}
                {...register("name", { required: true })}
              />
            </label>
          </fieldset>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="create-apikey-form"
          type="submit"
          disabled={!isAdmin}
          invalid={!isValid || !isDirty}
          loading={createApiKey.isPending}
          disabledReason={t("Requiere permisos de administrador")}
          className="primary"
        >
          {t("Generar")}
        </Button>
      </SectionFooter>
    </>
  );
}
