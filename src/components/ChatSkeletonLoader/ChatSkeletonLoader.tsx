"use client";

import React from "react";
import ChatLayout from "@/components/Layouts/ChatLayout";
import { Skeleton, Space } from "antd";

export default function ChatSkeletonLoader() {
  return (
    <div className="flex h-[100dvh] w-full">
      <div className="h-[100dvh] z-10 flex flex-col justify-between px-[12px] pb-[10px] bg-gray border-r border-gray-line">
        {/* Upper section */}
        <div className="flex flex-col">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-[8px] mt-[10px] rounded-full">
              <Skeleton.Avatar active size="large" shape="circle" />
            </div>
          ))}
        </div>

        {/* Lower section */}
        <div className="flex flex-col items-center">
          <div className="px-[8px] py-[10px] mt-[10px] rounded-full">
            <Skeleton.Avatar active size="large" shape="circle" />
          </div>

          {/* User profile */}
          <div className="mt-[10px] p-[4px]">
            <Skeleton.Avatar active size="large" shape="circle" />
          </div>
        </div>
      </div>
      <div className="w-full lg:max-w-[calc(100%-85px)]">
        <ChatLayout
          topHeading={
            <div className="p-4 border-b border-gray-line">
              <Skeleton.Avatar active size="large" shape="circle" />
            </div>
          }
          leftColumnHeader={
            <div className="p-4 border-b border-gray-line">
              <Skeleton.Input active size="large" block />
            </div>
          }
          leftColumnBody={
            <div className="w-full">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center p-4 border-b border-gray-line"
                >
                  <Skeleton.Avatar active size="large" shape="circle" />
                  <div className="ml-4 flex-grow">
                    <Skeleton active paragraph={{ rows: 1 }} title={false} />
                    <Skeleton active paragraph={{ rows: 1 }} title={false} />
                  </div>
                </div>
              ))}
            </div>
          }
          centerColumnHeader={
            <div className="p-4 border-b flex items-center border-gray-line">
              <Skeleton.Avatar active size="large" shape="circle" />
              <div className="ml-4 flex-grow">
                <Skeleton.Input active size="small" style={{ width: "30%" }} />
              </div>
            </div>
          }
          centerColumnBody={
            <div className="w-full">
              <div
                className="p-4 space-y-4"
                style={{ height: "calc(100vh - 150px)" }}
              >
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`rounded-lg p-2 ${i % 2 === 0 ? "bg-blue-100" : "bg-white"}`}
                      style={{ maxWidth: "70%", minWidth: "30%" }}
                    >
                      <Skeleton active paragraph={{ rows: 1 }} title={false} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="sticky bottom-0 p-4 border-t bg-white border-gray-line">
                <Space>
                  <Skeleton.Avatar active size="large" shape="circle" />
                  <Skeleton.Input active size="large" block />
                  <Skeleton.Avatar active size="large" shape="circle" />
                </Space>
              </div>
            </div>
          }
          setIsHoveringCenterColumn={() => {}}
        />
      </div>
    </div>
  );
}
