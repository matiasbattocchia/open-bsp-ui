import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ChatSlice, defaultChatInitState } from "./chatSlice";
import { UISlice, defaultUIInitState } from "./uiSlice";

export type GoriState = {
  chat: ChatSlice;
  ui: UISlice;
};

const useBoundStore = create<GoriState>()(
  persist(
    (set, get, api) => ({
      chat: defaultChatInitState(set, get, api) as ChatSlice,
      ui: defaultUIInitState(set, get, api) as UISlice,
    }),
    {
      name: "gori-state",
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value: any) => {
          // Just in case we decide to store maps
          if (value && value.type === "map") {
            return new Map(value);
          }
          return value;
        },
        replacer: (key, value) => {
          // Just in case we decide to store maps
          if (value instanceof Map) {
            return { type: "map", value: Array.from(value.entries()) };
          }
          return value;
        },
      }),
      // Restore the state after hydration
      onRehydrateStorage: (prev) => (state) => {
        if (state) {
          state.ui = {
            ...defaultUIInitState,
            ...prev.ui,
            ...state.ui,
          };
        }
      },
      // Pick the keys to be persisted
      partialize: (state) => ({
        ui: {
          searchPattern: state.ui.searchPattern,
          filter: state.ui.filter,
          organizationsList: state.ui.organizationsList,
          activeOrgId: state.ui.activeOrgId,
        },
      }),
    },
  ),
);

export default useBoundStore;

// TODO: for real
export function reset() {
  useBoundStore.setState((state) => {
    return {
      ui: {
        ...state.ui,
        activeOrgId: null,
        activeConvId: null,
        initialized: false,
      },
      chat: {
        ...state.chat,
        organizations: new Map(),
        conversations: new Map(),
        messages: new Map(),
      },
    };
  });
}
