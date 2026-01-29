import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import SectionFooter from "@/components/SectionFooter";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentOrganization, useUpdateCurrentOrganization } from "@/queries/useOrganizations";
import { useCurrentAgent } from "@/queries/useAgents";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import TextAreaField from "@/components/TextAreaField";
import Switch from "@/components/Switch";
import { type OrganizationUpdate } from "@/supabase/client";
import { useForm, Controller } from "react-hook-form";
import { useMemo } from "react";

export const Route = createFileRoute("/_auth/integrations/preprocessor")({
  component: AnnotatorSettings,
});

function AnnotatorSettings() {
  const { translate: t } = useTranslation();
  const { data: org } = useCurrentOrganization();
  const { data: agent } = useCurrentAgent();
  const updateOrg = useUpdateCurrentOrganization();

  const isOwner = agent?.extra?.role === "owner";

  const normalizedOrg = useMemo(() => {
    if (!org) return undefined;
    return {
      ...org,
      extra: {
        ...org.extra,
        annotations: {
          mode: "inactive" as "active" | "inactive",
          model: "gemini-2.5-flash" as "gemini-2.5-pro" | "gemini-2.5-flash",
          ...org.extra?.annotations
        }
      }
    };
  }, [org]);

  const {
    register,
    handleSubmit,
    control,
    formState: { isValid, isDirty },
  } = useForm<OrganizationUpdate>({ values: normalizedOrg });

  return (
    <>
      <SectionHeader title={t("Pre-procesador de mensajes")} />

      <SectionBody>
        <form
          id="annotator-form"
          onSubmit={handleSubmit((data) => updateOrg.mutate(data))}
        >
          <Controller
            control={control}
            name="extra.annotations.mode"
            render={({ field }) => (
              <label className="flex items-center gap-[12px] cursor-pointer justify-between">
                <div className="flex flex-col gap-[2px]">
                  <div className="text-foreground">{t("Estado")}</div>
                </div>
                <Switch
                  checked={field.value === "active"}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? "active" : "inactive")
                  }
                  disabled={!isOwner}
                  className="mt-[4px]"
                />
              </label>
            )}
          />

          <SelectField
            control={control}
            name="extra.annotations.model"
            label={t("Modelo")}
            options={[
              { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
              { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
            ]}
            disabled={!isOwner}
          />

          <label>
            <div className="label">{t("Clave API de Google")}</div>
            <input
              type="password"
              className="text"
              placeholder="sk-..."
              disabled={!isOwner}
              {...register("extra.annotations.api_key")}
            />
          </label>

          <label>
            <div className="label">{t("Idioma")}</div>
            <input
              type="text"
              className="text"
              placeholder="Español"
              disabled={!isOwner}
              {...register("extra.annotations.language")}
            />
          </label>

          <TextAreaField
            control={control}
            name="extra.annotations.extra_prompt"
            label={t("Instrucciones adicionales")}
            placeholder={t("Instrucciones adicionales para el modelo...")}
            disabled={!isOwner}
          />
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="annotator-form"
          type="submit"
          disabled={!isOwner}
          invalid={!isValid || !isDirty}
          loading={updateOrg.isPending}
          disabledReason={t("Requiere permisos de propietario")}
          className="primary"
        >
          {t("Actualizar")}
        </Button>
      </SectionFooter>
    </>
  );
}
