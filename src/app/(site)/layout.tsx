"use client";

import Menu from "@/components/Menu";
import ChatSkeletonLoader from "@/components/ChatSkeletonLoader/ChatSkeletonLoader";
import useBoundStore from "@/store/useBoundStore";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useStore } from "zustand";
import { resetAuthorizedCache } from "@/utils/IdbUtils";
import { useTranslation } from "react-dialect";

export default function Site({ children }: { children: ReactNode }) {
  const router = useRouter();
  const initialized = useStore(useBoundStore, (store) => store.ui.initialized);

  const { setCurrentLanguage } = useTranslation();

  useEffect(() => {
    let lang = "en";
    if (navigator.language.startsWith("es")) {
      lang = "es";
    } else if (navigator.language.startsWith("pt")) {
      lang = "pt";
    }
    setCurrentLanguage(lang);
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login");
        resetAuthorizedCache();
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized) {
    return <ChatSkeletonLoader />;
  }

  return (
    <div className="flex h-[100dvh] w-full">
      <Menu />
      <div className="flex grow max-w-[100%] lg:max-w-[calc(100%-65px)]">
        {children}
      </div>
    </div>
  );
}
