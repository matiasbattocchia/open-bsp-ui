import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/integrations/")({
  component: IntegrationsIndex,
});

function IntegrationsIndex() {
  return null;
}
