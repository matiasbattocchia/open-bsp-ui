import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgent, useUpdateAgent, useDeleteAgent, useCurrentAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import type { HumanAgentRow, HumanAgentUpdate } from "@/supabase/client";
import SectionItem from "@/components/SectionItem";
import { Bell } from "lucide-react";
import Button from "@/components/Button";

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
      <SectionHeader
        title={agent.name}
        onDelete={() => deleteAgent.mutate(memberId, {
          onSuccess: () => navigate({ to: "..", hash: (prevHash) => prevHash! })
        })}
        deleteDisabled={!isOwner}
        deleteDisabledReason={t("Requiere permisos de propietario")}
      />
      <SectionBody>
        <form
          id="member-form"
          onSubmit={handleSubmit(data => updateAgent.mutate(data))}
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
              placeholder={t("Nombre del miembro")}
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
              placeholder={t("usuario@ejemplo.com")}
              {...register("extra.invitation.email")}
            />
          </label>}
        </form>
      </SectionBody>

      <SectionFooter>
        <Button
          form="member-form"
          type="submit"
          disabled={!isOwner}
          invalid={!isValid || !isDirty}
          loading={updateAgent.isPending}
          disabledReason={t("Requiere permisos de propietario")}
          className="primary"
        >
          {t("Actualizar")}
        </Button>
      </SectionFooter>
    </>
  );
}
