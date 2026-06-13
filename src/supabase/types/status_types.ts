//===================================
// Ported from open-bsp-api/.../_shared/types/status_types.ts
// Only the stored status shapes are needed UI-side (no webhook/endpoint status).
//===================================

import type { WebhookError } from "./whatsapp_webhook_payload_types";

export type IncomingStatus = {
  pending?: string; // new Date().toISOString()
  read?: string;
  typing?: string;
  edited?: string; // sender edited the message (Instagram, WhatsApp coexistence)
  deleted?: string; // sender deleted/revoked the message (Instagram, WhatsApp coexistence)
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
  edited?: string; // sender edited the message (Instagram, WhatsApp coexistence)
  deleted?: string; // sender deleted/revoked the message (Instagram, WhatsApp coexistence)
  failed?: string;
  preprocessing?: string;
  preprocessed?: string;
  errors?: WebhookError[];
};
