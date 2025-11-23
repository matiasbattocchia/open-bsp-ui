"use client";

import useBoundStore from "@/store/useBoundStore";
import { Box, Card, Flex, Avatar, Text } from "@radix-ui/themes";
import { useTranslation } from "react-dialect";

export default function AgentCard({
  name,
  role,
  picture,
  department,
  ai,
  userId,
  mode,
  onClick,
}: {
  name: string;
  role: string;
  picture?: string | null;
  department?: string;
  ai: boolean;
  userId?: string | null;
  mode?: string;
  onClick?: () => void;
}) {
  const { translate: t } = useTranslation();
  const activeUserId = useBoundStore((state) => state.ui.session?.id);
  const isActiveUser = activeUserId === userId;

  // Function to get status display info
  const getStatusInfo = () => {
    if (!ai) return null; // Only show status for AI agents
    
    switch (mode) {
      case 'active':
        return { text: 'ON', color: 'green' as const, bg: 'bg-green-100' };
      case 'draft':
        return { text: 'DRAFT', color: 'amber' as const, bg: 'bg-amber-100' };
      case 'inactive':
      default:
        return { text: 'OFF', color: 'red' as const, bg: 'bg-red-100' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Box width="240px">
      <Card style={{ cursor: "pointer" }} onClick={onClick}>
        <Flex gap="3" align="center">
          <Avatar
            size="3"
            src={picture || undefined}
            radius="full"
            fallback={name.charAt(0)}
          />
          <Box style={{ flex: 1 }}>
            <Flex justify="between" align="start">
              <Box>
                <Text as="div" size="2" weight="bold">
                  {name}
                </Text>
                <Text as="div" size="2" color="gray">
                  {department}
                </Text>
                <Text as="div" size="2" color="gray">
                  {ai ? "IA" : isActiveUser ? t("Vos") : t("Humano")}{" "}
                  {!ai && !userId && t("(pendiente)")}
                </Text>
              </Box>
              {statusInfo && (
                <Box>
                  <Text 
                    as="span" 
                    size="1" 
                    weight="bold"
                    className={`px-2 py-1 rounded-full text-xs ${statusInfo.bg}`}
                    style={{ 
                      color: statusInfo.color === 'green' ? '#059669' : 
                             statusInfo.color === 'amber' ? '#D97706' : '#DC2626'
                    }}
                  >
                    {statusInfo.text}
                  </Text>
                </Box>
              )}
            </Flex>
          </Box>
        </Flex>
      </Card>
    </Box>
  );
}
