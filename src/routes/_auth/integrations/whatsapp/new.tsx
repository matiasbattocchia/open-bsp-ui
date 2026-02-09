import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import WhatsAppIntegration from "@/components/WhatsAppIntegration";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/_auth/integrations/whatsapp/new")({
  component: WhatsAppNew,
});

function WhatsAppNew() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();

  const handleSuccess = (phone_number_id: string) => {
    navigate({
      to: "/integrations/whatsapp/$orgAddressId",
      params: { orgAddressId: phone_number_id },
      hash: (prevHash) => prevHash!,
    });
  };

  return (
    <>
      <SectionHeader title={t("Conectar WhatsApp")} />

      <SectionBody>
        <form>
          <div className="instructions">
            <p>{t("Para conectar WhatsApp a la plataforma, iniciá sesión en tu cuenta de Meta y seguí el proceso de registro.")}</p>

            <p><strong>{t("Requisitos importantes")}</strong></p>
            <ul>
              <li>{t("Si usás la app WhatsApp Business, podés conectar tu número actual y seguir usando la app.")}</li>
              <li>{t("Si no usás la app, el número a conectar no debe estar activo en otra cuenta de WhatsApp.")}</li>
            </ul>
          </div>
        </form>
      </SectionBody>

      <SectionFooter>
        <WhatsAppIntegration onSuccess={handleSuccess} />
      </SectionFooter>
    </>
  );
}
