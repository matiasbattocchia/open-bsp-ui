import { createClient } from "@supabase/supabase-js";
import type { Database as DatabaseGenerated, Json, Tables } from "./db_types";
import type { MergeDeep } from "type-fest";

//===================================
// Copied from matiasbattocchia/open-bsp-api/supabase/functions/_shared/supabase.ts
// without
// - imports
// - webhook types
// - endpoint types
// - clients
//===================================

// This is what Supabase webhooks send to functions
export type WebhookPayload<Record> = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record | null;
  old_record: Record | null;
};

export type WebhookError = {
  code: number;
  title: string;
  message: string;
  error_data: {
    details: string;
  };
  href: string;
};

// Data based

// This message type is produced when the user interacts with a template message button.
export type ButtonMessage = {
  type: "button";
  button: {
    text: string;
    payload: string;
  };
};

// This message type is produced when the user interacts with an interactive message button or list option.
export type InteractiveMessage = {
  type: "interactive";
  interactive:
  | { type: "button_reply"; button_reply: { id: string; title: string } }
  | {
    type: "list_reply";
    list_reply: { id: string; title: string; description?: string };
  };
};

// ORDER

export type Order = {
  catalog_id: string;
  product_items: {
    product_retailer_id: string;
    quantity: string;
    item_price: string;
    currency: string;
  }[];
  text: string;
};

export type OrderMessage = {
  type: "order";
  order: Order;
};

// CONTACTS

export type Contact = {
  name: {
    first_name?: string;
    formatted_name: string;
    last_name?: string;
    middle_name?: string;
    suffix?: string;
    prefix?: string;
  };
  phones?: {
    phone: string;
    type: string;
    wa_id?: string;
  }[];
};

// LOCATION

export type Location = {
  address: string;
  latitude: number;
  longitude: number;
  name: string;
  url?: string;
};

//===================================
// Outgoing message, as stored in the database
//===================================

// TEMPLATE

// Template data, used to create or update a template message

export type TemplateData = {
  id: string;
  name: string;
  status:
  | "APPROVED"
  | "IN_APPEAL"
  | "PENDING"
  | "REJECTED"
  | "PENDING_DELETION"
  | "DELETED"
  | "DISABLED"
  | "PAUSED"
  | "LIMIT_EXCEEDED";
  category: "MARKETING" | "UTILITY"; // TODO: service and auth categories - cabra 2024/09/12
  language: string;
  components: (
    | BodyComponent
    | HeaderComponent
    | FooterComponent
    | ButtonsComponent
  )[];
  sub_category: "CUSTOM";
};

type HeaderComponent = {
  type: "HEADER";
  text: string;
  format: "TEXT"; // TODO: other formats such as image - cabra 2024/09/12
  example?: {
    header_text: [string];
  };
};

type BodyComponent = {
  type: "BODY";
  text: string;
  example?: {
    body_text: [string[]];
  };
};

type FooterComponent = {
  type: "FOOTER";
  text: string;
};

type ButtonsComponent = {
  type: "BUTTONS";
  buttons: QuickReply[]; // TODO: call to action buttons - cabra 2024/09/12
};

type QuickReply = {
  type: "QUICK_REPLY";
  text: string;
};

// Template message, used to send a template message

type CurrencyParameter = {
  type: "currency";
  currency: {
    fallback_value: string;
    code: string; // ISO 4217
    amount_1000: number;
  };
};

type DateTimeParameter = {
  type: "date_time";
  date_time: {
    fallback_value: string;
    // localization is not attempted by Cloud API, fallback_value is always used
  };
};

type TextParameter = {
  type: "text";
  text: string;
};

export type OutgoingImage = {
  type: "image";
  image: ({ id: string } | { link: string }) & { caption?: string };
};

export type OutgoingVideo = {
  type: "video";
  video: ({ id: string } | { link: string }) & { caption?: string };
};

export type OutgoingDocument = {
  type: "document";
  document: ({ id: string } | { link: string }) & {
    caption?: string;
    filename?: string;
  };
};

type TemplateParameter =
  | CurrencyParameter
  | DateTimeParameter
  | TextParameter
  | OutgoingImage
  | OutgoingVideo
  | OutgoingDocument;

type TemplateHeader = {
  type: "header";
  parameters?: TemplateParameter[];
};

type TemplateBody = {
  type: "body";
  parameters?: TemplateParameter[];
};

