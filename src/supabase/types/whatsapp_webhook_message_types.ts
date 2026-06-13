//===================================
// Subset of open-bsp-api/.../_shared/types/whatsapp_webhook_message_types.ts
// Only the message-component data types referenced by message_types are needed
// UI-side; the webhook-ingest message unions are not used.
//===================================

import type { WebhookError } from "./whatsapp_webhook_payload_types";

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

export type UnsupportedMessage = {
  type: "unsupported";
  errors: Omit<WebhookError, "href">[];
  unsupported: {
    type: "edit" | "poll" | "button";
  };
};

// Click-to-WhatsApp ad referral payload, attached to incoming WA messages.
export type WhatsAppReferral = {
  source_url: string;
  source_type: "ad" | "post";
  source_id: string;
  headline: string;
  body: string;
  ctwa_clid?: string;
  welcome_message: {
    text: string;
  };
} & (
  | {
      media_type: "image";
      image_url: string;
    }
  | {
      media_type: "video";
      video_url: string;
      thumbnail_url?: string;
    }
);

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
