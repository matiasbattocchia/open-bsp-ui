import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/")({
  beforeLoad: () => {
    throw redirect({
      to: "/conversations",
    });
  },
});
