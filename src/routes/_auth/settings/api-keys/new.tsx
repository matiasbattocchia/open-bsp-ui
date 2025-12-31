import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateApiKey } from "@/queries/useApiKeys";
import { useForm } from "react-hook-form";
import SectionBody from "@/components/SectionBody";

export const Route = createFileRoute("/_auth/settings/api-keys/new")({
  component: AddApiKey,
});

function AddApiKey() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createApiKey = useCreateApiKey();

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<{ name: string }>({
    defaultValues: {
      name: "",
    },
  });

  return (
    <>
      <SectionHeader title={t("Generar clave API") as string} />

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
          <div className="text-muted-foreground text-[14px]">
            {t("Esto generará una nueva clave API que podrás usar para autenticarte.")}
          </div>

          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              className="text"
              placeholder={t("Desarrollo") as string}
              {...register("name", { required: true })}
            />
          </label>
        </form>
      </SectionBody>

      <SectionFooter>
        <button
          form="create-apikey-form"
          type="submit"
          disabled={createApiKey.isPending || !isValid}
          className="primary"
        >
          {createApiKey.isPending ? "..." : t("Generar")}
        </button>
      </SectionFooter>
    </>
  );
}
