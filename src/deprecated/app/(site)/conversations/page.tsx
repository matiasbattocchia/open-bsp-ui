// @ts-nocheck
"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import ChatFilter from "@/components/ChatFilter";
import ChatHeader from "@/components/ChatHeader";
import Chat from "@/components/Chat";
import ChatFooter from "@/components/ChatFooter";
import FilePreviewer from "@/components/FileUploader/FilePreviewer";
import FilePicker from "@/components/FileUploader/FilePicker";
import ChatSearch from "@/components/ChatSearch";
import ChatList from "@/components/ChatList";
import Templates from "@/components/Templates";
import NewChat from "@/components/NewChat";
import ChatLayout from "@/components/Layouts/ChatLayout";

"use client";

import { TickProvider } from "@/context/useTick";
import useBoundStore from "@/store/useBoundStore";
import { ReactNode } from "react";
import { useStore } from "zustand";

interface ChatLayoutProps {
  topHeading: ReactNode;
  leftColumnHeader: ReactNode;
  leftColumnBody: ReactNode;
  centerColumnHeader: ReactNode;
  centerColumnBody: ReactNode;
  setIsHoveringCenterColumn: (value: React.SetStateAction<boolean>) => void;
}

export default function ChatLayout({
  topHeading,
  leftColumnHeader,
  leftColumnBody,
  centerColumnHeader,
  centerColumnBody,
  setIsHoveringCenterColumn = (bool: React.SetStateAction<boolean>) => { },
}: ChatLayoutProps) {
  const activeConvId = useStore(
    useBoundStore,
    (state) => state.ui.activeConvId,
  );
  return (
    <div className="flex grow w-full">
      <TickProvider>
        <div
          id="left-column"
          className={`relative grow md:max-w-[40%] ${!activeConvId ? "" : "hidden md:block"}`}
        >
          {topHeading} {/* z-index: 20 */}
          <div id="left-column-header" className="flex flex-col">
            {leftColumnHeader}
          </div>
          <div id="left-column-body" className="flex h-[calc(100dvh-151px)]">
            {leftColumnBody}
          </div>
        </div>
        <div
          id="center-column"
          className={`grow flex flex-col bg-gray ${activeConvId ? "" : "hidden md:block"} w-[100dvw] md:max-w-[60%]`}
          onDragEnter={(e) => setIsHoveringCenterColumn(true)}
          onDrop={(e) => setIsHoveringCenterColumn(false)}
        >
          <div id="center-column-header" className="flex flex-col">
            {centerColumnHeader}
          </div>
          <div
            id="center-column-body"
            className="flex flex-col h-[calc(100dvh-59px)] relative"
          /* Center column body must be relative because the chat header is always visible when displaying views like the file picker. */
          >
            {centerColumnBody}
          </div>
        </div>
        {/* TODO: Add right column */}
        {/* <div id="right-column"></div> */}
      </TickProvider>
    </div>
  );
}

export default function Page() {
  const [isHoveringFiles, setIsHoveringFiles] = useState(false);

  return (
    <ChatLayout
      topHeading={<NewChat />}
      leftColumnHeader={
        <>
          <Header /> {/* height: 59 px */}
          <ChatSearch /> {/* height: 49 px */}
          <ChatFilter /> {/* height: 43 px */}
        </>
      }
      leftColumnBody={<ChatList type={"conversations"} />}
      centerColumnHeader={<ChatHeader />} // z-index: 30 height: 59 px
      centerColumnBody={
        <>
          {isHoveringFiles && (
            <FilePicker setHovering={setIsHoveringFiles} /> /* z-index: 40 */
          )}
          <FilePreviewer /> {/* z-index: 20 */}
          <Chat />
          <Templates /> {/* z-index: 10 */}
          <ChatFooter />
        </>
      }
      setIsHoveringCenterColumn={setIsHoveringFiles}
    />
  );
}
