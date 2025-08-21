import { createClient } from "@supabase/supabase-js";
import { Database as DatabaseGenerated, Json } from "./db_types";
import { MergeDeep } from "type-fest";

export const MediaTypes = [
  "audio",
  "document",
  "image",
  "video",
  "sticker",
] as const;

export type AudioMessage = {
  type: "audio";
  audio: {
    id: string;
    mime_type:
      | "audio/aac"
      | "audio/amr"
      | "audio/mpeg"
      | "audio/mp4"
      | "audio/ogg; codecs=opus";
    voice: boolean;
  };
};

export type ButtonMessage = {
  type: "button";
  button: {
    text: string;
    payload: string;
  };
};

export type ContactsMessage = {
  type: "contacts";
  contacts: {
    name: {
      first_name?: string;
      formatted_name: string;
      last_name?: string;
    };
    phones?: {
      phone: string;
      type: string;
      wa_id?: string;
    }[];
  }[];
};

export type DocumentMessage = {
  type: "document";
  document: {
    caption?: string;
    filename: string;
    id: string;
    mime_type:
      | "text/plain"
      | "application/vnd.ms-excel"
      | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      | "application/msword"
      | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      | "application/vnd.ms-powerpoint"
      | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      | "application/pdf";
  };
};

export type ImageMessage = {
  type: "image";
  image: {
    id: string;
    mime_type: "image/jpeg" | "image/png" | "image/webp";
    caption?: string;
  };
};

export type IncomingContextInfo = {
  context?: {
    forwarded?: boolean;
    frequently_forwarded?: boolean;
    from?: string; // The WhatsApp ID for the customer who replied to an inbound message.
    id?: string; //  The message ID for the sent message for an inbound reply.
    referred_product?: {
      catalog_id: string;
      product_retailer_id: string;
    };
  };
};

export type IncomingInteractiveMessage = {
  type: "interactive";
  interactive:
    | { type: "button_reply"; button_reply: { id: string; title: string } }
    | {
        type: "list_reply";
        list_reply: { id: string; title: string; description: string };
      };
};

export type LocationMessage = {
  type: "location";
  location: {
    address: string;
    latitude: number;
    longitude: number;
    name: string;
    url?: string;
  };
};

export type OrderMessage = {
  type: "order";
  order: {
    catalog_id: string;
    product_items: {
      product_retailer_id: string;
      quantity: string;
      item_price: string;
      currency: string;
    }[];
    text: string;
  };
};

export type ReactionMessage = {
  type: "reaction";
  reaction: {
    message_id: string;
    emoji?: string;
  };
};

export type ReferralInfo = {
  /*
  type:
    | "text"
    | "location"
    | "contact"
    | "image"
    | "video"
    | "document"
    | "audio"
    | "sticker";
  */
  referral?: {
    source_url: string;
    source_type: "ad" | "post";
    source_id: string;
    headline: string;
    body: string;
    media_type: "image" | "video";
    image_url?: string;
    video_url?: string;
    thumbnail_url?: string;
    ctwa_clid: string;
  };
};

export type StickerMessage = {
  type: "sticker";
  sticker: {
    id: string;
    mime_type: "image/webp";
    animated: boolean;
  };
};

export type TextMessage = {
  type: "text";
  text: {
    body: string;
  };
};

export type VideoMessage = {
  type: "video";
  video: {
    id: string;
    mime_type: "video/3gp" | "video/mp4";
    caption?: string;
    filename: string;
  };
};

export type BaseMessage = {
  type: string;
  header?: string;
  content?: string;
  footer?: string;
  re_message_id?: string; // replied, reacted or forwarded message id
  forwarded?: boolean;
  media?: {
    id: string;
    mime_type: string;
    file_size: number;
    filename?: string;
    voice?: boolean;
    annotation?: string; // image and video textual description
  };
};

export type FunctionCallMessage = {
  type: "function";
  id: string;
  function: {
    arguments: string;
    name: string;
  };
};

export type FunctionResponseMessage = {
  type: "text";
  content: string;
  tool_call_id: string;
};

export type IncomingMessage = BaseMessage &
  IncomingContextInfo &
  ReferralInfo &
  (
    | AudioMessage
    | ButtonMessage
    | ContactsMessage
    | DocumentMessage
    | ImageMessage
    | IncomingInteractiveMessage
    | LocationMessage
    | OrderMessage
    | ReactionMessage
    | StickerMessage
    | TextMessage
    | VideoMessage
  );

