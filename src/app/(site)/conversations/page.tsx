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