type TemplateButton =
  & {
    type: "button";
    index: string; // 0-9
  }
  & (
    | {
      sub_type: "quick_reply";
      parameters: {
        type: "payload";
        payload: string;
      }[];
    }
    | {
      sub_type: "url";
      parameters: {
        type: "url";
        text: string;
      }[];
    }
  );

export type Template = {
  components?: (TemplateHeader | TemplateBody | TemplateButton)[];
  language: {
    code: string; // es, es_AR, etc
    policy: "deterministic";
  };
  name: string;
};

export type TemplateMessage = {
  type: "template";
  template: Template;
};

// TODO: InteractiveMessage

//===================================
// Agent Protocol Types
//===================================

// The same message can be a task request and a task response.
// A user message is a task request. The message produced by an agent is a task response.
// Then, for example, another agent might react to that message, creating a new task request.
// The message is now a task response and a task request.
export type TaskInfo = {
  task?: {
    id: string;
    status?: string;
    session_id?: string;
  };
};

export type ToolInfo = {
  tool?:
  & ToolEventInfo
  & (LocalToolInfo | GoogleToolInfo | OpenAIToolInfo | AnthropicToolInfo);
};

export type ToolEventInfo =
  | { use_id: string; event: "use" }
  | { use_id: string; event: "result"; is_error?: boolean };

type LocalSimpleToolInfo = {
  provider: "local";
  type: "function" | "custom";
  name: string;
};

type LocalSpecialToolInfo = {
  provider: "local";
  type: "mcp" | "sql" | "http";
  label: string;
  name: string;
};

export type LocalToolInfo = LocalSimpleToolInfo | LocalSpecialToolInfo;

type GoogleToolInfo = {
  provider: "google";
  type: "google_search" | "code_execution" | "url_context";
};

type OpenAIToolInfo = {
  provider: "openai";
  type:
  | "mcp"
  | "web_search_preview"
  | "file_search"
  | "image_generation"
  | "code_interpreter"
  | "computer_use_preview";
};

type AnthropicToolInfo = {
  provider: "anthropic";
  type:
  | "mcp"
  | "bash"
  | "code_execution"
  | "computer"
  | "str_replace_based_edit_tool"
  | "web_search";
};

// Text based

export type TextPart = {
  type: "text";
  kind: "text" | "reaction" | "caption" | "transcription" | "description";
  text: string;
  artifacts?: Part[];
};

// File based

export const MediaTypes = [
  "audio",
  "image",
  "video",
  "document",
  "sticker",
] as const;

/**
 * Represents a file, such as an image, video, or document.
 * WhatsApp allows media messages to include an accompanying text caption.
 * For now, this caption is embedded directly within the `text` attribute of the `FilePart`.
 * A more structured approach, leveraging the `Parts` type, would involve separate
 * `FilePart` and `TextPart` components for such messages in the future.
 */
export type FilePart = {
  type: "file";
  kind: (typeof MediaTypes)[number];
  file: {
    mime_type: string;
    uri: string; // --> internal://media/organizations/${organization_id}/attachments/${file_hash}
    name?: string;
    size: number;
  };
  text?: string; // caption
  artifacts?: Part[];
};

// Data based

export type DataPart<Kind = "data", T = Json> = {
  type: "data";
  kind: Kind;
  data: T;
  artifacts?: Part[];
};

type ContactsPart = DataPart<"contacts", Contact[]>;

type LocationPart = DataPart<"location", Location>;

type OrderPart = DataPart<"order", Order>;

type InteractivePart = DataPart<
  "interactive",
  InteractiveMessage["interactive"]
>;

type ButtonPart = DataPart<"button", ButtonMessage["button"]>;

type TemplatePart = DataPart<"template", Template>;

type MediaPlaceholderPart = DataPart<
  "media_placeholder",
  Record<PropertyKey, never>
>;

// Multi-part messages

export type Part = TextPart | DataPart | FilePart;

// Parts type is not used yet. It is a proof of concept.
export type Parts = {
  type: "parts";
  kind: "parts";
  parts: Part[];
  artifacts?: Part[];
};

/**
 * WhatsApp Messages
 * Text (caption for media types)
 * Media (File)
 * Data
 *
 * Text and/or Media (up to two parts), or Data (one part)
 *
 * Excepting Reaction, Contacts and Location, all other types differ depending on the direction (incoming or outgoing)
 */

