import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import SectionFooter from "@/components/SectionFooter";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgent, useUpdateAgent, useDeleteAgent, useCurrentAgent, useCurrentAgents } from "@/queries/useAgents";
import useBoundStore from "@/stores/useBoundStore";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { HumanAgentRow, HumanAgentUpdate } from "@/supabase/client";
import SectionItem from "@/components/SectionItem";
import { Bell } from "lucide-react";
import Button from "@/components/Button";
import SelectField from "@/components/SelectField";

export const Route = createFileRoute("/_auth/settings/members/$memberId")({
  component: EditMember,
});

function EditMember() {
  const { memberId } = Route.useParams();
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { data: agent } = useAgent<HumanAgentRow>(memberId);
  const { data: allAgents } = useCurrentAgents(); // Fetch all agents to check for owners
  const { data: currentAgent } = useCurrentAgent();
  const isOwner = currentAgent?.extra?.role === "owner";
  const isMe = currentAgent?.id === memberId;
  const setActiveOrg = useBoundStore((state) => state.ui.setActiveOrg);
  const queryClient = useQueryClient();

  // Count owners to prevent deleting the last one
  const ownersCount = allAgents?.filter(a => !a.ai && a.extra?.role === "owner").length || 0;
  const isLastOwner = agent?.extra?.role === "owner" && ownersCount <= 1;

  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const onDelete = () => {
    deleteAgent.mutate(memberId, {
      onSuccess: () => {
        if (isMe) {
          // If the user deletes themselves, invalidate organizations and redirect to conversations
          queryClient.invalidateQueries({ queryKey: ["organizations"] });
          setActiveOrg(null);
          navigate({ to: "/conversations" });
        } else {
          navigate({ to: "..", hash: (prevHash) => prevHash! });
        }
      }
    });
  };

  const {
    register,
    handleSubmit,
    control,
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
        onDelete={onDelete}
        deleteDisabled={(!isOwner && !isMe) || (isOwner && isLastOwner && memberId === agent.id)} // Prevent deleting last owner
        deleteDisabledReason={
          isLastOwner
            ? t("No se puede eliminar al único propietario")
            : t("Requiere permisos de propietario")
        }
        deleteLoading={deleteAgent.isPending}
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
              disabled={!isOwner && !isMe}
              placeholder={t("Nombre del miembro")}
              {...register("name", { required: true })}
            />
          </label>

          <SelectField
            name="extra.role"
            control={control}
            label={t("Rol")}
            options={[
              { value: "member", label: t("Miembro") },
              { value: "admin", label: t("Administrador") },
              { value: "owner", label: t("Propietario") },
            ]}
            disabled={!isOwner}
            required
          />

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
          disabled={!isOwner && !isMe}
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
