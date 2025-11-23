import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import Menu from "@/components/Menu";
import Chat from "@/components/Chat";
import ChatHeader from "@/components/ChatHeader";
import ChatFooter from "@/components/ChatFooter";
import { useEffect } from "react";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ location }) => {
    let user = useBoundStore.getState().ui.user;

    if (!user) {
      const { data } = await supabase.auth.getSession();
      user = data?.session?.user ?? null;
    }

    if (!user) {
      throw redirect({
        to: "/login",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);

  // Sync hash with activeConvId
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#convId=")) {
        const id = hash.replace("#convId=", "");
        if (id !== activeConvId) {
          setActiveConv(id);
        }
      }
    };

    // Initial check
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [setActiveConv, activeConvId]);

  useEffect(() => {
    if (activeConvId) {
      window.location.hash = `convId=${activeConvId}`;
    } else {
      if (window.location.hash.includes("convId=")) {
        // Remove hash without reloading
        history.pushState(
          "",
          document.title,
          window.location.pathname + window.location.search,
        );
      }
    }
  }, [activeConvId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Menu - Fixed width */}
      <Menu />

      {/* Left Panel - Router Outlet */}
      <div className="w-[350px] flex flex-col border-r border-border bg-background">
        <Outlet />
      </div>

      {/* Center Panel - Chat */}
      <div className="flex-1 flex flex-col min-w-0 bg-chat relative">
        {activeConvId ? (
          <>
            <ChatHeader />
            <Chat />
            <ChatFooter />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
