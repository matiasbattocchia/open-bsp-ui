import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgents, useCurrentAgent } from "@/queries/useAgents";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import Avatar from "@/components/Avatar";
import type { JSX } from "react";

export const Route = createFileRoute("/_auth/agents/")({
  component: ListAgents,
});

function ListAgents() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: agents } = useCurrentAgents();
  const { data: currentAgent } = useCurrentAgent();
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");

  const modeLabels: Record<string, string | JSX.Element> = {
    active: <span className="text-primary">{t("Activo")}</span>,
    draft: t("Borrador"),
    inactive: t("Inactivo"),
  };

  return (
    <>
      <SectionHeader title={t("Agentes")} />

      <SectionBody>
        <SectionItem
          title={t("Agregar agente")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/agents/new",
              hash: (prevHash) => prevHash!,
            })
          }
          disabled={!isAdmin}
          disabledReason={t("Requiere permisos de administrador")}
        />
        {agents?.filter(a => a.ai).map((agent) => (
          <SectionItem
            key={agent.id}
            title={agent.name}
            description={modeLabels[agent.extra?.mode || ""]}
            aside={
              <Avatar
                src={agent.picture}
                fallback={agent.name?.substring(0, 2).toUpperCase()}
                size={40}
                className="bg-muted text-muted-foreground"
              />
            }
            onClick={() =>
              navigate({
                to: `/agents/${agent.id}`,
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}
        {agents?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {t("No tienes agentes AI configurados.")}
          </div>
        )}
      </SectionBody>
    </>
  );
}
