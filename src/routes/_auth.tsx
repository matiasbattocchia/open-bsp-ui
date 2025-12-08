import { createFileRoute, Outlet } from "@tanstack/react-router";
import useBoundStore from "@/stores/useBoundStore";
import Menu from "@/components/Menu";
import Chat from "@/components/Chat";
import ChatHeader from "@/components/ChatHeader";
import ChatFooter from "@/components/ChatFooter";
import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: AppLayout,
});

function AppLayout() {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);
  const location = useLocation();

  // Sync fragment identifier with activeConvId
  // i.e. /conversations#1234
  useEffect(() => {
    const convId = location.hash;
    setActiveConv(convId);
  }, [location.hash]);

  console.log("--------")
  console.log("active org ", activeOrgId)
  console.log("active conv", activeConvId)

  return (
    <div className="app-grid">
      {/* Menu - Fixed width */}
      <Menu />

      {/* Left Panel - Router Outlet */}
      <div className="flex flex-col overflow-hidden">
        <Outlet />
      </div>

      {/* Center Panel - Chat */}
      <div className="flex flex-col min-w-0 relative overflow-hidden bg-chat">
        {activeConvId ? (
          <>
            <ChatHeader />
            <Chat />
            <ChatFooter />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
