import type { StateCreator } from "zustand";
import type { User } from "@supabase/supabase-js";
import type { AppState } from "./useBoundStore";
import dayjs from "dayjs";
import type { ConversationRow, MessageRow } from "@/supabase/client";

export function isArchived(conv: ConversationRow, msg?: MessageRow) {
  const archivedTimestamp: string | null | undefined = conv.extra?.archived;

  return +new Date(archivedTimestamp || 0) > +new Date(msg?.timestamp || 0);
}

export const Filters = {
  ALL: "todas",
  UNREAD: "pendientes",
  H24: "24h",
  ARCHIVED: "archivadas",
} as const;

export type Filters = (typeof Filters)[keyof typeof Filters];

export const filters: {
  [key in Filters]: (conv: ConversationRow, msg?: MessageRow) => boolean;
} = {
  todas: (conv, msg) => !isArchived(conv, msg),
  pendientes: (conv, msg) =>
    !isArchived(conv, msg) && msg?.direction === "incoming",
  "24h": (conv, msg) =>
    !isArchived(conv, msg) &&
    dayjs(msg?.timestamp || 0).isAfter(dayjs().subtract(1, "day")),
  archivadas: (conv, msg) => isArchived(conv, msg),
} as const;

export type UIState = {
  activeOrgId: string | null;
  activeConvId: string | null;
  user: User | null;
  sendAsContact: boolean;
  filter: keyof typeof filters;
  searchPattern: string;
  isLoading: boolean;
};

export type UIActions = {
  toggle: (component: keyof UIState, value?: boolean) => void;
  setActiveOrg: (id: string | null) => void;
  setActiveConv: (id: string | null) => void;
  setUser: (user: User | null) => void;
  setSendAsContact: (sendAsContact: boolean) => void;
  setFilter: (filter: keyof typeof filters) => void;
  setSearchPattern: (searchPattern: string) => void;
};

export type UISlice = UIState & UIActions;

// @ts-expect-error
export const createUISlice: StateCreator<Partial<AppState>> = (
  set: (
    partial:
      | AppState
      | Partial<AppState>
      | ((state: AppState) => AppState | Partial<AppState>),
    replace?: boolean | undefined,
  ) => void,
) => ({
  templatePicker: false,
  activeOrgId: null,
  activeConvId: null,
  user: null,
  sendAsContact: false,
  filter: "todas" as keyof typeof filters,
  searchPattern: "",
  isLoading: false,
  toggle: (component: keyof UIState, value?: boolean) =>
    set((state) => ({
      ui: {
        ...state.ui,
        [component]: value ?? !state.ui[component],
      },
    })),
  setActiveOrg: (activeOrgId: string | null) =>
    set((state) => ({
      ui: {
        ...state.ui,
        activeOrgId,
      },
    })),
  setActiveConv: (activeConvId: string | null) =>
    set((state) => ({
      ui: {
        ...state.ui,
        activeConvId,
      },
    })),
  setUser: (user: User | null) =>
    set((state) => ({
      ui: {
        ...state.ui,
        user,
      },
    })),
  setSendAsContact: (sendAsContact: boolean) =>
    set((state) => ({
      ui: {
        ...state.ui,
        sendAsContact,
      },
    })),
  setFilter: (filter: keyof typeof filters) =>
    set((state) => ({
      ui: {
        ...state.ui,
        filter,
      },
    })),
  setSearchPattern: (searchPattern: string) =>
    set((state) => ({
      ui: {
        ...state.ui,
        searchPattern,
      },
    })),
});