export type IncomingMessage =
  & {
    version: "1";
    re_message_id?: string; // replied, reacted or forwarded message id
    forwarded?: boolean;
  }
  & TaskInfo
  & (
    | TextPart
    | FilePart
    | ContactsPart
    | LocationPart
    | OrderPart
    | InteractivePart
    | ButtonPart
    | MediaPlaceholderPart
  );

export type InternalMessage =
  & {
    version: "1";
    re_message_id?: string; // replied, reacted or forwarded message id
    forwarded?: boolean;
  }
  & TaskInfo
  & ToolInfo
  & Part;

export type OutgoingMessage =
  & {
    version: "1";
    re_message_id?: string; // replied, reacted or forwarded message id
    forwarded?: boolean;
  }
  & TaskInfo
  & (TextPart | FilePart | ContactsPart | LocationPart | TemplatePart);

//===================================
// Statuses
//===================================

export type IncomingStatus = {
  pending?: string; // new Date().toISOString()
  read?: string;
  typing?: string;
  preprocessing?: string;
  preprocessed?: string;
};

export type OutgoingStatus = {
  pending?: string; // new Date().toISOString()
  held_for_quality_assessment?: string;
  accepted?: string;
  sent?: string;
  delivered?: string;
  read?: string;
  failed?: string;
  preprocessing?: string;
  preprocessed?: string;
  errors?: WebhookError[];
};

//===================================
// Extra
//===================================

export type Memory = {
  [key: string]: string | undefined | Memory;
};

export type PreprocessingConfig = {
  mode?: "active" | "inactive";
  model?: "gemini-2.5-pro" | "gemini-2.5-flash";
  api_key?: string;
  language?: string;
  extra_prompt?: string;
};

export type OrganizationExtra = {
  response_delay_seconds?: number;
  welcome_message?: string;
  authorized_contacts_only?: boolean;
  default_agent_id?: string;
  media_preprocessing?: PreprocessingConfig;
  error_messages_direction?: "internal" | "outgoing";
};

export type OrganizationAddressExtra = {
  waba_id?: string;
  phone_number?: string;
  verified_name?: string;
  access_token?: string;
  flow_type?: "only_waba" | "new_phone_number" | "existing_phone_number";
};

export type ConversationExtra = {
  memory?: Memory;
  paused?: string | null;
  archived?: string | null;
  pinned?: string | null;
  default_agent_id?: string;
  draft?: {
    text: string;
    origin: string;
    timestamp: string;
  } | null;
  /*
  test_run?: {
    reference_conversation: {
      organization_address: string;
      contact_address: string;
    };
    status?: "fail" | "success";
    reference_message_id?: string;
  };
  */
};

export type ContactExtra = Record<PropertyKey, never>;

export type ContactAddressExtra = {
  name?: string;
  synced?: { // if the contact address was synced from WhatsApp
    name: string;
    action: "add" | "remove";
  }
  replaces_address?: string;
  replaced_by_address?: string;
}

// Function tools have a JSON input (data part).
export type LocalFunctionToolConfig = {
  provider: "local";
  type: "function";
  name: string;
};

// Custom tools have a free-grammar input (text part).
export type LocalCustomToolConfig = {
  provider: "local";
  type: "custom";
  name: string;
};

export type LocalSimpleToolConfig =
  | LocalFunctionToolConfig
  | LocalCustomToolConfig;

export type LocalMCPToolConfig = {
  provider: "local";
  type: "mcp";
  label: string; // server label
  config: {
    url: string;
    product?: "calendar" | "sheets";
    headers?: Record<string, string>;
    allowed_tools?: string[];
    files?: string[];
    email?: string;
  };
};

export type LocalSQLToolConfig = {
  provider: "local";
  type: "sql";
  label: string; // database label
  config: Json; // SQLToolConfig
};

/*
export const LibSQLConfigSchema = z.object({
  driver: z.literal("libsql"),
  url: z.string(),
  token: z.string().optional(),
});
type LibSQLConfig = z.infer<typeof LibSQLConfigSchema>;

export const SQLConfigSchema = z.object({
  driver: z.union([z.literal("postgres"), z.literal("mysql")]),
  host: z.string(),
  port: z.number().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
});
type SQLConfig = z.infer<typeof SQLConfigSchema>;

export type SQLToolConfig = LibSQLConfig | SQLConfig;
*/

