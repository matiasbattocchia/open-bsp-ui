type NullableId = string | null | undefined;

export const queryKeys = {
  agents: {
    all: (orgId: NullableId) => [orgId, "agents"] as const,
    detail: (orgId: NullableId, id: NullableId) => [orgId, "agents", id] as const,
    current: (orgId: NullableId) => [orgId, "agents", "current"] as const,
    invitations: () => ["invitations"] as const,
  },
  apiKeys: {
    all: (orgId: NullableId) => [orgId, "api_keys"] as const,
    detail: (orgId: NullableId, id: NullableId) => [orgId, "api_keys", id] as const,
  },
  contacts: {
    all: (orgId: NullableId) => [orgId, "contacts"] as const,
    detail: (orgId: NullableId, id: NullableId) => [orgId, "contacts", id] as const,
    byAddress: (orgId: NullableId, address: NullableId) => [orgId, "contacts_addresses", address, "contact"] as const,
    addresses: (orgId: NullableId, contactId: NullableId) => [orgId, "contacts", contactId, "addresses"] as const,
    addressDetail: (orgId: NullableId, address: NullableId) => [orgId, "contacts_addresses", address] as const,
  },
  organizations: {
    all: () => ["organizations"] as const,
    detail: (id: NullableId) => ["organizations", id] as const,
    addresses: (orgId: NullableId) => [orgId, "organizations_addresses"] as const,
    addressDetail: (orgId: NullableId, address: NullableId) => [orgId, "organizations_addresses", address] as const,
  },
  webhooks: {
    all: (orgId: NullableId) => [orgId, "webhooks"] as const,
    detail: (orgId: NullableId, id: NullableId) => [orgId, "webhooks", id] as const,
  },
  onboardingTokens: {
    all: (orgId: NullableId) => [orgId, "onboarding_tokens"] as const,
  },
  billing: {
    products: () => ["billing", "products"] as const,
    usage: (orgId: NullableId, interval: string) => [orgId, "billing", "usage", interval] as const,
    subscription: (orgId: NullableId) => [orgId, "billing", "subscription"] as const,
    tierLimits: (orgId: NullableId) => [orgId, "billing", "tier_limits"] as const,
    planProducts: (orgId: NullableId) => [orgId, "billing", "plan_products"] as const,
  },
};
