//===================================
// Subset of open-bsp-api/.../_shared/types/whatsapp_webhook_payload_types.ts
// The UI only needs the Supabase webhook envelope and the error shape; the full
// Meta webhook-payload types are not used UI-side.
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
