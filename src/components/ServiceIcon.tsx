import {
  InstagramOutlined,
  TikTokOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";

// Brand colors per service. whatsapp-web (the unofficial whatsmeow bridge) uses
// the WhatsApp glyph in Go's brand color to set it apart from Cloud-API WhatsApp.
export const SERVICE_COLORS = {
  whatsapp: "#25D366",
  "whatsapp-web": "#00ADD8",
  instagram: "#E1306C",
} as const;

export default function ServiceIcon({
  service,
  size = 14,
}: {
  service: string;
  size?: number;
}) {
  const fontSize = `${size}px`;

  if (service === "instagram") {
    return (
      <InstagramOutlined
        style={{ fontSize, color: SERVICE_COLORS.instagram }}
      />
    );
  }

  // TikTok's mark is black on white: the foreground color keeps it visible in
  // dark mode.
  if (service === "tiktok") {
    return <TikTokOutlined className="text-foreground" style={{ fontSize }} />;
  }

  if (service === "whatsapp-web") {
    return (
      <WhatsAppOutlined
        style={{ fontSize, color: SERVICE_COLORS["whatsapp-web"] }}
      />
    );
  }

  return (
    <WhatsAppOutlined style={{ fontSize, color: SERVICE_COLORS.whatsapp }} />
  );
}
