import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateOnboardingToken } from "@/queries/useOnboardingTokens";
import { useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/_auth/integrations/whatsapp/onboarding/new")({
  component: NewOnboardingToken,
});

type FormValues = {
  expires_in_days: string;
};

function NewOnboardingToken() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createToken = useCreateOnboardingToken();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      expires_in_days: "7",
    },
  });

  return (
    <>
      <SectionHeader title={t("Generar enlace de onboarding")} />

      <SectionBody>
        <form
          id="create-onboarding-token-form"
          onSubmit={handleSubmit((data) =>
            createToken.mutate(Number(data.expires_in_days), {
              onSuccess: (token) =>
                navigate({
                  to: "/integrations/whatsapp/onboarding/$tokenId",
                  params: { tokenId: token.id },
                  hash: (prevHash) => prevHash!,
                }),
            })
          )}
        >
          <fieldset disabled={!isOwner} className="contents">
            <p className="text-muted-foreground text-[14px]">
              {t("Generá un enlace para que un tercero conecte su número de WhatsApp a tu organización. No necesita tener cuenta en Open BSP ni ser miembro de tu organización.")}
            </p>

            <SelectField
              name="expires_in_days"
              control={control}
              label={t("Expiración")}
              options={[
                { value: "1", label: t("1 día") },
                { value: "3", label: t("3 días") },
                { value: "7", label: t("7 días") },
                { value: "30", label: t("30 días") },
              ]}
              required
            />
          </fieldset>
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="create-onboarding-token-form"
          type="submit"
          disabled={!isOwner}
          loading={createToken.isPending}
          disabledReason={t("Requiere permisos de propietario")}
          className="primary"
        >
          {t("Generar")}
        </Button>
      </SectionFooter>
    </>
  );
}
