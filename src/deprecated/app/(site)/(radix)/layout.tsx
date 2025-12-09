"use client";

import { Theme } from "@radix-ui/themes";

export default function RadixLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grow">
      <Theme>{children}</Theme>
    </div>
  );
}
