import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCurrentAgents } from "@/queries/useAgents";
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

  const roles = {
    "owner": t("Propietario") as string,
    "admin": t("Administrador") as string,
    "user": t("Usuario") as string,
  };

  return (
    <>
      <SectionHeader title={t("Miembros") as string} />

      <SectionBody className="gap-4">
        <div className="flex flex-col">
          <SectionItem
            title={t("Agregar miembro")}
            aside={
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Plus className="w-5 h-5" />
              </div>
            }
            onClick={() =>
              navigate({
                to: "/settings/members/new",
                hash: (prevHash) => prevHash!,
              })
            }
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
        </div>
      </SectionBody>
    </>
  );
}
