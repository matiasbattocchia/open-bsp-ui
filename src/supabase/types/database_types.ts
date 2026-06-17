//===================================
// UI-bespoke typed Database (kept, NOT mirrored from the API's database_types):
// strict `ai`-discriminated agent rows, npm `type-fest`, `organization_id?` on
// message Insert, and the full Row/Insert/Update + ContactWithAddresses* + Role
// alias set the UI relies on.
//===================================

import type { Database as DatabaseGenerated, Json, Tables } from "../db_types";
import type { MergeDeep } from "type-fest";
import type {
  IncomingMessage,
  InternalMessage,
  OutgoingMessage,
} from "./message_types";
import type { IncomingStatus, OutgoingStatus } from "./status_types";
import type {
  AIAgentExtra,
  ContactAddressExtra,
  ContactExtra,
  ConversationExtra,
  HumanAgentExtra,
  OrganizationAddressExtra,
  OrganizationExtra,
} from "./extra_types";
import type { HumanAgentExtraInsert, HumanAgentExtraUpdate } from "./ui_types";

export type { Json, Tables };

// Helper to remove agents from the generated DB
type DatabaseGeneratedWithoutAgents = {
  public: Omit<DatabaseGenerated["public"], "Tables"> & {
    Tables: Omit<DatabaseGenerated["public"]["Tables"], "agents">;
  };
} & Omit<DatabaseGenerated, "public">;

// Explicitly define the agents definitions that we want
// Note: this is because MergeDeep is not doing a great job for this case
type AgentRowGenerated = DatabaseGenerated["public"]["Tables"]["agents"]["Row"];
type AgentInsertGenerated =
  DatabaseGenerated["public"]["Tables"]["agents"]["Insert"];
type AgentUpdateGenerated =
  DatabaseGenerated["public"]["Tables"]["agents"]["Update"];

export type HumanAgentRow = Omit<AgentRowGenerated, "ai" | "extra"> & {
  ai: false;
  extra: HumanAgentExtra | null;
};

export type AIAgentRow = Omit<AgentRowGenerated, "ai" | "extra"> & {
  ai: true;
  extra: AIAgentExtra | null;
};

type AgentRowStrict = HumanAgentRow | AIAgentRow;

export type HumanAgentInsert = Omit<AgentInsertGenerated, "ai" | "extra"> & {
  ai: false;
  extra?: HumanAgentExtraInsert | null;
};

export type AIAgentInsert = Omit<AgentInsertGenerated, "ai" | "extra"> & {
  ai: true;
  extra?: AIAgentExtra | null;
};

type AgentInsertStrict = HumanAgentInsert | AIAgentInsert;

export type HumanAgentUpdate = Omit<AgentUpdateGenerated, "ai" | "extra"> & {
  ai?: false;
  extra?: HumanAgentExtraUpdate | null;
};

export type AIAgentUpdate = Omit<AgentUpdateGenerated, "ai" | "extra"> & {
  ai?: true;
  extra?: AIAgentExtra | null;
};

type AgentUpdateStrict = HumanAgentUpdate | AIAgentUpdate;

export type Database = MergeDeep<
  DatabaseGeneratedWithoutAgents,
  {
    public: {
      Tables: {
        organizations: {
          Row: { extra: OrganizationExtra | null };
          Insert: { extra?: OrganizationExtra | null };
          Update: { extra?: OrganizationExtra | null };
        };
        organizations_addresses: {
          Row: { extra: OrganizationAddressExtra | null };
          Insert: { extra?: OrganizationAddressExtra | null };
          Update: { extra?: OrganizationAddressExtra | null };
        };
        conversations: {
          Row: { extra: ConversationExtra | null };
          Insert: { extra?: ConversationExtra | null };
          Update: { extra?: ConversationExtra | null };
        };
        messages: {
          Row:
            | {
                direction: "incoming";
                content: IncomingMessage;
                status: IncomingStatus;
              }
            | {
                direction: "internal";
                content: InternalMessage;
                status: IncomingStatus;
              }
            | {
                direction: "outgoing";
                content: OutgoingMessage;
                status: OutgoingStatus;
              };
          Insert:
            | {
                organization_id?: string;
                conversation_id?: string;
                direction: "incoming";
                content: IncomingMessage;
                status?: IncomingStatus;
              }
            | {
                organization_id?: string;
                conversation_id?: string;
                direction: "internal";
                content: InternalMessage;
                status?: IncomingStatus;
              }
            | {
                organization_id?: string;
                conversation_id?: string;
                direction: "outgoing";
                content: OutgoingMessage;
                status?: OutgoingStatus;
              };
        };
        contacts: {
          Row: { extra: ContactExtra | null };
          Insert: { extra?: ContactExtra | null };
          Update: { extra?: ContactExtra | null };
        };
        contacts_addresses: {
          Row: { extra: ContactAddressExtra | null };
          Insert: { extra?: ContactAddressExtra | null };
          Update: { extra?: ContactAddressExtra | null };
        };
        agents: {
          Row: AgentRowStrict;
          Insert: AgentInsertStrict;
          Update: AgentUpdateStrict;
          Relationships: DatabaseGenerated["public"]["Tables"]["agents"]["Relationships"];
        };
      };
    };
  }
>;

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

export type ConversationRow =
  Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationInsert =
  Database["public"]["Tables"]["conversations"]["Insert"];
export type ConversationUpdate =
  Database["public"]["Tables"]["conversations"]["Update"];

export type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];
export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export type ContactRow = Database["public"]["Tables"]["contacts"]["Row"];
export type ContactInsert = Database["public"]["Tables"]["contacts"]["Insert"];
export type ContactUpdate = Database["public"]["Tables"]["contacts"]["Update"];

export type ContactAddressRow =
  Database["public"]["Tables"]["contacts_addresses"]["Row"];
export type ContactAddressInsert =
  Database["public"]["Tables"]["contacts_addresses"]["Insert"];
export type ContactAddressUpdate =
  Database["public"]["Tables"]["contacts_addresses"]["Update"];

export type ContactWithAddressesRow = ContactRow & {
  addresses: ContactAddressRow[];
};
export type ContactWithAddressesInsert = ContactInsert & {
  addresses: ContactAddressUpdate[];
};
export type ContactWithAddressesUpdate = ContactUpdate & {
  addresses: ContactAddressUpdate[];
};

export type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export type OrganizationAddressRow =
  Database["public"]["Tables"]["organizations_addresses"]["Row"];

export type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiKeyInsert = Database["public"]["Tables"]["api_keys"]["Insert"];
export type ApiKeyUpdate = Database["public"]["Tables"]["api_keys"]["Update"];

export type Role = Database["public"]["Enums"]["role"];
