"use client";

import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Dialog, Button, Flex, TextField, Text } from "@radix-ui/themes";
import { useTranslation } from "react-dialect";

export default function AddHumanAgent() {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const { translate: t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!activeOrgId) {
        throw new Error("No active organization");
      }
      await supabase.from("agents").insert({
        organization_id: activeOrgId,
        name,
        ai: false,
        extra: { email },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeOrgId, "agents"] });
      setOpen(false);
      setName("");
      setEmail("");
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>{t("Agregar humano")}</Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="450px">
        <Dialog.Title>{t("Agregar humano")}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          {t(
            "Envía una invitación a un usuario para que se una a tu organización.",
          )}
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              Nombre
            </Text>
            <TextField.Root
              placeholder="Gori"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            <Text as="div" size="2" mb="1" weight="bold">
              {t("Correo electrónico")}
            </Text>
            <TextField.Root
              placeholder="gori@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              {t("Cancelar")}
            </Button>
          </Dialog.Close>

          <Button loading={isPending} onClick={() => mutate()}>
            {t("Invitar")}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
