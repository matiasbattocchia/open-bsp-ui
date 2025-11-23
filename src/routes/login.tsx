import { createFileRoute, redirect } from "@tanstack/react-router";
import useBoundStore from "@/store/useBoundStore";
import Login from "@/components/Login";

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({
    redirect: (search.redirect as string) || "/conversations",
  }),
  beforeLoad: ({ search }) => {
    const user = useBoundStore.getState().ui.user;

    if (user) {
      throw redirect({ to: search.redirect });
    }
  },
  component: Login,
});
