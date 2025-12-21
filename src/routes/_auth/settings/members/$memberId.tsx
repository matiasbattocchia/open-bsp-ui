import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgent, useUpdateAgent, useDeleteAgent } from "@/queries/useAgents";
import { useForm } from "react-hook-form";
import type { HumanAgentRow, HumanAgentUpdate } from "@/supabase/client";

export const Route = createFileRoute("/_auth/settings/members/$memberId")({
  component: EditMember,
});

function EditMember() {
  const { memberId } = Route.useParams();
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const { promise, data: agent } = useAgent<HumanAgentRow>(memberId);
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<HumanAgentUpdate>({
    defaultValues: async () => {
      const agent = await promise;
      return agent
    },
  });

  if (!agent) return

  const invitation = agent.extra?.invitation

  return (
    <>
      <SectionHeader title={agent.name} />

      <SectionBody>
        {invitation && invitation.status === "pending" && (
          <div className="rounded-xl text-foreground bg-primary/10 border border-primary p-[16px]">
            {t("Invitación pendiente")}
          </div>
        )}

        <form onSubmit={handleSubmit(data => updateAgent.mutate({ id: memberId, ...data }))} className="flex flex-col gap-[14px] pb-[14px] grow">
          <label>
            <div className="label">{t("Nombre")}</div>
            <input
              className="text"
              {...register("name", { required: true })}
            />
          </label>

          <label>
            <div className="label">{t("Rol")}</div>
            <select
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
            disabled={updateAgent.isPending || !isValid}
            className="primary"
          >
            {updateAgent.isPending ? "..." : t("Actualizar")}
          </button>
        </form>
      </SectionBody>
    </>
  );
}
