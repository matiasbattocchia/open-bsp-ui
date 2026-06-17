//===================================
// Mirrored from open-bsp-api/.../_shared/types/message_types.ts
//
// To re-sync: paste the API file over this one, then re-apply each line tagged
// `// @ui-divergence` below (run `scripts/check-type-sync.sh` to list them).
//===================================

// @ui-divergence: the API also imports TaskState from ../a2a_types (not vendored
// UI-side); see TaskInfo.task.status below.
import type { Json } from "../db_types";
import type {
  ButtonMessage,
  Contact,
  InteractiveMessage,
  Location,
  Order,
  UnsupportedMessage,
  WhatsAppReferral,
} from "./whatsapp_webhook_message_types";
import type { Template } from "./whatsapp_template_types";
import type { InstagramReferral } from "./instagram_webhook_payload_types";

//===================================
// Agent Protocol Types
//===================================

// The same message can be a task request and a task response.
export type TaskInfo = {
  task?: {
    id: string;
    // @ui-divergence: `status` is `string` (API: TaskState from a2a_types).
    status?: string;
    session_id?: string;
  };
};

export type ToolInfo = {
  tool?: ToolEventInfo &
    (LocalToolInfo | GoogleToolInfo | OpenAIToolInfo | AnthropicToolInfo);
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
  "file", // Instagram native attachment type (e.g. pdf)
  "media", // Instagram generic media attachment
  // Instagram story attachments carry a real, downloadable CDN url, so they are
  // modeled as files (downloaded/persisted) while keeping their native kind.
  // Shared posts/reels (ig_post/ig_reel/reel) are NOT here: their url is a web
  // permalink, not media, so they are modeled as a `share` data part instead.
  "story",
  "ig_story",
  "story_mention",
  "story_reply", // synthetic: the story a user replied to (reply_to.story)
] as const;

/**
 * Represents a file, such as an image, video, or document.
 * WhatsApp allows media messages to include an accompanying text caption.
 * For now, this caption is embedded directly within the `text` attribute of the `FilePart`.
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
  text?: string;
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

type UnsupportedPart = DataPart<
  "unsupported",
  UnsupportedMessage["unsupported"]
>;

// Synthetic content for messaging_referral events (no message attached).
type ReferralPart = DataPart<"referral", InstagramReferral>;

// Shared Instagram post/reel (attachment types ig_post, ig_reel, reel). Unlike
// real media, the attachment `payload.url` is a public instagram.com permalink
// (an HTML page, not a downloadable CDN file), so these are modeled as data — a
// link card — and skipped by media download. `data.type` keeps the original
// attachment type so consumers can label it (post vs reel); `url` is the
// permalink and `title` the shared item's caption when provided.
export type SharePart = DataPart<
  "share",
  {
    type: "ig_post" | "ig_reel" | "reel";
    url: string;
    title?: string;
  }
>;

// Multi-part messages

export type Part = TextPart | DataPart | FilePart | SharePart;

// Parts type is not used yet. It is a proof of concept.
export type Parts = {
  type: "parts";
  kind: "parts";
  parts: Part[];
  artifacts?: Part[];
};

export type IncomingMessage = {
  version: "1";
  re_message_id?: string; // replied, reacted or forwarded message id
  forwarded?: boolean;
  referred_product?: {
    catalog_id: string;
    product_retailer_id: string;
  };
  referral?: WhatsAppReferral | InstagramReferral;
} & TaskInfo &
  (
    | TextPart
    | FilePart
    | ContactsPart
    | LocationPart
    | OrderPart
    | InteractivePart
    | ButtonPart
    | MediaPlaceholderPart
    | UnsupportedPart
    | ReferralPart
    | SharePart
    | Parts
  );

export type InternalMessage = {
  version: "1";
  re_message_id?: string; // replied, reacted or forwarded message id
  forwarded?: boolean;
} & TaskInfo &
  ToolInfo &
  Part;

export type OutgoingMessage = {
  version: "1";
  re_message_id?: string; // replied, reacted or forwarded message id
  forwarded?: boolean;
} & TaskInfo &
  (TextPart | FilePart | ContactsPart | LocationPart | TemplatePart);
