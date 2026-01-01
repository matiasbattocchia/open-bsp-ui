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
  const isAdmin = ["admin", "owner"].includes(currentAgent?.extra?.role || "");

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
          disabled={!isAdmin}
          disabledReason={t("Requiere permisos de administrador")}
        />
        {apiKeys?.map((apiKey) => (
          <SectionItem
            key={apiKey.id}
            title={apiKey.name}
            description={apiKey.key.slice(0, 8) + "..."}
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