export type LocalHTTPToolConfig = {
  provider: "local";
  type: "http";
  label: string; // client label
  config: {
    headers?: Record<string, string>;
    url?: string;
    methods?: string[];
  };
};

export type LocalSpecialToolConfig = LocalSQLToolConfig | LocalHTTPToolConfig;

export type ToolConfig =
  | LocalSimpleToolConfig
  | LocalSpecialToolConfig
  | LocalMCPToolConfig;

export type HumanAgentExtra = {
  role: "member" | "admin" | "owner";
  invitation?: {
    organization_name: string;
    email: string;
    status: "pending" | "accepted" | "rejected";
  };
};

export type HumanAgentExtraInsert = {
  role: "member" | "admin" | "owner";
  invitation?: {
    organization_name: string;
    email: string;
    status: "pending";
  };
};

export type HumanAgentExtraUpdate = {
  role?: "member" | "admin" | "owner";
  invitation?: {
    organization_name?: string;
    email?: string;
    status?: "pending" | "accepted" | "rejected";
  };
};

export type AIAgentExtra = {
  mode?: "active" | "draft" | "inactive";
  description?: string;
  api_url?: string;
  api_key?: string;
  model?: string;
  // TODO: Deprecate assistants. Add responses (openai), messages (anthropic), generate-content (google).
  protocol?: "a2a" | "chat_completions" | "assistants";
  assistant_id?: string;
  max_messages?: number;
  temperature?: number;
  max_tokens?: number;
  thinking?: "minimal" | "low" | "medium" | "high";
  instructions?: string;
  send_inline_files_up_to_size_mb?: number;
  tools?: ToolConfig[];
};

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
          Row: {
            extra: OrganizationExtra | null;
          };
          Insert: {
            extra?: OrganizationExtra | null;
          };
          Update: {
            extra?: OrganizationExtra | null;
          };
        };
        organizations_addresses: {
          Row: {
            extra: OrganizationAddressExtra | null;
          };
          Insert: {
            extra?: OrganizationAddressExtra | null;
          };
          Update: {
            extra?: OrganizationAddressExtra | null;
          };
        };
        conversations: {
          Row: {
            extra: ConversationExtra | null;
          };
          Insert: {
            extra?: ConversationExtra | null;
          };
          Update: {
            extra?: ConversationExtra | null;
          };
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
          Row: {
            extra: ContactExtra | null;
          };
          Insert: {
            extra?: ContactExtra | null;
          };
          Update: {
            extra?: ContactExtra | null;
          };
        };
        contacts_addresses: {
          Row: {
            extra: ContactAddressExtra | null;
          };
          Insert: {
            extra?: ContactAddressExtra | null;
          };
          Update: {
            extra?: ContactAddressExtra | null;
          };
        };
        agents: {
          Row: AgentRowStrict;
          Insert: AgentInsertStrict;
          Update: AgentUpdateStrict;
          Relationships:
          DatabaseGenerated["public"]["Tables"]["agents"]["Relationships"];
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

export type ContactAddressRow = Database["public"]["Tables"]["contacts_addresses"]["Row"];
export type ContactAddressInsert = Database["public"]["Tables"]["contacts_addresses"]["Insert"];
export type ContactAddressUpdate = Database["public"]["Tables"]["contacts_addresses"]["Update"];

export type ContactWithAddressesRow = ContactRow & { addresses: ContactAddressRow[] };
export type ContactWithAddressesInsert = ContactInsert & { addresses: ContactAddressUpdate[] };
export type ContactWithAddressesUpdate = ContactUpdate & { addresses: ContactAddressUpdate[] };

export type AgentRow = Database["public"]["Tables"]["agents"]["Row"];
export type AgentInsert = Database["public"]["Tables"]["agents"]["Insert"];
export type AgentUpdate = Database["public"]["Tables"]["agents"]["Update"];

export type ApiKeyRow = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiKeyInsert = Database["public"]["Tables"]["api_keys"]["Insert"];
export type ApiKeyUpdate = Database["public"]["Tables"]["api_keys"]["Update"];

export type Role = Database["public"]["Enums"]["role"];

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
);

supabase.realtime.reconnectAfterMs = (attempt: number) => {
  return Math.min(10 * 1000, attempt * 1000);
};

export type Status = IncomingStatus & OutgoingStatus;
export type MessageTypes = IncomingMessage["type"] | OutgoingMessage["type"];
export type Draft = { text: string; origin: string; timestamp: string };
export type { Tables };
