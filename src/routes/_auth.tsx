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
import Templates from "@/components/Templates";
import ActionCard from "@/components/ActionCard";
import { Building2, MessageSquarePlus, Settings } from "lucide-react";
import { useResizable } from "@/hooks/useResizable";
import { ResizeHandle } from "@/components/ResizeHandle";

export const Route = createFileRoute("/_auth")({
  component: AppLayout,
});

function AppLayout() {
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);
  const location = useLocation();

  const [isHoveringFiles, setIsHoveringFiles] = useState(false);

  const { width: sidebarWidth, handleMouseDown, isResizing } = useResizable({
    initialWidth: 400,
    minWidth: 200,
    maxWidth: 600,
  });

  // Sync fragment identifier with activeConvId
  // i.e. /conversations#1234
  useEffect(() => {
    const convId = location.hash;
    setActiveConv(convId);
  }, [location.hash]);

  const sidebarCol = activeConvId ? 0 : sidebarWidth;
  const handleCol = activeConvId ? 0 : 8;

  return (
    <div
      className="app-grid"
      style={{
        gridTemplateColumns: `64px ${sidebarCol}px ${handleCol}px 2fr`,
        cursor: isResizing ? "col-resize" : "default",
      }}
    >
      {/* Menu - Fixed width 64px */}
      <div className={activeConvId ? "hidden md:flex" : "flex"}>
        <Menu />
      </div>

      {/* Left Panel - Router Outlet - Resizable */}
      <div
        className={
          "flex-col overflow-hidden border-border md:border-r bg-background text-foreground " +
          (activeConvId ? "hidden md:flex" : "flex")
        }
      >
        <Outlet />
      </div>

      {/* Resize Handle */}
      {!activeConvId && (
        <ResizeHandle onMouseDown={handleMouseDown} isResizing={isResizing} />
      )}

      {/* Center Panel - Chat */}
      <div
        className={
          "flex-col min-w-0 relative overflow-hidden" +
          (activeConvId ? " flex bg-chat" : " hidden md:flex bg-muted")
        }
        onDragEnter={() => setIsHoveringFiles(true)}
        onDrop={() => setIsHoveringFiles(false)}
      >
        {activeConvId ? (
          <>
            {isHoveringFiles && (
              <FilePicker setHovering={setIsHoveringFiles} />
            )}
            <FilePreviewer />
            <Templates />
            <ChatHeader />
            <Chat />
            <ChatFooter />
          </>
        ) : (
          <div className="flex gap-[32px] items-center justify-center h-full">
            <ActionCard
              icon={<Building2 className="w-[24px] h-[24px]" />}
              title="Crear organización"
              to="/settings/organization/new"
            />
            <ActionCard
              icon={<MessageSquarePlus className="w-[24px] h-[24px]" />}
              title="Iniciar conversación"
              to="/conversations/new"
            />
            <ActionCard
              icon={<Settings className="w-[24px] h-[24px]" />}
              title="Configurar WhatsApp"
              to="/integrations"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default AppLayout;
