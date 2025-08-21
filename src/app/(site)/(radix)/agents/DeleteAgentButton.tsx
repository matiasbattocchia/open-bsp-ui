"use client";

import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { AlertDialog, Button, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-dialect";

export default function DeleteAgentButton({
  agentId,
  agentName,
  ai,
  onDelete,
}: {
  agentId: string;
  agentName: string;
  ai?: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await supabase.from("agents").delete().eq("id", agentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeOrgId, "agents"] });
      setOpen(false);
      onDelete();
    },
  });

  const { translate: t } = useTranslation();

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger>
        <Button color="red">{t("Eliminar")}</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Content maxWidth="450px">
        <AlertDialog.Title>{t("Eliminar agente")}</AlertDialog.Title>
        <AlertDialog.Description size="2">
          {t("¿Estás seguro de querer eliminar a")} {agentName} ({ai ? "IA" : "Humano"}
          )?
        </AlertDialog.Description>

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">
              {t("Cancelar")}
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button
              variant="solid"
              color="red"
              onClick={() => mutate()}
              loading={isPending}
            >
              {t("Eliminar")}
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
