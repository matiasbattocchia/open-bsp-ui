//===================================
// UI-bespoke typed Database (kept, NOT mirrored from the API's database_types):
// strict user_id-discriminated agent rows (an AI agent is one with no user_id),
// npm `type-fest`, optional organization_id/conversation_id on message Insert,
// and the full Row/Insert/Update + Role alias set the UI relies on.
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
  ConversationExtra,
  OrganizationAddressExtra,
  OrganizationAddressIssue,
  OrganizationExtra,
} from "./extra_types";
import type { ConversationAgentExtra } from "./ui_types";

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

// A human agent is a membership (user_id set); its access-control role is the
// `role` column and it has no defined `extra` (invitations are their own
// table). An AI agent is nobody's membership (user_id null).
export type HumanAgentRow = Omit<AgentRowGenerated, "user_id" | "extra"> & {
  user_id: string;
  extra: null;
};

export type AIAgentRow = Omit<AgentRowGenerated, "user_id" | "extra"> & {
  user_id: null;
  extra: AIAgentExtra | null;
};

type AgentRowStrict = HumanAgentRow | AIAgentRow;

// Only AI agents are insertable: inserting an agent with a user_id is refused
// by the API — people join by accepting an invitation.
export type AIAgentInsert = Omit<AgentInsertGenerated, "user_id" | "extra"> & {
  user_id?: null;
  extra?: AIAgentExtra | null;
};

type AgentInsertStrict = AIAgentInsert;

export type HumanAgentUpdate = Omit<AgentUpdateGenerated, "extra"> & {
  extra?: null;
};

export type AIAgentUpdate = Omit<AgentUpdateGenerated, "extra"> & {
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
          Row: {
            extra: OrganizationAddressExtra | null;
            issue: OrganizationAddressIssue | null;
          };
          Insert: {
            extra?: OrganizationAddressExtra | null;
            issue?: OrganizationAddressIssue | null;
          };
          Update: {
            extra?: OrganizationAddressExtra | null;
            issue?: OrganizationAddressIssue | null;
          };
        };
        conversations: {
          Row: { extra: ConversationExtra | null };
          // address is minted by before_insert for local conversations (the
          // roster, or the row id for group/channel), so the client may omit it.
          Insert: { address?: string; extra?: ConversationExtra | null };
          Update: { extra?: ConversationExtra | null };
        };
        conversations_agents: {
          Row: { extra: ConversationAgentExtra | null };
          Insert: { extra?: ConversationAgentExtra | null };
          Update: { extra?: ConversationAgentExtra | null };
        };
        // `direction` is gone: authorship is the addressing — incoming =
        // sender_address set, outgoing = null, record-only = content.internal
        // (see isIncoming/isOutgoing/isInternal in utils/MessageUtils).
        messages: {
          Row: {
            content: IncomingMessage | OutgoingMessage | InternalMessage;
            status: IncomingStatus | OutgoingStatus;
          };
          Insert: {
            organization_id?: string;
            conversation_id?: string;
            content: IncomingMessage | OutgoingMessage | InternalMessage;
            status?: IncomingStatus | OutgoingStatus;
          };
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

export type ConversationAgentRow =
  Database["public"]["Tables"]["conversations_agents"]["Row"];
export type ConversationAgentInsert =
  Database["public"]["Tables"]["conversations_agents"]["Insert"];
export type ConversationAgentUpdate =
  Database["public"]["Tables"]["conversations_agents"]["Update"];

export type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];
export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export type ContactAddressRow =
  Database["public"]["Tables"]["contacts_addresses"]["Row"];
export type ContactAddressInsert =
  Database["public"]["Tables"]["contacts_addresses"]["Insert"];
export type ContactAddressUpdate =
  Database["public"]["Tables"]["contacts_addresses"]["Update"];

export type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
export type InvitationInsert =
  Database["public"]["Tables"]["invitations"]["Insert"];
export type InvitationUpdate =
  Database["public"]["Tables"]["invitations"]["Update"];

export type OrganizationAddressRow =
  Database["public"]["Tables"]["organizations_addresses"]["Row"];

export type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiKeyInsert = Database["public"]["Tables"]["api_keys"]["Insert"];
export type ApiKeyUpdate = Database["public"]["Tables"]["api_keys"]["Update"];

export type Role = Database["public"]["Enums"]["role"];

/** An AI agent is one that is nobody's membership. */
export function isAIAgent(agent: AgentRow): agent is AIAgentRow {
  return agent.user_id === null;
}

/** A human agent is a membership: its user_id names the person. */
export function isHumanAgent(agent: AgentRow): agent is HumanAgentRow {
  return agent.user_id !== null;
}
