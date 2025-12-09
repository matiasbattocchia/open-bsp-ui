"use client";

import ChatSkeletonLoader from "@/components/ChatSkeletonLoader/ChatSkeletonLoader";
import { supabase } from "@/supabase/client";
import { resetAuthorizedCache } from "@/utils/IdbUtils";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

// If it happens that the user hits the root of the app
// and is authenticated will then go to conversations page
// if not will be redirected to the login page
export default function Page() {
  const router = useRouter();

  useEffect(() => {

    const { data } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        router.push("/login");
        resetAuthorizedCache();
      } else {
        router.push("/conversations");
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <ChatSkeletonLoader />;
}
