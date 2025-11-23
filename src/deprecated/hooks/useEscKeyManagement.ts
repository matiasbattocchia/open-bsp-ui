// @ts-nocheck
import { useEffect } from "react";
import { useStore } from "zustand";
import useBoundStore from "@/store/useBoundStore";

const useEscKeyManagement = () => {
  const activeConvId = useStore(
    useBoundStore,
    (state) => state.ui.activeConvId,
  );
  const setActiveConv = useStore(
    useBoundStore,
    (state) => state.ui.setActiveConv,
  );
  const toggle = useStore(useBoundStore, (state) => state.ui.toggle);

  const service = useStore(
    useBoundStore,
    (state) =>
      state.chat.conversations.get(state.ui.activeConvId || "")?.service,
  );

  const convType = useStore(
    useBoundStore,
    (state) =>
      state.chat.conversations.get(state.ui.activeConvId || "")?.extra?.type,
  );

  const handleEsc = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      if (activeConvId) {
        setActiveConv(null);
      } else {
        // Do not deselect all as in WhatsApp/Telegram for now
        //setActiveOrg(null)
      }
    } else if (event.key === "Enter" && event.ctrlKey) {
      event.preventDefault();
      if (service === "local" && convType !== "group") {
        // Only the internal service can simulate incoming messages
        toggle("sendAsContact");
      }
    }
  };

  useEffect(() => {
    addEventListener("keydown", handleEsc);

    return () => {
      removeEventListener("keydown", handleEsc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);
};

export { useEscKeyManagement };
