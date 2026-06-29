import { WhatsAppOutlined } from "@ant-design/icons";
import { formatPhoneNumber } from "@/utils/FormatUtils";
import { MessageSquareText, RefreshCw } from "lucide-react";

type CardExtra = Record<string, unknown> & {
  waba_id?: string;
  business_name?: string;
  display_phone_number?: string;
  phone_number?: string;
  quality_rating?: string;
  verified_name?: string;
};

type WhatsAppBusinessCardProps = {
  address: string;
  status: string;
  extra: CardExtra | null;
  templateCount?: number;
  onClick: () => void;
  onTestOutbound?: () => void;
  onSyncTemplates?: () => void;
  syncing?: boolean;
};

function qualityLabel(rating: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    GREEN: { label: "High", color: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
    YELLOW: { label: "Medium", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" },
    RED: { label: "Low", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
    UNKNOWN: { label: "Unknown", color: "bg-muted text-muted-foreground" },
  };
  return map[rating] ?? map.UNKNOWN;
}

export default function WhatsAppBusinessCard({
  address,
  status,
  extra,
  templateCount = 0,
  onClick,
  onTestOutbound,
  onSyncTemplates,
  syncing = false,
}: WhatsAppBusinessCardProps) {
  const ex = extra ?? {};

  const businessName =
    (ex.business_name as string) ||
    (ex.waba_id as string) ||
    "Unnamed Business Line";

  const phoneNumber =
    (ex.display_phone_number as string) ||
    formatPhoneNumber((ex.phone_number as string) || address);

  const wabaId = (ex.waba_id as string) || "—";
  const phoneNumberId = address;

  const rating = (ex.quality_rating as string) || "UNKNOWN";
  const q = qualityLabel(rating);

  const verifiedName = ex.verified_name as string | undefined;

  return (
    <div
      className="group cursor-pointer rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all"
      onClick={onClick}
    >
      {/* ── Top section: avatar + name + status ──────────────── */}
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5 p-2 rounded-full bg-[#25D366]/10">
          <WhatsAppOutlined style={{ fontSize: "22px", color: "#25D366" }} />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-foreground font-medium truncate">
              {businessName}
            </span>
            <span
              className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${status === "connected" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
            >
              {status === "connected" ? "Connected" : status}
            </span>
          </div>

          <div className="text-[14px] text-foreground truncate">
            {phoneNumber}
          </div>

          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            {verifiedName && (
              <span className="truncate max-w-[180px]">{verifiedName}</span>
            )}
            <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${q.color}`}>
              {q.label}
            </span>
          </div>
        </div>
      </div>

      {/* ── Separator ────────────────────────────────────────── */}
      <div className="border-t border-border" />

      {/* ── Detail section: IDs ───────────────────────────────── */}
      <div className="px-4 py-3 space-y-1.5">
        <div className="flex items-center text-[12px]">
          <span className="text-muted-foreground w-[55px] shrink-0">
            WABA ID
          </span>
          <span className="text-foreground font-mono truncate">
            {wabaId}
          </span>
        </div>

        <div className="flex items-center text-[12px]">
          <span className="text-muted-foreground w-[55px] shrink-0">
            Phone ID
          </span>
          <span className="text-foreground font-mono truncate">
            {phoneNumberId}
          </span>
        </div>
      </div>

      {/* ── Separator ────────────────────────────────────────── */}
      <div className="border-t border-border" />

      {/* ── Footer: templates count + sync + test outbound ──────── */}
      <div className="px-4 py-2.5 flex items-center gap-2 text-[12px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>
            {templateCount} Template{templateCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex-1" />
        {onSyncTemplates && (
          <button
            type="button"
            className="shrink-0 px-3 py-1 rounded-full text-[12px] bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onSyncTemplates();
            }}
            disabled={syncing}
            title="Sync templates from Meta"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            Sync
          </button>
        )}
        {onTestOutbound && (
          <button
            type="button"
            className="shrink-0 px-3 py-1 rounded-full text-[12px] bg-orange-500 text-white hover:bg-orange-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onTestOutbound();
            }}
          >
            Test Outbound
          </button>
        )}
      </div>
    </div>
  );
}
