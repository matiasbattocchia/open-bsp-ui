import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/integrations")({
  component: Integrations,
});

function Integrations() {
  return <div className="p-4">Integrations</div>;
}
