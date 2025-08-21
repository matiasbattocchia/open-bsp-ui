"use client";

import React from "react";
import Header from "@/components/Header";
import ChatFilter from "@/components/ChatFilter";
import ChatSearch from "@/components/ChatSearch";
import ChatList from "@/components/ChatList";
import ChatLayout from "@/components/Layouts/ChatLayout";

export default function Page() {
  return (
    <ChatLayout
      topHeading={<></>}
      leftColumnHeader={
        <>
          <Header /> {/* height: 59 px */}
          <ChatSearch /> {/* height: 49 px */}
          <ChatFilter /> {/* height: 43 px */}
        </>
      }
      leftColumnBody={<ChatList type={"organizations"} />}
      centerColumnHeader={<></>}
      centerColumnBody={<></>}
      setIsHoveringCenterColumn={() => {}}
    />
  );
}
