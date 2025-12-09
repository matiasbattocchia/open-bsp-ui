"use client";

import Login from "@/components/Login";

export default function Page() {
  return (
    <div className="flex h-[100dvh] w-full">
      <div className="flex grow max-w-[100%]">
        <Login />
      </div>
    </div>
  );
}
