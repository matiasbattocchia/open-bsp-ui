import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateApiKey } from "@/queries/useApiKeys";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";
import Button from "@/components/Button";
import type { ApiKeyInsert } from "@/supabase/client";
import SelectField from "@/components/SelectField";

export const Route = createFileRoute("/_auth/settings/api-keys/new")({
  component: AddApiKey,
});

function AddApiKey() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createApiKey = useCreateApiKey();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty },
  } = useForm<ApiKeyInsert>({
    defaultValues: {
      role: "member",
    },
  });

  const roles = {
    owner: t("Propietario"),
    admin: t("Administrador"),
    member: t("Miembro"),
  };

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
          <fieldset disabled={!isOwner} className="contents">
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

            <SelectField
              name="role"
              control={control}
              label={t("Rol")}
              options={[
                { value: "member", label: roles.member },
                { value: "admin", label: roles.admin },
                { value: "owner", label: roles.owner },
              ]}
              required
            />
          </fieldset>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="create-apikey-form"
          type="submit"
          disabled={!isOwner}
          invalid={!isValid || !isDirty}
          loading={createApiKey.isPending}
          disabledReason={t("Requiere permisos de propietario")}
          className="primary"
        >
          {t("Generar")}
        </Button>
      </SectionFooter>
    </>
  );
}
