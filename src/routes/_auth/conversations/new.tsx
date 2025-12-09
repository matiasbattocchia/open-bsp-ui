import { createFileRoute } from "@tanstack/react-router";
import NewChat from "@/components/NewChat";

export const Route = createFileRoute("/_auth/conversations/new")({
  component: NewChat,
});