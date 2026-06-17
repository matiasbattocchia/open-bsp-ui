//===================================
// UI-only types — NOT present in open-bsp-api's _shared/types/*.
//
// This file is never overwritten when re-syncing the mirrored API type files,
// so put genuinely UI-exclusive additions here (not divergences — those are
// field-level edits that must stay inline in the mirrored file, tagged with
// `// @ui-divergence`). See scripts/check-type-sync.sh.
//===================================

// Narrowed insert/update shapes for the human-agent `extra` column, used by the
// members forms. The API has no insert/update variants of HumanAgentExtra.
export type HumanAgentExtraInsert = {
  role: "member" | "admin" | "owner";
  invitation?: {
    organization_name: string;
    email: string;
    status: "pending";
  };
};

export type HumanAgentExtraUpdate = {
  role?: "member" | "admin" | "owner";
  invitation?: {
    organization_name?: string;
    email?: string;
    status?: "pending" | "accepted" | "rejected";
  };
};
