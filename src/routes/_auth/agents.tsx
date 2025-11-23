import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/agents")({
  component: Agents,
});

function Agents() {
  return <div className="p-4">Agents</div>;
}
