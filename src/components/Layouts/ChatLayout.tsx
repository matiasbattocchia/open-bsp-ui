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
  setIsHoveringCenterColumn = (bool: React.SetStateAction<boolean>) => {},
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
