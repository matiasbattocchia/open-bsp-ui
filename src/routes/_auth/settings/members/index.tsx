import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgents, useCurrentAgent } from "@/queries/useAgents";
import SectionItem from "@/components/SectionItem";
import Avatar from "@/components/Avatar";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_auth/settings/members/")({
  component: ListMembers,
});

function ListMembers() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: agents } = useCurrentAgents();
  const { data: agent } = useCurrentAgent();
  const isOwner = agent?.extra?.role === "owner";

  const roles: Record<string, string> = {
    "owner": t("Propietario"),
    "admin": t("Administrador"),
    "user": t("Usuario"),
  };

  return (
    <>
      <SectionHeader title={t("Miembros")} />

      <SectionBody>
        <SectionItem
          title={t("Agregar miembro")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/settings/members/new",
              hash: (prevHash) => prevHash!,
            })
          }
          disabled={!isOwner}
          disabledReason={t("Requiere permisos de propietario")}
        />
        {agents
          ?.filter((agent) => !agent.ai)
          .map((agent) => {
            const role = roles[agent.extra?.role || "user"];
            const pending = agent.extra?.invitation?.status === "pending";

            return (<SectionItem
              key={agent.id}
              title={agent.name}
              description={role + (pending ? ` (${t("pendiente")})` : "")}
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
                  to: `/settings/members/${agent.id}`,
                  hash: (prevHash) => prevHash!,
                })
              }
            />)
          }
          )}
      </SectionBody>
    </>
  );
}
