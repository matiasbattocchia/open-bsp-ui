import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionItem from "@/components/SectionItem";
import { useCurrentAgents } from "@/queries/useAgents";
import Avatar from "@/components/Avatar";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/_auth/agents")({
  component: Agents,
});

function Agents() {
  const { data: agents } = useCurrentAgents();
  const { translate: t } = useTranslation();

  // Show all agents (AI and human)
  const allAgents = agents ?? [];

  return (
    <>
      <SectionHeader title={t("Agentes") as string} />

      <SectionBody>
        {allAgents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("No hay agentes") as string}
          </div>
        ) : (
          allAgents.map((agent) => {
            const statusText = agent.ai
              ? agent.extra?.mode === "active"
                ? "Activo"
                : agent.extra?.mode === "draft"
                ? "Draft"
                : "Inactivo"
              : agent.extra?.invitation?.status === "pending"
              ? "Pendiente"
              : "Activo";

            const agentTypeText = agent.ai ? "AI" : "Humano";

            return (
              <SectionItem
                key={agent.id}
                title={agent.name}
                description={`${agentTypeText} • ${statusText}`}
                aside={
                  <Avatar
                    src={agent.picture}
                    fallback={agent.name?.substring(0, 2).toUpperCase()}
                    size={40}
                    className="bg-primary/10 text-primary"
                  />
                }
                onClick={() => {
                  window.location.href = `/agents/${agent.id}`;
                }}
              />
            );
          })
        )}
      </SectionBody>
    </>
  );
}
