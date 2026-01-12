import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useApiKeys } from "@/queries/useApiKeys";
import { useCurrentAgent } from "@/queries/useAgents";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Key, Plus } from "lucide-react";

export const Route = createFileRoute("/_auth/settings/api-keys/")({
  component: ListApiKeys,
});

function ListApiKeys() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: apiKeys } = useApiKeys();
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";

  const roles: Record<string, string> = {
    owner: t("Propietario"),
    admin: t("Administrador"),
    member: t("Miembro"),
  };

  return (
    <>
      <SectionHeader title={t("Claves API")} />

      <SectionBody>
        <SectionItem
          title={t("Generar clave API")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/settings/api-keys/new",
              hash: (prevHash) => prevHash!,
            })
          }
          disabled={!isOwner}
          disabledReason={t("Requiere permisos de propietario")}
        />
        {apiKeys?.map((apiKey) => (
          <SectionItem
            key={apiKey.id}
            title={apiKey.name}
            description={roles[apiKey.role || "member"]}
            aside={
              <div className="p-[8px]">
                <Key className="w-[24px] h-[24px] text-muted-foreground" />
              </div>
            }
            onClick={() =>
              navigate({
                to: `/settings/api-keys/${apiKey.id}`,
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}
      </SectionBody>
    </>
  );
}
