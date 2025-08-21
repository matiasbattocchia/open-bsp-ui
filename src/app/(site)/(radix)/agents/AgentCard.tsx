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
  onClick,
}: {
  name: string;
  role: string;
  picture?: string | null;
  department?: string;
  ai: boolean;
  userId?: string | null;
  onClick?: () => void;
}) {
  const { translate: t } = useTranslation();
  const activeUserId = useBoundStore((state) => state.ui.session?.id);
  const isActiveUser = activeUserId === userId;

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
        </Flex>
      </Card>
    </Box>
  );
}
