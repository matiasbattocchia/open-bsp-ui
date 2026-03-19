import { useLocation } from "@tanstack/react-router";
import StatsQuotas from "./StatsQuotas";
import StatsUsage from "./StatsUsage";

export default function StatsCenter() {
  const pathname = useLocation({ select: (l) => l.pathname });

  if (pathname === "/stats/usage") return <StatsUsage />;
  return <StatsQuotas />;
}
