import { type OutgoingStatus } from "@/supabase/client";
import { getHighestStatus, getStatusIcon } from "@/utils/MessageStatusUtils";

export default function StatusIcon(status: OutgoingStatus) {
  const { icon, color } = getStatusIcon(getHighestStatus(status));

  return (
    <svg
      className={
        `w-[16px] ml-[3px] ${color}` +
        (icon === "clock" ? " h-[15px]" : " h-[11px]")
      }
    >
      <use href={`/icons.svg#msg-${icon}`} />
    </svg>
  );
}
