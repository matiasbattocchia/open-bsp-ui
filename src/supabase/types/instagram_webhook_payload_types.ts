//===================================
// Subset of open-bsp-api/.../_shared/types/instagram_webhook_payload_types.ts
// Only the value types referenced by message content are needed UI-side; the
// webhook event/envelope types are not used.
//===================================

export type InstagramAttachmentType =
  | "audio"
  | "file"
  | "image"
  | "video"
  | "media"
  | "ig_post"
  | "story_mention"
  | "ig_reel"
  | "reel"
  | "story"
  | "ig_story";

export type InstagramAttachmentPayload = {
  url?: string;
  title?: string;
};

export type InstagramReplyTo = {
  mid?: string;
  story?: { url: string; id: string };
};

// Covers both shapes:
// - inline message.referral (CTD ad form with ads_context_data)
// - top-level event.referral (messaging_referral, ig.me link clicks)
export type InstagramReferral = {
  ref?: string;
  ad_id?: string;
  source: string; // "ADS" for CTD ads; an ig.me source link for messaging_referral
  type?: "OPEN_THREAD";
  ads_context_data?: {
    ad_title?: string;
    photo_url?: string;
    video_url?: string;
  };
};
