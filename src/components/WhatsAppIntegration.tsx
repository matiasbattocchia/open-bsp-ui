import { useContext, useState } from "react";
import { WhatsAppIntegrationContext, type SignupOptions } from "@/contexts/WhatsAppIntegrationContext";
import Button from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";

export default function WhatsAppIntegration({
  onSuccess,
  signupOptions,
}: {
  onSuccess?: (phone_number_id: string) => void;
  signupOptions?: SignupOptions;
}) {
  const { translate: t } = useTranslation();
  const context = useContext(WhatsAppIntegrationContext);
  const [loading, setLoading] = useState(false);

  if (!context?.launchWhatsAppSignup) {
    return (
      <Button
        disabled
        className="primary bg-[#4267b2] hover:bg-[#4267b2]/90 text-white w-full opacity-50"
      >
        {t("Continuar con Facebook")}
      </Button>
    );
  }

  return (
    <Button
      loading={loading}
      className="primary bg-[#4267b2] hover:bg-[#4267b2]/90 text-white w-full"
      onClick={() => context.launchWhatsAppSignup(onSuccess || (() => { }), setLoading, signupOptions)}
    >
      {t("Continuar con Facebook")}
    </Button>
  );
}
