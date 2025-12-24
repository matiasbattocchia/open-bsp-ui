import SectionBody from "@/components/SectionBody";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useWebhooks } from "@/queries/useWebhooks";
import SectionItem from "@/components/SectionItem";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Webhook } from "lucide-react";

export const Route = createFileRoute("/_auth/settings/webhooks/")({
  component: ListWebhooks,
});

function ListWebhooks() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: webhooks } = useWebhooks();

  return (
    <>
      <SectionHeader title={t("Webhooks") as string} />

      <SectionBody>
        <SectionItem
          title={t("Agregar webhook")}
          aside={
            <div className="p-[8px] bg-primary/10 rounded-full">
              <Plus className="w-[24px] h-[24px] text-primary" />
            </div>
          }
          onClick={() =>
            navigate({
              to: "/settings/webhooks/new",
              hash: (prevHash) => prevHash!,
            })
          }
        />
        {webhooks?.map((webhook) => (
          <SectionItem
            key={webhook.id}
            title={webhook.url}
            description={`${webhook.table_name} ${webhook.operations.map((operation) => operation.toUpperCase()).join(", ")}`}
            aside={
              <div className="p-[8px]">
                <Webhook className="w-[24px] h-[24px] text-muted-foreground" />
              </div>
            }
            onClick={() =>
              navigate({
                to: `/settings/webhooks/${webhook.id}`,
                hash: (prevHash) => prevHash!,
              })
            }
          />
        ))}
      </SectionBody>
    </>
  );
}
