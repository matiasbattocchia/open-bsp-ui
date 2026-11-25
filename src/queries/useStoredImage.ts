import { useQuery } from "@tanstack/react-query";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import { supabase } from "@/supabase/client";
import { queryKeys } from "./queryKeys";

const BASE_URI = "internal://media/";

/**
 * A stored image (a post's cover) as a URL an <img> shows: downloaded once,
 * then kept. Undefined until it is there, and when it can't be.
 */
export function useStoredImage(uri: string | undefined): string | undefined {
  const { data: blob } = useQuery({
    queryKey: queryKeys.media.file(uri),
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("media")
        .download(uri!.slice(BASE_URI.length));

      if (error) throw error;

      return data;
    },
    enabled: !!uri?.startsWith(BASE_URI),
    staleTime: Infinity,
  });

  return useObjectUrl(blob);
}
