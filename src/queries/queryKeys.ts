type NullableId = string | null | undefined;

/**
 * Detail queries cache the raw Supabase response and unwrap it with `select`,
 * so a mutation has to merge the fresh row into that wrapper — writing a bare
 * row would make `select` read `undefined`.
 */
export type CachedResponse<T> = { data: T; error: null };

export const queryKeys = {
  agents: {
    all: (orgId: NullableId) => [orgId, "agents"] as const,
    detail: (orgId: NullableId, id: NullableId) =>
      [orgId, "agents", id] as const,
    current: (orgId: NullableId) => [orgId, "agents", "current"] as const,
  },
  invitations: {
    mine: () => ["invitations", "mine"] as const,
    all: (orgId: NullableId) => [orgId, "invitations"] as const,
  },
  apiKeys: {
    all: (orgId: NullableId) => [orgId, "api_keys"] as const,
    detail: (orgId: NullableId, id: NullableId) =>
      [orgId, "api_keys", id] as const,
  },
  contacts: {
    all: (orgId: NullableId) => [orgId, "contacts_addresses"] as const,
    // contacts_addresses PK is (organization_id, organization_address,
    // service, address): an entry belongs to ONE connection's address book,
    // and the same phone digits may exist under whatsapp AND whatsapp-web.
    addressDetail: (
      orgId: NullableId,
      orgAddress: NullableId,
      service: NullableId,
      address: NullableId,
    ) => [orgId, "contacts_addresses", orgAddress, service, address] as const,
  },
  organizations: {
    all: () => ["organizations"] as const,
    detail: (id: NullableId) => ["organizations", id] as const,
    addresses: (orgId: NullableId) =>
      [orgId, "organizations_addresses"] as const,
    addressDetail: (orgId: NullableId, address: NullableId) =>
      [orgId, "organizations_addresses", address] as const,
  },
  webhooks: {
    all: (orgId: NullableId) => [orgId, "webhooks"] as const,
    detail: (orgId: NullableId, id: NullableId) =>
      [orgId, "webhooks", id] as const,
  },
  onboardingTokens: {
    all: (orgId: NullableId, service: string) =>
      [orgId, "onboarding_tokens", service] as const,
  },
  whatsappWeb: {
    pendingSession: (orgId: NullableId, sessionId: NullableId) =>
      [orgId, "whatsapp_web", "pending_session", sessionId] as const,
    health: (orgId: NullableId, address: NullableId) =>
      [orgId, "whatsapp_web", "health", address] as const,
  },
  billing: {
    products: () => ["billing", "products"] as const,
    plans: () => ["billing", "plans"] as const,
    tiers: () => ["billing", "tiers"] as const,
    allUsage: (orgId: NullableId) => [orgId, "billing", "usage"] as const,
    usage: (orgId: NullableId, interval: string, since?: string) =>
      [orgId, "billing", "usage", interval, since] as const,
    subscription: (orgId: NullableId) =>
      [orgId, "billing", "subscription"] as const,
    tierLimits: (orgId: NullableId) =>
      [orgId, "billing", "tier_limits"] as const,
    planProducts: (orgId: NullableId) =>
      [orgId, "billing", "plan_products"] as const,
  },
};
