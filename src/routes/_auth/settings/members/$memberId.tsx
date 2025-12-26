import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgent, useUpdateAgent, useDeleteAgent, useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import type { HumanAgentRow, HumanAgentUpdate } from "@/supabase/client";
import SectionItem from "@/components/SectionItem";
import { Bell } from "lucide-react";

export const Route = createFileRoute("/_auth/settings/members/$memberId")({
  component: EditMember,
});

function EditMember() {
  const { memberId } = Route.useParams();
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: agent } = useAgent<HumanAgentRow>(memberId);
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";

  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const {
    register,
    handleSubmit,
    formState: { isValid, isDirty },
  } = useForm<HumanAgentUpdate>({
    values: agent,
  });

  if (!agent) return

  const invitation = agent.extra?.invitation

  return (
    <>
      <SectionHeader title={agent.name} />
      <SectionBody>
        <form
          onSubmit={handleSubmit(data => updateAgent.mutate(data))}
          className="flex flex-col gap-[16px] pb-[14px] grow"
        >
          {invitation && invitation.status === "pending" && (
            <SectionItem
              title={t("Invitación pendiente")}
              aside={
                <div className="p-[8px]">
                  <Bell className="w-[24px] h-[24px] text-primary" />
                </div>
              }
              className="bg-primary/10"
            />
          )}

          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              className="text"
              disabled={!isOwner}
              {...register("name", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Rol")}</div>
            <select
              disabled={!isOwner}
              {...register("extra.role", { required: true })}
            >
              <option value="user">{t("Usuario")}</option>
              <option value="admin">{t("Administrador")}</option>
              <option value="owner">{t("Propietario")}</option>
            </select>
          </label>

          {invitation && invitation.status === "pending" && <label>
            <div className="label">{t("Correo electrónico")}</div>
            <input
              type="email"
              className="text"
              disabled
              {...register("extra.invitation.email")}
            />
          </label>}

          <div className="grow" />

          {isOwner && (
            <>
              <button
                className="destructive"
                onClick={() =>
                  deleteAgent.mutate(memberId, {
                    onSuccess: () =>
                      navigate({
                        to: "..",
                        hash: (prevHash) => prevHash!,
                      }),
                  })
                }
                disabled={deleteAgent.isPending}
              >
                {deleteAgent.isPending ? "..." : t("Eliminar")}
              </button>

              <button
                type="submit"
                disabled={updateAgent.isPending || !isValid || !isDirty}
                className="primary"
              >
                {updateAgent.isPending ? "..." : t("Actualizar")}
              </button>
            </>
          )}
        </form>
      </SectionBody>
    </>
  );
}
