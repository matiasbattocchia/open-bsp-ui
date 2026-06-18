import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/integrations/whatsapp/")({
  component: WhatsAppRedirect,
});

function WhatsAppRedirect() {
  return <Navigate to="/whatsapp/channels" />;
}
