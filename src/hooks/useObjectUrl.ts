import { useEffect, useState } from "react";

/**
 * A blob as a URL an element shows: made while it is shown, revoked after.
 * Both happen in the one effect, so a remount gets a fresh URL instead of the
 * one its unmount revoked.
 */
export function useObjectUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    setUrl(url);

    return () => {
      URL.revokeObjectURL(url);
      setUrl(undefined);
    };
  }, [blob]);

  return url;
}
