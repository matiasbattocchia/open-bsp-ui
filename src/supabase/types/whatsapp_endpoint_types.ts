//===================================
// Subset of open-bsp-api/.../_shared/types/whatsapp_endpoint_types.ts
// Only the outgoing media components used by template parameters are needed
// UI-side; the full endpoint-send message types are not used.
//===================================

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
