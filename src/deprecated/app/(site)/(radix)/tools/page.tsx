"use client";

import { Flex, Text, Heading } from "@radix-ui/themes";
import { useTranslation } from "react-dialect";

export default function Tools() {
  const { translate: t } = useTranslation();
  return (
    <Flex direction="column" gap="2" p="16px">
      <Heading>{t("Herramientas")}</Heading>
      <Text>Tools</Text>
    </Flex>
  );
}
