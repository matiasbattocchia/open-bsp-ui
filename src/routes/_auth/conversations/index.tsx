import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ChatList from "@/components/ChatList";
import ChatSearch from "@/components/ChatSearch";
import Header from "@/components/Header";
import ChatFilter from "@/components/ChatFilter";
import NoticeCard from "@/components/NoticeCard";
import Spinner from "@/components/Spinner";
import { Bell } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useInvitations, useAnswerInvitation } from "@/queries/useAgents";
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

  const roles: Record<string, string> = {
    owner: t("Propietario"),
    admin: t("Administrador"),
    member: t("Miembro"),
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
      {/* Invitations and quota alerts head the list and scroll with it, the
          same gap apart as its items. */}
      <ChatList
        header={
          (!!invitations?.length || !!alerts?.length) && (
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
            </>
          )
        }
      />
    </>
  );
}
