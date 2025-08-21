import { NotificationKind } from "@/hooks/useWebNotifications";
import { SEP } from "@/store/chatSlice";
import useBoundStore from "@/store/useBoundStore";
import {
  ConversationInsert,
  ConversationRow,
  supabase,
} from "@/supabase/client";

const FIRST_NAMES =
  "Nicolás,Tiago,Mateo,Sebastián,Lucas,Valentina,Victoria,Luna,Aurora,Catalina,Lisandro,Camila,Leonardo,Ana,Tomás,Natalia,Santiago,Isabella,Emilia,Martín,Sofía,Joaquín,Emma,Benjamín,Olivia,Alejandro,Lucía,Maximiliano,Renata,Daniel,Antonella,Javier,Valeria,Gabriel,Agustina,Thiago,Delfina,Santino,Mía,Bautista,Alma,Felipe,Clara,Ignacio,Zoe,Facundo,Pilar,Julián".split(
    ",",
  );
const LAST_NAMES =
  "Díaz,Pérez,Gómez,Sosa,López,García,Romero,Flores,Cruz,Quiroga,Espejo,Figueroa,Villanueva,Zapata,Calderón,Manzur,Rodríguez,Martínez,Fernández,González,Sánchez,Ramírez,Torres,Hernández,Acosta,Rojas,Medina,Silva,Molina,Vargas,Castro,Morales,Gutiérrez,Ortega,Núñez,Peralta,Giménez,Aguirre,Benítez,Vega,Mendoza,Ríos,Cabrera,Navarro,Ramos,Herrera,Suárez,Moreno,Paz".split(
    ",",
  );

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

  const randomName =
    FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] +
    " " +
    LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

  //const contact_id = crypto.randomUUID();

  const key = organization_address + SEP + contact_address;

  const record: ConversationInsert = {
    organization_address,
    contact_address,
    service,
    organization_id, // The presence of this field makes the before insert trigger to skip, thus no contact is created.
    name: name || randomName,
    extra: {
      type,
    },
  };

  pushConversationToStore(record);

  return key;
}

export const updateConvExtra = async (
  conversation: ConversationRow,
  extra: {
    pinned?: string | null;
    archived?: string | null;
    paused?: string | null;
    notifications?: NotificationKind | null;
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
