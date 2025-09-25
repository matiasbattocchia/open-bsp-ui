"use client";

import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import { useState, useEffect } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  Heading,
  Button,
  Flex,
  Text,
  Box,
  Avatar,
  TextArea,
  Slider,
  Switch,
  Tabs,
  Select,
  Spinner,
  SegmentedControl,
  Callout,
  TextField,
} from "@radix-ui/themes";
import { ArrowLeft, Wrench, TriangleAlert } from "lucide-react";
import DeleteAgentButton from "./DeleteAgentButton";
import LabeledTextField from "./LabeledTextInput";
import { useTranslation } from "react-dialect";

export default function AgentDetails({
  setDisplay,
  agentId,
}: {
  setDisplay: (display: boolean) => void;
  agentId: string;
}) {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const [agentIdState, setAgentIdState] = useState(agentId);

  /* 
  // TODO: Do something with this useful data
  const {
    data: availabletoolsAndTools,
    isPending: istoolsAndToolsPending,
  } = useQuery({
    queryKey: [activeOrgId, "tools"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("bot/tools", {
        method: "GET",
      });

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!activeOrgId,
  });
  */

  const { data: agent, isPending: isQueryPending } = useQuery({
    queryKey: [activeOrgId, "agents", agentIdState],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select(
          "picture, name, extra->>description, extra->>model, extra->>instructions, extra->temperature, extra->>mode, ai, extra->tools",
        )
        .eq("id", agentIdState)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!agentIdState,
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    model: "",
    instructions: "",
    temperature: 0.5,
    mode: "inactive",
    tools: "",
  });

  const [alert, setAlert] = useState("");

  useEffect(() => {
    setForm({
      name: agent?.name || "",
      description: agent?.description || "",
      model: agent?.model || "",
      instructions: agent?.instructions || "",
      temperature: Number(agent?.temperature) || 0.5,
      mode: agent?.mode || "inactive",
      tools: JSON.stringify(agent?.tools || [], null, 4),
    });
  }, [agent]);

  const queryClient = useQueryClient();

  const { mutate, isPending: isMutationPending } = useMutation({
    mutationFn: async (_form: typeof form) => {
      let tools;

      try {
        tools = JSON.parse(_form.tools);
      } catch (error) {
        setAlert("Acciones: JSON inválido.");
        throw error;
      }

      const { data, error } = await supabase
        .from("agents")
        .update({
          name: _form.name,
          extra: {
            description: _form.description,
            model: _form.model,
            instructions: _form.instructions,
            temperature: _form.temperature,
            mode: _form.mode,
            tools,
          },
        })
        .eq("id", agentIdState);

      if (error) {
        setAlert(error.details);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [activeOrgId, "agents"] });
      setDisplay(false);
    },
  });

  const { mutate: insertMutation, isPending: isInsertMutationPending } =
    useMutation({
      mutationFn: async (_form: typeof form) => {
        let tools;

        try {
          tools = JSON.parse(_form.tools);
        } catch (error) {
          setAlert("Acciones: JSON inválido.");
          throw error;
        }

        const { data, error } = await supabase
          .from("agents")
          .insert({
            ai: true,
            organization_id: activeOrgId,
            name: _form.name,
            extra: {
              description: _form.description,
              model: _form.model,
              instructions: _form.instructions,
              temperature: _form.temperature,
              mode: _form.mode,
              tools,
            },
          })
          .select()
          .single();

        if (error) {
          setAlert(error.details);
          throw error;
        }

        setAgentIdState(data.id);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [activeOrgId, "agents"] });
        setDisplay(false);
      },
    });

  const { translate: t } = useTranslation();

  return (
    <>
      {/* Heading */}
      <Flex align="center" gap="4">
        <ArrowLeft
          className="text-gray-icon"
          onClick={() => setDisplay(false)}
        />
        <Heading>{agentIdState ? t("Editar IA") : t("Agregar IA")}</Heading>
        {agentIdState && isQueryPending && <Spinner />}
      </Flex>

      {/* On/Off switch */}
      <Flex justify="end" mb="-3">
        <Text as="label" weight="bold" size="2">
          <Flex gap="2" align="center">
            <SegmentedControl.Root
              value={form.mode}
              onValueChange={(value) => {
                setForm({ ...form, mode: value });
              }}
            >
              <SegmentedControl.Item value="active">
                {t("Encendido")}
              </SegmentedControl.Item>
              <SegmentedControl.Item value="draft">
                {t("Borrador")}
              </SegmentedControl.Item>
              <SegmentedControl.Item value="inactive">
                {t("Apagado")}
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          </Flex>
        </Text>
      </Flex>

      {/* Main section */}
      <Flex gap="4" align="center" width="100%">
        {/* Avatar */}
        <Box p="4">
          <Avatar
            src={agent?.picture || undefined}
            radius="full"
            fallback={agent?.name?.charAt(0) || ""}
            size="7"
          />
        </Box>

        {/* Name and description */}
        <Flex direction="column" gap="2" width="100%">
          <LabeledTextField
            label={t("Nombre") as string}
            value={form.name}
            onChange={(value) => setForm({ ...form, name: value })}
            placeholder="Gori"
          />
          <LabeledTextField
            label="Rol"
            value={form.description}
            onChange={(value) => setForm({ ...form, description: value })}
            placeholder={t("Administrativo") as string}
          />
        </Flex>
      </Flex>

      {/* Tabs */}
      <Tabs.Root defaultValue="instructions">
        <Flex direction="column" gap="4">
          <Tabs.List>
            <Tabs.Trigger value="instructions">
              {t("Instrucciones")}
            </Tabs.Trigger>
            <Tabs.Trigger value="actions">
              <Box mr="1">
                <Wrench size={15} />
              </Box>
              {t("Acciones")}
            </Tabs.Trigger>
            <Tabs.Trigger value="knowledge">{t("Conocimiento")}</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="instructions">
            {/* Instructions */}
            <Flex direction="column" gap="2">
              <Flex direction="column">
                <Text as="label" size="2" mb="1" weight="bold">
                  {t("Modelo de IA")}
                </Text>
                <TextField.Root
                  placeholder={t("gpt-5-mini") as string}
                  value={form.model}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, model: e.target.value })
                  }
                />
              </Flex>

              <Flex direction="column">
                <Text as="label" size="2" mb="1" weight="bold">
                  {t("Instrucciones")}
                </Text>
                <TextArea
                  placeholder={t("Tus tareas son...") as string}
                  resize="vertical"
                  value={form.instructions}
                  onChange={(e) =>
                    setForm({ ...form, instructions: e.target.value })
                  }
                />
              </Flex>

              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  {t("Creatividad")}
                </Text>
                <Box maxWidth="300px" p="2">
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={[form.temperature]}
                    onValueChange={([value]) =>
                      setForm({ ...form, temperature: value })
                    }
                  />
                </Box>
              </label>
            </Flex>
          </Tabs.Content>

          <Tabs.Content value="actions">
            <Flex direction="column">
              <Text as="label" size="2" mb="1" weight="bold">
                {t("Herramientas")}
              </Text>
              <TextArea
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                rows={9}
                resize="vertical"
                value={form.tools}
                onChange={(e) => setForm({ ...form, tools: e.target.value })}
              />
            </Flex>
          </Tabs.Content>
        </Flex>
      </Tabs.Root>

      {alert && (
        <Callout.Root color="red" role="alert" onClick={() => setAlert("")}>
          <Callout.Icon>
            <TriangleAlert />
          </Callout.Icon>
          <Callout.Text>{alert}</Callout.Text>
        </Callout.Root>
      )}

      <Flex mt="4" justify="between">
        <Flex>
          {agentIdState && (
            <DeleteAgentButton
              agentId={agentIdState}
              agentName={form.name}
              ai={agent?.ai}
              onDelete={() => setDisplay(false)}
            />
          )}
        </Flex>
        <Flex gap="3">
          <Button variant="soft" color="gray" onClick={() => setDisplay(false)}>
            {t("Cancelar")}
          </Button>
          <Button
            size="2"
            loading={isMutationPending || isInsertMutationPending}
            onClick={() => (agentIdState ? mutate(form) : insertMutation(form))}
          >
            {t("Guardar")}
          </Button>
        </Flex>
      </Flex>
    </>
  );
}
