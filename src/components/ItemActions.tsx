import { Dropdown, type MenuProps } from "antd";
import useBoundStore from "@/stores/useBoundStore";
import { type MessageRow } from "@/supabase/client";
import { isArchived } from "@/stores/uiSlice";
import { useTranslation } from "@/hooks/useTranslation";
import { updateConvExtra } from "@/utils/ConversationUtils";

export default function ItemActions({
  children,
  itemId,
  trigger,
  visible,
}: {
  children: React.ReactNode;
  itemId: string;
  trigger: ("contextMenu" | "click" | "hover")[] | undefined;
  visible?: boolean;
}) {
  const conversation = useBoundStore((state) =>
    state.chat.conversations.get(itemId || ""),
  );
  const mostRecentMsg: MessageRow | undefined = useBoundStore(
    (state) =>
      state.chat.messages
        .get(itemId || "")
        ?.values()
        .next().value,
  );

  const { translate: t } = useTranslation();

  if (!conversation) {
    return children;
  }

  const isPinned = conversation.extra?.pinned;

  const isPaused =
    +new Date(conversation.extra?.paused || 0) >
    +new Date() - 12 * 60 * 60 * 1000; // Less than 12 hours ago.

  const items: MenuProps["items"] = [
    {
      label: isPaused ? t("Reanudar asistente") : t("Pausar asistente"),
      key: "0",
      onClick: () =>
        updateConvExtra(conversation, {
          paused: isPaused ? null : new Date().toISOString(),
        }),
    },
    {
      label: isArchived(conversation, mostRecentMsg)
        ? t("Desarchivar chat")
        : t("Archivar chat"),
      key: "1",
      onClick: () =>
        updateConvExtra(conversation, {
          archived: isArchived(conversation, mostRecentMsg)
            ? null
            : new Date().toISOString(),
        }),
    },
    {
      label: isPinned ? t("Desfijar chat") : t("Fijar chat"),
      key: "2",
      onClick: () =>
        updateConvExtra(conversation, {
          pinned: isPinned ? null : new Date().toISOString(),
        }),
    },
    /*{
      label: t("Marcar como no leído"),
      key: "2",
      disabled: true,
    },*/
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={trigger}
      className={`${visible || visible == undefined ? "visible" : "hidden"} rounded-none`}
    >
      {children}
    </Dropdown>
  );
}