export type OutgoingContextInfo = {
  context?: { message_id: string };
};

export type OutgoingInteractiveMessage = {
  type: "interactive";
  interactive: any; // TODO - cabra 2024/05/07
};

/** TEMPLATES **/

/* Template data */

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

/* Template message */

type TemplateHeader = {
  type: "header";
  parameters: [TextParameter | ImageParameter];
};

type TemplateBody = {
  type: "body";
  parameters: TextParameter[];
};

type TemplateButton = {
  type: "button";
  sub_type: "quick_reply";
  index: string;
  parameters: PayloadParameter[];
};

type ImageParameter = {
  type: "image";
  image: {
    link: string;
  };
};

type TextParameter = {
  type: "text";
  text: string;
};

type PayloadParameter = {
  type: "payload";
  payload: string;
};

export type TemplateMessage = {
  type: "template";
  template: {
    components?: (TemplateBody | TemplateHeader | TemplateButton)[];
    language: {
      code: string; // es, es_AR, etc
    };
    name: string;
  };
};

export type OutgoingMessage = BaseMessage &
  OutgoingContextInfo &
  (
    | AudioMessage
    | ContactsMessage
    | DocumentMessage
    | ImageMessage
    | LocationMessage
    | OutgoingInteractiveMessage
    | ReactionMessage
    | StickerMessage
    | TemplateMessage
    | TextMessage
    | VideoMessage
  );

type ConversationType =
  | "authentication"
  | "marketing"
  | "utility"
  | "service"
  | "referral_conversion";

/** STATUS
 *
 * 1. Sent messages
 *    WebhookStatus -> OutgoingStatus
 *
 * 2. Received messages
 *    IncomingStatus -> EndpointStatus
 */

export type IncomingStatus = {
  pending?: string; // new Date().toISOString()
  read?: string;
};

export type OutgoingStatus = {
  pending?: string; // new Date().toISOString()
  held_for_quality_assessment?: string;
  accepted?: string;
  sent?: string;
  delivered?: string;
  read?: string;
  failed?: string;
  conversation?: {
    id: string;
    type: ConversationType;
    expiration_timestamp: string;
  };
  errors?: string[];
};

export type Memory = {
  [key: string]: string | undefined | Memory;
};

type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        conversations: {
          Row: {
            extra: {
              type?: "personal" | "group" | "test" | "test_run";
              memory?: Memory;
              paused?: string;
              archived?: string;
              pinned?: string;
              notifications?: "off" | "muted" | "on";
              draft?: Draft;
            };
          };
        };
        messages: {
          Row:
            | {
                type: "incoming" | "notification" | "internal";
                message: BaseMessage;
                status: IncomingStatus;
              }
            | {
                type: "outgoing" | "draft";
                message: BaseMessage;
                status: OutgoingStatus;
              }
            | {
                type: "function_call";
                message: FunctionCallMessage;
                status: IncomingStatus;
              }
            | {
                type: "function_response";
                message: FunctionResponseMessage;
                status: IncomingStatus;
              };
          Insert:
            | {
                type: "incoming" | "internal";
                message: BaseMessage;
                status?: IncomingStatus;
              }
            | {
                type: "outgoing";
                message: BaseMessage;
                status?: OutgoingStatus;
              };
          Update:
            | {
                type: "incoming";
                message?: BaseMessage;
                status?: IncomingStatus;
              }
            | {
                type: "outgoing";
                message?: BaseMessage;
                status?: OutgoingStatus;
              };
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

export type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export type OrganizationRow =
  Database["public"]["Tables"]["organizations"]["Row"];

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  // Opt-out the stupid NextJS 14 default caching. It affects the Supabase client.
  {
    global: {
      fetch: (url: any, options = {}) => {
        return fetch(url, { ...options, cache: "no-store" });
      },
    },
  },
);

supabase.realtime.reconnectAfterMs = (attempt: number) => {
  return Math.min(10 * 1000, attempt * 1000);
};

export type Status = IncomingStatus & OutgoingStatus;
export type MessageTypes = IncomingMessage["type"] | OutgoingMessage["type"];
export type MessageRoles = Database["public"]["Enums"]["type"];
export type Draft = { text: string; origin: string; timestamp: string };

export type WebhookPayload<Record> = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record | null;
  old_record: Record | null;
};
