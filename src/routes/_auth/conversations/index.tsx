import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ChatList from "@/components/ChatList";
import ChatSearch from "@/components/ChatSearch";
import Header from "@/components/Header";
import ChatFilter from "@/components/ChatFilter";
import SectionItem from "@/components/SectionItem";
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
      {/* Invitations and quota alerts share one stack, so cards of either
          kind sit the same gap apart. */}
      {(!!invitations?.length || !!alerts?.length) && (
        <div className="pt-[10px] pb-[5px] pl-[10px] pr-[20px] flex flex-col gap-[4px]">
          {invitations?.map((invitation) => (
            <div key={invitation.id} className="bg-primary/10 rounded-lg">
              <SectionItem
                // min-h, not h: it has to override SectionItem's own h-[72px],
                // and min-height beats height whatever order the two land in.
                className="min-h-[112px]"
                title={
                  invitation.organization_name || t("Invitación pendiente")
                }
                description={
                  <div className="flex flex-col gap-[6px] w-full">
                    <p>
                      {t("Te invitaron como")}{" "}
                      {roles[invitation.role || "member"]}
                    </p>
                    <div className="flex gap-[16px] justify-end">
                      {answerInvitation.isPending ? (
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
                      )}
                    </div>
                  </div>
                }
                aside={
                  <div className="p-[8px]">
                    <Bell className="w-[24px] h-[24px] text-primary" />
                  </div>
                }
              />
            </div>
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
        </div>
      )}
      <ChatList />
    </>
  );
}
