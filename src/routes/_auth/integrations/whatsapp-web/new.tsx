import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import WhatsAppWebPairing from "@/components/WhatsAppWebPairing";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/_auth/integrations/whatsapp-web/new")({
  component: WhatsAppWebNew,
});

function WhatsAppWebNew() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <SectionHeader title={t("Vincular dispositivo")} />

      <SectionBody>
        <div className="instructions">
          <p>
            {t(
              "Vinculá tu número escaneando un código QR o ingresando un código en tu teléfono, como un dispositivo más de WhatsApp.",
            )}
          </p>
        </div>

        <WhatsAppWebPairing
          onSuccess={(address) =>
            navigate({
              to: "/integrations/whatsapp-web/$orgAddressId",
              params: { orgAddressId: address },
              hash: (prevHash) => prevHash!,
            })
          }
        />
      </SectionBody>
    </>
  );
}
