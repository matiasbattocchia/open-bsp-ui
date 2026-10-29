import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ChatList from "@/components/ChatList";
import ChatSearch from "@/components/ChatSearch";
import Header from "@/components/Header";
import ChatFilter from "@/components/ChatFilter";
import NoticeCard from "@/components/NoticeCard";
import Spinner from "@/components/Spinner";
import { Bell } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useInvitations,
  useAnswerInvitation,
  useCurrentAgent,
} from "@/queries/useAgents";
import { useOrganizationsAddresses } from "@/queries/useOrganizationsAddresses";
import { activeIssue, ConnectionIssueCard } from "@/components/ConnectionIssue";
import type { OrganizationAddressRow } from "@/supabase/client";
import { useQuotas } from "@/queries/useBilling";
import QuotaAlert from "@/components/stats/QuotaAlert";
import { quotaStatus } from "@/components/stats/quota";

export const Route = createFileRoute("/_auth/conversations/")({
  component: Conversations,
});

function Conversations() {
  const { translate: t } = useTranslation();
  const { data: invitations } = useInvitations();
  const answerInvitation = useAnswerInvitation();
  const navigate = useNavigate();
  const alerts = useQuotas()?.filter((q) => quotaStatus(q) !== "ok");
  const { data: agent } = useCurrentAgent();
  // Accounts the service disconnected: the organization's, which everyone
  // reads from, and the member's own — a colleague's personal account is
  // theirs to hear about.
  const issues = useOrganizationsAddresses().data?.filter(
    (row) => activeIssue(row) && (!row.agent_id || row.agent_id === agent?.id),
  );

  const roles: Record<string, string> = {
    owner: t("Propietario"),
    admin: t("Administrador"),
    member: t("Miembro"),
  };

  const openConnection = ({ service, address }: OrganizationAddressRow) => {
    const params = { orgAddressId: address };
    const hash = (prevHash?: string) => prevHash!;
    if (service === "whatsapp-web") {
      void navigate({
        to: "/integrations/whatsapp-web/$orgAddressId",
        params,
        hash,
      });
    } else if (service === "instagram") {
      void navigate({
        to: "/integrations/instagram/$orgAddressId",
        params,
        hash,
      });
    } else if (service === "tiktok") {
      void navigate({
        to: "/integrations/tiktok/$orgAddressId",
        params,
        hash,
      });
    } else if (service === "whatsapp") {
      void navigate({
        to: "/integrations/whatsapp/$orgAddressId",
        params,
        hash,
      });
    }
  };

  const handleInvitationAction = (
    invitationId: string,
    answer: "accepted" | "rejected",
  ) => {
    answerInvitation.mutate({ invitationId, answer });
  };

  return (
    <>
      <Header /> {/* height: 59 px */}
      <ChatSearch /> {/* height: 49 px */}
      <ChatFilter /> {/* height: 43 px */}
      {/* Invitations, quota alerts and disconnected accounts head the list
          and scroll with it, the same gap apart as its items. */}
      <ChatList
        header={
          (!!invitations?.length || !!alerts?.length || !!issues?.length) && (
            <>
              {invitations?.map((invitation) => (
                <NoticeCard
                  key={invitation.id}
                  className="bg-primary/10"
                  icon={<Bell className="w-[24px] h-[24px] text-primary" />}
                  title={
                    invitation.organization_name || t("Invitación pendiente")
                  }
                  actions={
                    answerInvitation.isPending ? (
                      <Spinner size={16} />
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            handleInvitationAction(invitation.id, "accepted")
                          }
                          className="font-bold text-primary/90 hover:text-primary cursor-pointer"
                        >
                          {t("Aceptar")}
                        </button>
                        <button
                          onClick={() =>
                            handleInvitationAction(invitation.id, "rejected")
                          }
                          className="font-bold text-muted-foreground/90 hover:text-muted-foreground cursor-pointer"
                        >
                          {t("Rechazar")}
                        </button>
                      </>
                    )
                  }
                >
                  <p>
                    {t("Te invitaron como")}{" "}
                    {roles[invitation.role || "member"]}
                  </p>
                </NoticeCard>
              ))}
              {alerts?.map((quota) => (
                <QuotaAlert
                  key={quota.id}
                  quota={quota}
                  onClick={() =>
                    navigate({
                      to: "/stats/$productId",
                      params: { productId: quota.id },
                      hash: (prevHash) => prevHash!,
                    })
                  }
                />
              ))}
              {issues?.map((row) => (
                <ConnectionIssueCard
                  key={`${row.service}/${row.address}`}
                  row={row}
                  onClick={() => openConnection(row)}
                />
              ))}
            </>
          )
        }
      />
    </>
  );
}
