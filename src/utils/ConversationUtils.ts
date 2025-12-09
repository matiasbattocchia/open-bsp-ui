import useBoundStore from "@/stores/useBoundStore";
import {
  type ConversationInsert,
  type ConversationRow,
  supabase,
} from "@/supabase/client";

function pushConversationToStore(record: ConversationInsert) {
  // TODO: optimistic insert lacks some fields that the store considers as present - cabra 2024/07/28
  useBoundStore.getState().chat.pushConversations([record as ConversationRow]);
}

export async function pushConversationToDb(record: ConversationInsert) {
  const insertQuery = await supabase.from("conversations").insert(record);

  if (insertQuery.error) {
    throw insertQuery.error;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function startConversation({
  organization_id,
  organization_address,
  contact_address,
  service,
  type,
  name,
}: {
  organization_id: string;
  organization_address: string;
  contact_address: string;
  service: "local" | "whatsapp";
  type: "group" | "personal" | "test";
  name?: string;
}) {
  if (service === "whatsapp") {
    assert(
      type === "personal",
      "Conversation type must be 'personal' for WhatsApp",
    );
  }

  const record: ConversationInsert = {
    id: crypto.randomUUID(),
    organization_address,
    contact_address,
    service,
    organization_id, // The presence of this field makes the before insert trigger to skip, thus no contact is created.
    name,
    extra: {
      type,
    },
  };

  pushConversationToStore(record);

  return record.id;
}

export const updateConvExtra = async (
  conversation: ConversationRow,
  extra: {
    pinned?: string | null;
    archived?: string | null;
    paused?: string | null;
  },
) => {
  const { error } = await supabase
    .from("conversations")
    .update({ extra })
    .eq("organization_address", conversation.organization_address)
    .eq("contact_address", conversation.contact_address);

  if (error) {
    throw error;
  }
};

export async function saveDraft(
  conv: ConversationRow,
  text: string | null,
  sendAsContact?: boolean,
) {
  let origin = "human";

  if (sendAsContact !== undefined) {
    origin = sendAsContact ? "human-as-contact" : "human-as-organization";
  }

  const payload = {
    extra: {
      draft: text
        ? {
          text,
          timestamp: new Date().toISOString(),
          origin,
        }
        : null,
    },
  };

  const { error } = await supabase
    .from("conversations")
    .update(payload)
    .eq("organization_address", conv.organization_address)
    .eq("contact_address", conv.contact_address);

  if (error) {
    throw error;
  }
}
