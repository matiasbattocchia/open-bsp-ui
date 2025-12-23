import { createFileRoute } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { useCurrentAgents } from "@/queries/useAgents";
import AgentCard from "@/components/AgentCard";
import { useTranslation } from "@/hooks/useTranslation";

export const Route = createFileRoute("/_auth/agents")({
  component: Agents,
});

function Agents() {
  const { data: agents } = useCurrentAgents();
  const { translate: t } = useTranslation();

  return (
    <>
      <SectionHeader title={t("Agentes") as string} />

      <SectionBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </SectionBody>
    </>
  );
}
