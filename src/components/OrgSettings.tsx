import { useState } from "react";
import useBoundStore from "@/stores/useBoundStore";
import WhatsAppIntegration from "./WhatsAppIntegration";
import { Translate as T } from "@/hooks/useTranslation";
import { LoaderCircle } from "lucide-react";

export default function OrgSettings() {
  const activeOrgId = useBoundStore((store) => store.ui.activeOrgId);

  // TODO: Use react-query for server state - cabra 26/10/2024
  const [services, _setServices] = useState<
    { service: string; waba_id: string; phone_number: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  return (
    activeOrgId && (
      <>
        <div className="mt-[16px]">
          <div className="flex items-center gap-[8px]">
            <T as="div" className="text-xl">
              Integración con WhatsApp
            </T>
            {loading && (
              <LoaderCircle className="h-5 w-5 animate-spin stroke-blue-ack" />
            )}
          </div>
          <T>
            Para agregar una nuevo número de teléfono, completá el flujo de
            Facebook.
          </T>
          <T>El número no debe estar en uso en WhatsApp.</T>
          <div className="my-5">
            <WhatsAppIntegration
              orgId={activeOrgId}
              setLoading={setLoading}
              onSuccess={() => { }}
            />
          </div>
          <ul>
            {services.map((s) => (
              <li key={s.phone_number} className="mt-5">
                <p>
                  <T as="b">Número:</T> {s.phone_number}
                </p>
                <p>
                  <T as="b">WABA ID:</T> {s.waba_id}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </>
    )
  );
}
