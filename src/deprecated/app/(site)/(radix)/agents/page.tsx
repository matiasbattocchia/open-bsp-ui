"use client";

import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import { Flex, Heading, Button, Tabs } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-dialect";

import AgentCard from "./AgentCard";
import AddHumanAgent from "./AddHumanAgent";
import AgentDetails from "./AgentDetails";
import OrganizationDetails from "./OrganizationDetails";

/* Next.js v15 does not support dynamic routes in static rendering
 * See https://github.com/vercel/next.js/discussions/64660
 */

export default function Agents() {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);

  const { data: agents } = useQuery({
    queryKey: [activeOrgId, "agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, picture, ai, user_id, extra->>role, extra->>mode")
        .eq("organization_id", activeOrgId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 60 * 6, // Six hours
    enabled: !!activeOrgId,
  });

  const [display, setDisplay] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [tab, setTab] = useState("organization");
  const { translate: t } = useTranslation();

  const AgentCards = () => {
    return (
      <Flex direction="column" gap="4">
        <Flex gap="4" wrap="wrap">
          {agents?.map((agent) => (
            <AgentCard
              key={agent.id}
              name={agent.name}
              role={agent.role}
              picture={agent.picture}
              ai={agent.ai}
              userId={agent.user_id}
              mode={agent.mode}
              //department={agent.department}
              onClick={() => {
                if (!agent.ai) return;
                setAgentId(agent.id);
                setDisplay(true);
              }}
            />
          ))}
        </Flex>

        <Flex align="center" justify="end" gap="3">
          <AddHumanAgent />
          <Button
            onClick={() => {
              setDisplay(true);
              setAgentId("");
            }}
          >
            {t("Agregar IA")}
          </Button>
        </Flex>
      </Flex>
    );
  };

  return (
    <Flex direction="column" gap="4" p="16px" maxWidth="800px">
      {display ? (
        <AgentDetails setDisplay={setDisplay} agentId={agentId} />
      ) : (
        <>
          <Flex align="center" gap="4">
            <Link href="/" className="lg:hidden">
              <ArrowLeft className="text-gray-icon" />
            </Link>
            <Heading>{t("Agentes")}</Heading>
          </Flex>

          <Tabs.Root
            defaultValue={tab}
            onValueChange={(value) => setTab(value)}
          >
            <Flex direction="column" gap="4">
              <Tabs.List>
                <Tabs.Trigger value="organization">{t("Organización")}</Tabs.Trigger>
                <Tabs.Trigger value="department">{t("Departamento")}</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="organization">
                <OrganizationDetails />
              </Tabs.Content>

              <Tabs.Content value="department">
                <AgentCards />
              </Tabs.Content>
            </Flex>
          </Tabs.Root>
        </>
      )}
    </Flex>
  );
}
