import { createFileRoute, Outlet } from "@tanstack/react-router";
import useBoundStore from "@/stores/useBoundStore";
import Menu from "@/components/Menu";
import Chat from "@/components/Chat";
import ChatHeader from "@/components/ChatHeader";
import ChatFooter from "@/components/ChatFooter";
import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import FilePicker from "@/components/FileUploader/FilePicker";
import FilePreviewer from "@/components/FilePreviewer";
import { useResizable } from "@/hooks/useResizable";
import { MessageSquareText } from "lucide-react";
import StatsCenter from "@/components/stats/StatsCenter";

export const Route = createFileRoute("/_auth")({
  component: AppLayout,
});

const MIN_PANEL_WIDTH = 300;

function getMenuWidth() {
  return window.innerWidth >= 1024 ? 88 : 48;
}

function getMaxPanelWidth() {
  const availableSpace = window.innerWidth - getMenuWidth();
  return Math.floor(availableSpace / 2);
}

function AppLayout() {
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);
  const location = useLocation();
  const pathname = location.pathname;
  const isStatsRoute = pathname.startsWith("/stats");
  const isWhatsAppRoute =
    pathname.startsWith("/whatsapp") ||
    pathname.startsWith("/integrations/whatsapp");

  const [isHoveringFiles, setIsHoveringFiles] = useState(false);

  const { width: panelWidth, panelRef, handleMouseDown } = useResizable({
    minWidth: MIN_PANEL_WIDTH,
    getMaxWidth: getMaxPanelWidth,
  });

  useEffect(() => {
    const convId = location.hash;
    setActiveConv(convId);
  }, [location.hash]);

  const showCenterPanel = activeConvId || isStatsRoute;

  // ── WhatsApp Workspace: full-width single-pane ──────────────
  if (isWhatsAppRoute) {
    const menuW = getMenuWidth();

    return (
      <div
        className="app-grid"
        style={{ gridTemplateColumns: `${menuW}px 1fr` }}
      >
        {/* Menu */}
        <div className="flex">
          <Menu />
        </div>

        {/* Full-width content */}
        <div className="flex-col overflow-hidden bg-background text-foreground relative flex">
          <Outlet />
        </div>
      </div>
    );
  }

  // ── Inbox / Stats: dual-pane layout ────────────────────────

  return (
    <div
      className="app-grid"
      style={panelWidth !== null ? { gridTemplateColumns: `${getMenuWidth()}px ${panelWidth}px 1fr` } : undefined}
    >
      {/* Menu - Fixed width */}
      <div className={showCenterPanel ? "hidden md:flex" : "flex"}>
        <Menu />
      </div>
      {/* Left Panel - Router Outlet */}
      <div
        ref={panelRef}
        className={
          "flex-col overflow-hidden md:border-r border-border bg-background text-foreground col-span-2 md:col-span-1 relative " +
          (showCenterPanel ? "hidden md:flex" : "flex")
        }
      >
        <Outlet />
        {/* Resize Handle */}
        <div
          className="resize-handle z-[60]"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Center Panel */}
      <div
        className={
          "flex-col min-w-0 relative overflow-hidden col-span-full md:col-span-1" +
          (isStatsRoute
            ? " flex bg-muted"
            : activeConvId
              ? " flex bg-chat"
              : " hidden md:flex bg-muted")
        }
        onDragEnter={() => setIsHoveringFiles(true)}
        onDrop={() => setIsHoveringFiles(false)}
      >
        {isStatsRoute ? (
          <div className="overflow-y-auto h-full">
            <StatsCenter />
          </div>
        ) : activeConvId ? (
          <>
            {isHoveringFiles && (
              <FilePicker setHovering={setIsHoveringFiles} />
            )}
            <FilePreviewer />
            <ChatHeader />
            <Chat />
            <ChatFooter />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[15px] select-none gap-2 flex-col">
            <MessageSquareText className="w-12 h-12 opacity-20" />
            <span>Please select a conversation from the list to begin.</span>
          </div>
        )}
      </div>
    </div>
  );
}
