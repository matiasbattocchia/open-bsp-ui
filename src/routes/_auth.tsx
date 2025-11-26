import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import useBoundStore from "@/store/useBoundStore";
import Menu from "@/components/Menu";
import Chat from "@/components/Chat";
import ChatHeader from "@/components/ChatHeader";
import ChatFooter from "@/components/ChatFooter";
import { useEffect } from "react";

export const Route = createFileRoute("/_auth")({
  component: AppLayout,
});

function AppLayout() {
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);

  // Sync fragment identifier with activeConvId
  // i.e. /conversations#1234
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const convId = hash.slice(1);
      setActiveConv(convId);
    };

    // Initial check
    handleHashChange();

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    window.location.hash = activeConvId || "";
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
            {/*<ChatFooter />*/}
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
