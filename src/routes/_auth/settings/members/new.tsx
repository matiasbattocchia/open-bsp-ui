import { createFileRoute, useNavigate } from "@tanstack/react-router";
import SectionHeader from "@/components/SectionHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useCreateAgent } from "@/queries/useAgents";
import { MemberForm } from "./MemberForm";

export const Route = createFileRoute("/_auth/settings/members/new")({
  component: AddMember,
});

function AddMember() {
  const { translate: t } = useTranslation();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();

  const onSubmit = (data) => {
    createAgent.mutate(data, {
      onSuccess: (agent) =>
        navigate({
          to: `/settings/members/${agent!.id}`,
          hash: (prevHash) => prevHash!,
        }),
    });
  };

  return (
    <>
      <SectionHeader title={t("Agregar miembro") as string} />
      <MemberForm
        onSubmit={onSubmit}
        isPending={createAgent.isPending}
        submitText={t("Invitar") as string}
      />
    </>
  );
}
