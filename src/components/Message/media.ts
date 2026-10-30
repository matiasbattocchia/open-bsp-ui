import type { FilePart } from "@/supabase/client";

export type MediaCategory = "audio" | "image" | "video" | "document";

/**
 * Resolves a file part to the renderer category it should use.
 *
 * Some kinds are unambiguous and map directly regardless of MIME — a sticker is
 * always an image. The rest (a story can be a photo or a video, and the generic
 * "media" kind has no fixed shape) are decided by the MIME type. The native IG
 * "file" kind (e.g. a shared pdf) and WhatsApp "document" are always documents.
 *
 * Shared posts/reels are not handled here: they are not files but `share` data
 * parts (a link card), since their url is a web permalink, not media.
 */
export function mediaCategory(
  kind: FilePart["kind"],
  mime: string,
): MediaCategory {
  switch (kind) {
    case "audio":
      return "audio";
    case "image":
    case "sticker":
      return "image";
    case "video":
      return "video";
    case "file":
    case "document":
      return "document";
  }

  // Ambiguous kinds (media, story, ig_story, story_mention, story_reply) — fall
  // back to the MIME type.
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";
  return "document";
}

type Translate = (text: string) => string;

/** What a shared post is, by where it's from. */
export function shareLabel(type: string, t: Translate): string {
  switch (type) {
    case "tiktok_post":
      return t("Publicación de TikTok");
    case "ig_reel":
    case "reel":
      return t("Reel");
    default:
      return t("Publicación");
  }
}

/** Why a message can't be shown: the service's region rule, or its type. */
export function unsupportedLabel(
  content: { data?: { type?: string }; text?: string },
  t: Translate,
): string {
  if (content.data?.type === "region") {
    return t(
      "TikTok no comparte los mensajes del Espacio Económico Europeo, Suiza o el Reino Unido.",
    );
  }

  return t("Mensaje no compatible");
}
