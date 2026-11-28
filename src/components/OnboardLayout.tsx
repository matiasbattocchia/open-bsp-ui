import { useEffect, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export type OnboardService = "whatsapp" | "instagram" | "tiktok";

// The link page keeps the organization's name for the page the service sends
// the recipient back to, which only gets the token (in OAuth's `state`).
const nameKey = (token: string) => `onboard_org_name:${token}`;

export function rememberOnboardOrganization(token: string, name: string) {
  try {
    sessionStorage.setItem(nameKey(token), name);
  } catch {
    // Storage blocked: the return page goes without the name.
  }
}

export function recallOnboardOrganization(token: string): string | undefined {
  try {
    return sessionStorage.getItem(nameKey(token)) ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * The page an onboarding link opens, as the inviting organization's own: its
 * name heads the page and the tab, which shows a neutral icon. OpenBSP signs
 * only the footer, next to the privacy policy of what the recipient connects
 * through.
 */
export default function OnboardLayout({
  service,
  organizationName,
  children,
}: {
  service: OnboardService;
  organizationName?: string;
  children: ReactNode;
}) {
  const { translate: t } = useTranslation();

  const connect = {
    whatsapp: t("Conectá tu WhatsApp"),
    instagram: t("Conectá tu Instagram"),
    tiktok: t("Conectá tu TikTok"),
  }[service];

  useEffect(() => {
    const previous = document.title;
    document.title = organizationName
      ? `${organizationName} · ${connect}`
      : connect;
    return () => {
      document.title = previous;
    };
  }, [organizationName, connect]);

  useEffect(() => {
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) return;
    const previous = { href: icon.href, type: icon.type };
    icon.href = "/onboard-icon.svg";
    icon.type = "image/svg+xml";
    return () => {
      icon.href = previous.href;
      icon.type = previous.type;
    };
  }, []);

  return (
    <div className="flex flex-col bg-background text-foreground min-h-dvh w-screen">
      <main className="flex flex-1 flex-col gap-9 justify-center items-center px-4">
        {organizationName && (
          <h1 className="text-foreground tracking-tight font-bold text-[32px] leading-tight text-center max-w-[320px] break-words">
            {organizationName}
          </h1>
        )}

        <div className="flex flex-col items-center gap-4 w-[320px] text-center">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-[12px] text-muted-foreground">
        {t("Funciona con")}{" "}
        <a href="https://openbsp.dev" target="_blank" rel="noreferrer">
          OpenBSP
        </a>
        {" · "}
        <a
          href="https://openbsp.dev/privacy-policy"
          target="_blank"
          rel="noreferrer"
        >
          {t("Privacidad")}
        </a>
      </footer>
    </div>
  );
}
