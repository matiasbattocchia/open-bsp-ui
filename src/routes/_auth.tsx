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
import ActionCard from "@/components/ActionCard";
import { Building2, MessageSquarePlus, Settings } from "lucide-react";

export const Route = createFileRoute("/_auth")({
  component: AppLayout,
});

function AppLayout() {
  const activeOrgId = useBoundStore((state) => state.ui.activeOrgId);
  const activeConvId = useBoundStore((state) => state.ui.activeConvId);
  const setActiveConv = useBoundStore((state) => state.ui.setActiveConv);
  const location = useLocation();


  const [isHoveringFiles, setIsHoveringFiles] = useState(false);

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
      <div className={activeConvId ? "hidden md:flex" : "flex"}>
        <Menu />
      </div>
      {/* Left Panel - Router Outlet */}
      <div
        className={
          "flex-col overflow-hidden border-border md:border-r bg-background text-foreground col-span-2 md:col-span-1 " +
          (activeConvId ? "hidden md:flex" : "flex")
        }
      >
        <Outlet />
      </div>

      {/* Center Panel - Chat */}
      <div
        className={
          "flex-col min-w-0 relative overflow-hidden col-span-full md:col-span-1" +
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
