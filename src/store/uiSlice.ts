import { StateCreator } from "zustand";
import { User } from "@supabase/supabase-js";
import useBoundStore, { GoriState } from "./useBoundStore";
import dayjs from "dayjs";
import { ConversationRow, MessageRow } from "@/supabase/client";

export function isArchived(conv: ConversationRow, msg?: MessageRow) {
  const archivedTimestamp: string | null | undefined = conv.extra?.archived;

  return +new Date(archivedTimestamp || 0) > +new Date(msg?.timestamp || 0);
}

export enum Filters {
  ALL = "todas",
  UNREAD = "pendientes",
  H24 = "24h",
  ARCHIVED = "archivadas",
}

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
  menu: boolean;
  organizationsList: boolean;
  leftPanel: boolean;
  rightPanel: boolean;
  templatePicker: boolean;
  newChat: boolean;
  activeOrgId: string | null;
  activeConvId: string | null;
  session: User | undefined;
  sendAsContact: boolean;
  filter: keyof typeof filters;
  searchPattern: string;
  initialized: boolean;
  roles: {
    [orgId: string]: { agentId: string; role: "admin" | "operator" };
  };
};

export type UIActions = {
  toggle: (component: keyof UIState) => void;
  setUI: (ui: Partial<UIState>) => void;
  setActiveOrg: (id: string | null) => void;
  setActiveConv: (id: string | null) => void;
  setSession: (session: User | undefined) => void;
  setSendAsContact: (sendAsContact: boolean) => void;
  setFilter: (filter: keyof typeof filters) => void;
  setSearchPattern: (searchPattern: string) => void;
  setRoles: (roles: {
    [orgId: string]: { agentId: string; role: "admin" | "operator" };
  }) => void;
};

export type UISlice = UIState & UIActions;

export const defaultUIInitState: StateCreator<Partial<GoriState>> = (
  set: (
    partial:
      | GoriState
      | Partial<GoriState>
      | ((state: GoriState) => GoriState | Partial<GoriState>),
    replace?: boolean | undefined,
  ) => void,
) => ({
  menu: false,
  organizationsList: true,
  leftPanel: false,
  rightPanel: false,
  information: false,
  templatePicker: false,
  newChat: false,
  activeOrgId: null,
  activeConvId: null,
  session: undefined,
  sendAsContact: false,
  filter: "todas" as keyof typeof filters,
  searchPattern: "",
  initialized: false,
  roles: {},
  setUI: (ui: Partial<UIState>) =>
    set((state) => ({ ui: { ...state.ui, ...ui } })),
  toggle: (component: keyof UIState) =>
    set((state) => ({
      ui: {
        ...state.ui,
        [component]: !state.ui[component],
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
  setSession: (session: User | undefined) =>
    set((state) => ({
      ui: {
        ...state.ui,
        session,
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
  setRoles: (roles: {
    [orgId: string]: { agentId: string; role: "admin" | "operator" };
  }) =>
    set((state) => ({
      ui: {
        ...state.ui,
        roles,
      },
    })),
});
