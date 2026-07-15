import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "@/components/Button";
import Spinner from "@/components/Spinner";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgent } from "@/queries/useAgents";
import {
  useStartWhatsAppWebSession,
  usePendingWhatsAppWebSession,
} from "@/queries/useWhatsAppWeb";
import { isValidPhoneNumber } from "@/utils/FormatUtils";

type Method = "qr" | "code";

export default function WhatsAppWebPairing({
  onSuccess,
}: {
  onSuccess?: (address: string) => void;
}) {
  const { translate: t } = useTranslation();
  const { data: agent } = useCurrentAgent();
  const isOwner = agent?.extra?.role === "owner";

  const [method, setMethod] = useState<Method>("qr");
  const [phone, setPhone] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const start = useStartWhatsAppWebSession();
  const poll = usePendingWhatsAppWebSession(sessionId);

  // Latest pairing state: polled value once available, else the start response.
  const live = poll.data ?? start.data;
  const status = live?.status ?? (start.isPending ? "pending" : undefined);
  const qrCode = live?.qr_code;
  const pairingCode = live?.pairing_code;

  // On "paired" the backend has already upserted the channel row; hand off.
  useEffect(() => {
    if (poll.data?.status === "paired" && poll.data.address) {
      onSuccess?.(poll.data.address);
    }
  }, [poll.data?.status, poll.data?.address, onSuccess]);

  const beginPairing = () => {
    setSessionId(null);
    start.mutate(method === "code" ? { phone_number: phone } : {}, {
      onSuccess: (data) => setSessionId(data.session_id),
    });
  };

  const reset = () => {
    setSessionId(null);
    start.reset();
  };

  const switchMethod = (next: Method) => {
    setMethod(next);
    reset();
  };

  const errorMessage =
    poll.data?.status === "error"
      ? poll.data.error || t("Error al vincular. Intentá de nuevo.")
      : start.isError
        ? t("Error al vincular. Intentá de nuevo.")
        : poll.isError
          ? t("No se pudo contactar el puente. Intentá de nuevo.")
          : undefined;

  const started = !!sessionId || start.isPending;
  const pairedPending = status === "pending" && started;

  return (
    <div className="flex flex-col gap-[16px] max-w-[420px]">
      {/* Method toggle */}
      <div className="flex gap-[8px]">
        {(["qr", "code"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMethod(m)}
            className={
              "px-[12px] py-[6px] rounded-full text-[14px] " +
              (method === m
                ? "bg-accent text-primary"
                : "text-muted-foreground hover:bg-accent")
            }
          >
            {m === "qr" ? t("Código QR") : t("Vincular con número")}
          </button>
        ))}
      </div>

      {errorMessage && (
        <p className="text-destructive font-medium">{errorMessage}</p>
      )}

      {/* Phone input (code method, before start) */}
      {method === "code" && !pairedPending && (
        <label>
          <div className="label">{t("Número de teléfono")}</div>
          <input
            type="tel"
            className="text"
            placeholder="+549..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
      )}

      {/* Pairing artifact */}
      {pairedPending && method === "qr" && qrCode && (
        <div className="flex flex-col items-center gap-[12px]">
          <div className="bg-white p-[12px] rounded-[12px] border border-border">
            <QRCodeSVG value={qrCode} size={220} />
          </div>
          <p className="text-[14px] text-muted-foreground text-center">
            {t(
              "Abrí WhatsApp → Dispositivos vinculados → Vincular un dispositivo y escaneá el código.",
            )}
          </p>
        </div>
      )}

      {pairedPending && method === "code" && pairingCode && (
        <div className="flex flex-col items-center gap-[12px]">
          <div className="text-[28px] font-mono tracking-[0.3em] bg-accent px-[16px] py-[12px] rounded-[12px]">
            {pairingCode}
          </div>
          <p className="text-[14px] text-muted-foreground text-center">
            {t(
              "Abrí WhatsApp → Dispositivos vinculados → Vincular con número de teléfono e ingresá el código.",
            )}
          </p>
        </div>
      )}

      {pairedPending && !qrCode && !pairingCode && (
        <div className="flex items-center gap-[8px] text-muted-foreground">
          <Spinner size={20} />
          {t("Generando...")}
        </div>
      )}

      {/* Actions */}
      {!pairedPending ? (
        <Button
          type="button"
          className="primary bg-[#00ADD8] hover:bg-[#00ADD8]/90 text-white w-full"
          disabled={
            !isOwner || (method === "code" && !isValidPhoneNumber(phone))
          }
          disabledReason={
            !isOwner ? t("Requiere permisos de propietario") : undefined
          }
          loading={start.isPending}
          onClick={beginPairing}
        >
          {method === "qr" ? t("Generar código QR") : t("Obtener código")}
        </Button>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px] text-muted-foreground text-[14px]">
            <Spinner size={16} />
            {t("Esperando vinculación...")}
          </div>
          <button
            type="button"
            className="text-[14px] text-muted-foreground hover:text-foreground"
            onClick={reset}
          >
            {t("Cancelar")}
          </button>
        </div>
      )}
    </div>
  );
}
