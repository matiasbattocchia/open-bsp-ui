import type { SignupPayload } from "@/contexts/WhatsAppIntegrationContext";

/**
 * The slice of the Facebook JS SDK that WhatsApp Embedded Signup uses, plus the
 * globals our own code parks on `window` while the flow is in progress. The SDK
 * is loaded by <script> from connect.facebook.net, so it only exists at runtime
 * (and not at all when a tracking blocker eats it — hence every field optional).
 */
declare global {
  type FBLoginResponse = {
    authResponse?: { code?: string } | null;
    status?: string;
  };

  type FBLoginOptions = {
    config_id?: string;
    response_type?: string;
    override_default_response_type?: boolean;
    extras?: Record<string, unknown>;
  };

  type FacebookSDK = {
    init(options: {
      appId?: string;
      autoLogAppEvents?: boolean;
      xfbml?: boolean;
      version: string;
    }): void;
    login(
      callback: (response: FBLoginResponse) => void,
      options?: FBLoginOptions,
    ): void;
  };

  /** What the signup message listener leaves for the login callback. */
  type WASessionInfo = {
    phone_number_id?: string;
    waba_id?: string;
    business_id?: string;
    flow_type?: SignupPayload["flow_type"];
  };

  interface Window {
    FB?: FacebookSDK;
    fbAsyncInit?: () => void;
    __waSessionInfo?: WASessionInfo;
    /**
     * Set by whoever launches the signup; the message listener hands it the
     * popup events no finish follows (an abandon, Meta's own error, an event
     * name it does not know), so they reach public.logs.
     */
    __waSignupReport?: (event: string, data: unknown) => void;
    /** Set by the SDK <script>'s onerror handler; read by the onboard page. */
    __fbSdkFailed?: boolean;
  }
}
