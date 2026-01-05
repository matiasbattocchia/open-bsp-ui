import { createFileRoute } from "@tanstack/react-router";
import ChatList from "@/components/ChatList";
import ChatSearch from "@/components/ChatSearch";
import Header from "@/components/Header";
import ChatFilter from "@/components/ChatFilter";
import SectionItem from "@/components/SectionItem";
import { Bell } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useInvitations, useUpdateAgent } from "@/queries/useAgents";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_auth/conversations/")({
  component: Conversations,
});

function Conversations() {
  const { translate: t } = useTranslation();
  const { data: invitations } = useInvitations();
  const queryClient = useQueryClient();
  const updateAgent = useUpdateAgent();

  const roles: Record<string, string> = {
    "owner": t("Propietario"),
    "admin": t("Administrador"),
    "user": t("Usuario"),
  };

  const handleInvitationAction = (agentId: string, status: "accepted" | "rejected") => {
    updateAgent.mutate({
      id: agentId,
      extra: {
        invitation: {
          status,
        },
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["invitations"] })
        queryClient.invalidateQueries({ queryKey: ["organizations"] })
      }
    });
  };

  return (
    <>
      <Header /> {/* height: 59 px */}
      <ChatSearch /> {/* height: 49 px */}
      <ChatFilter /> {/* height: 43 px */}

      {invitations && invitations.length > 0 && (
        <div className="pt-[10px] pb-[5px] pl-[10px] pr-[20px] flex flex-col gap-[4px]">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="bg-primary/10 rounded-lg">
              <SectionItem
                className="h-[92px]"
                title={t("Invitación pendiente")}
                description={
                  <div className="flex flex-col gap-[6px] w-full">
                    <p>{invitation.extra!.invitation!.organization_name} ({roles[invitation.extra!.role || "member"]})</p>
                    <div className="flex gap-[16px] justify-end">
                      <button
                        onClick={() => handleInvitationAction(invitation.id, "accepted")}
                        className="font-bold text-primary/90 hover:text-primary cursor-pointer"
                        disabled={updateAgent.isPending}
                      >
                        {t("Aceptar")}
                      </button>
                      <button
                        onClick={() => handleInvitationAction(invitation.id, "rejected")}
                        className="font-bold text-muted-foreground/90 hover:text-muted-foreground cursor-pointer"
                        disabled={updateAgent.isPending}
                      >
                        {t("Rechazar")}
                      </button>
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
        </div>
      )}


      <ChatList />
    </>
  );
}
