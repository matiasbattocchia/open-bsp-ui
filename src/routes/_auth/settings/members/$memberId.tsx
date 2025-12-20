import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import SectionBody from "@/components/SectionBody";
import { useTranslation } from "@/hooks/useTranslation";
import { useAgent, useUpdateAgent, useDeleteAgent } from "@/queries/useAgents";
import useBoundStore from "@/stores/useBoundStore";
import { useForm } from "react-hook-form";
import type { HumanAgentExtra } from "@/supabase/client";

type MemberFormValues = {
  name: string;
  extra: HumanAgentExtra;
};

export const Route = createFileRoute("/_auth/settings/members/$memberId")({
  component: EditMember,
});

function EditMember() {
  const { memberId } = Route.useParams();
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const { data: agent } = useAgent(memberId);
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const {
    register,
    handleSubmit,
    formState: { isValid },
  } = useForm<MemberFormValues>({
    values: agent
      ? {
        name: agent.name,
        extra: agent.extra as HumanAgentExtra,
      }
      : undefined,
  });

  if (!agent || agent.ai) return;

  return (
    <>
      <SectionHeader title={agent.name} />

      <SectionBody>
        <form onSubmit={handleSubmit(data => updateAgent.mutate({ id: memberId, ...data }))} className="flex flex-col gap-[32px]">
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

          <button
            type="submit"
            disabled={updateAgent.isPending || !isValid}
            className="bg-primary text-primary-foreground rounded text-[16px] py-[8px]"
          >
            {updateAgent.isPending ? "..." : t("Actualizar")}
          </button>
        </form>


        <button
          className=""
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
          {deleteAgent.isPending ? "..." : t("Eliminar miembro")}
        </button>
      </SectionBody>
    </>
  );
}
