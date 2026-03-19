import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/stats/")({
  beforeLoad: () => {
    throw redirect({ to: "/stats/quotas" });
  },
});
