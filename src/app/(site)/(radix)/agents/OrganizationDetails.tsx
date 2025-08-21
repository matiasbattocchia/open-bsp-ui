"use client";

import { Flex, Text, TextArea, Button, RadioCards } from "@radix-ui/themes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import { useTranslation } from "react-dialect";

export default function OrganizationDetails() {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const [prompt, setPrompt] = useState<string | undefined>(undefined);
  const [welcome, setWelcome] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();

  const { data: organization } = useQuery({
    queryKey: [activeOrgId, "organization"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select(
          "extra->>prompt, extra->>ai_agents_mode, extra->>welcome_message",
        )
        .eq("id", activeOrgId!)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 6, // Six hours
    enabled: !!activeOrgId,
  });

  const { mutate: updateOrganization, isPending: isUpdatePending } =
    useMutation({
      mutationFn: async ({
        prompt,
        ai_agents_mode,
        welcome_message,
      }: {
        prompt?: string;
        ai_agents_mode?: string;
        welcome_message?: string;
      }) => {
        await supabase
          .from("organizations")
          .update({ extra: { prompt, ai_agents_mode, welcome_message } })
          .eq("id", activeOrgId!);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [activeOrgId, "organization"],
        });
      },
    });

  const { translate: t } = useTranslation();

  const operationModes = [
    {
      name: t("Automático"),
      value: "active",
      description: t("Los agentes de IA contestan los mensajes entrantes"),
    },
    {
      name: t("Borrador"),
      value: "draft",
      description: t("Los agentes de IA generan borradores que puedes editar"),
    },
    {
      name: t("Manual"),
      value: "inactive",
      description: t("Los agentes de IA descansan mientras haces tu trabajo"),
    },
  ];

  return (
    <Flex direction="column" gap="4">
      <Flex direction="column">
        <Text as="label" size="2" mb="1" weight="bold">
          {t("Modo de operación")}
        </Text>
        <RadioCards.Root
          columns={{ initial: "1", sm: "3" }}
          value={organization?.ai_agents_mode || "active"}
          onValueChange={(value) => {
            updateOrganization({ ai_agents_mode: value });
          }}
        >
          {operationModes.map((mode) => (
            <RadioCards.Item key={mode.value} value={mode.value}>
              <Flex direction="column" width="100%">
                <Text weight="bold">{mode.name}</Text>
                <Text>{mode.description}</Text>
              </Flex>
            </RadioCards.Item>
          ))}
        </RadioCards.Root>
      </Flex>

      <Flex direction="column">
        <Text as="label" size="2" mb="1" weight="bold">
          {t("Mensaje de bienvenida")}
        </Text>
        <TextArea
          rows={4}
          placeholder={t("¡Hola!") as string}
          resize="vertical"
          value={
            welcome === undefined
              ? organization?.welcome_message || ""
              : welcome
          }
          onChange={(e) => setWelcome(e.target.value)}
        />
      </Flex>
      <Flex direction="column">
        <Text as="label" size="2" mb="1" weight="bold">
          {t("Instrucciones generales")}
        </Text>
        <TextArea
          rows={9}
          placeholder={t("Somos...") as string}
          resize="vertical"
          value={prompt === undefined ? organization?.prompt || "" : prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </Flex>
      <Flex gap="3" justify="end">
        <Button
          variant="soft"
          color="gray"
          onClick={() => {
            setPrompt(organization?.prompt);
            setWelcome(organization?.welcome_message);
          }}
          disabled={
            prompt === organization?.prompt &&
            welcome === organization?.welcome_message
          }
        >
          {t("Descartar")}
        </Button>
        <Button
          size="2"
          loading={isUpdatePending}
          onClick={() =>
            updateOrganization({ prompt, welcome_message: welcome })
          }
          disabled={
            prompt === organization?.prompt &&
            welcome === organization?.welcome_message
          }
        >
          {t("Guardar")}
        </Button>
      </Flex>
    </Flex>
  );
}
