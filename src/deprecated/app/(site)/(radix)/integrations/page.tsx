"use client";

import { Flex, Text, Heading, Button, TextArea } from "@radix-ui/themes";
import { useTranslation } from "react-dialect";

export default function Integrations() {
  const { translate: t } = useTranslation();
  return (
    <Flex direction="column" gap="2" p="16px">
      <Heading>{t("Integraciones")}</Heading>
      <Button>{t("Conectar API")}</Button>
      <Text>{t("Herramientas")}</Text>
      <TextArea />
    </Flex>
  );
}
