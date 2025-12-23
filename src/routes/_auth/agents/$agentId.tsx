import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import Avatar from "@/components/Avatar";
import { useAgent, useUpdateAgent } from "@/queries/useAgents";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/_auth/agents/$agentId")({
  component: AgentDetails,
});

function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  switch (status) {
    case "active":
      return <span className={`${base} bg-green-100 text-green-800`}>Activo</span>;
    case "inactive":
      return <span className={`${base} bg-red-100 text-red-800`}>Inactivo</span>;
    case "draft":
      return <span className={`${base} bg-yellow-100 text-yellow-800`}>Draft</span>;
    case "pending":
      return <span className={`${base} bg-blue-100 text-blue-800`}>Pendiente</span>;
    default:
      return <span className={`${base} bg-muted/10 text-muted-foreground`}>{status}</span>;
  }
}

function AgentDetails() {
  const { agentId } = Route.useParams();
  const { translate: t } = useTranslation();
  const { data: agent, promise } = useAgent(agentId);
  const updateAgent = useUpdateAgent();

  if (!agent) return null;

  const status = agent.ai
    ? agent.extra?.mode || "active"
    : agent.extra?.invitation?.status === "pending"
    ? "pending"
    : "active";

  async function changeStatus(newStatus: string) {
    if (!agent) return;

    if (agent.ai) {
      // AI agents store status in extra.mode
      await updateAgent.mutateAsync({ id: agent.id, extra: { ...(agent.extra || {}), mode: newStatus } });
    } else {
      // Human agents: store custom active flag in extra.active (non-breaking)
      const active = newStatus === "active";
      await updateAgent.mutateAsync({ id: agent.id, extra: { ...(agent.extra || {}), active } });
    }
  }

  return (
    <>
      <SectionHeader title={agent.name} />

      <SectionBody>
        <div className="flex items-start gap-6">
          <Avatar
            src={agent.picture}
            fallback={agent.name?.substring(0, 2).toUpperCase()}
            size={84}
            className="bg-muted text-muted-foreground"
          />

          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{agent.name}</h2>
              <StatusBadge status={status} />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                className="primary"
                onClick={() => void changeStatus("active")}
                disabled={updateAgent.isPending}
              >
                Activar
              </button>

              <button
                className="destructive"
                onClick={() => void changeStatus("inactive")}
                disabled={updateAgent.isPending}
              >
                Desactivar
              </button>

              {agent.ai && (
                <button
                  className="outline"
                  onClick={() => void changeStatus("draft")}
                  disabled={updateAgent.isPending}
                >
                  Draft
                </button>
              )}
            </div>

            {agent.ai && agent.extra?.description && (
              <p className="mt-3 text-sm text-muted-foreground">
                {agent.extra.description}
              </p>
            )}

            <div className="mt-4 text-sm text-muted-foreground">
              <div>{t("ID")}: {agent.id}</div>
              <div>{t("Tipo")}: {agent.ai ? "AI" : "Humano"}</div>
            </div>
          </div>
        </div>
      </SectionBody>
    </>
  );
}
