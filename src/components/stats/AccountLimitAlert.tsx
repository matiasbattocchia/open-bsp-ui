import { useNavigate } from "@tanstack/react-router";
import { useQuotas } from "@/queries/useBilling";
import QuotaAlert from "./QuotaAlert";
import { quotaStatus } from "./quota";

/**
 * The connected accounts' warning card, once the cap leaves no room for one
 * more: what a connect page shows above its disabled button, with the way to
 * a bigger plan. Nothing while there is room.
 */
export default function AccountLimitAlert() {
  const navigate = useNavigate();
  const quota = useQuotas()?.find((q) => q.id === "organizations_addresses");
  if (!quota || quotaStatus(quota) !== "capped") return null;

  return (
    <div className="mb-[12px]">
      <QuotaAlert
        quota={quota}
        onUpgrade={() =>
          navigate({ to: "/settings/plans", hash: (prevHash) => prevHash! })
        }
      />
    </div>
  );
}
