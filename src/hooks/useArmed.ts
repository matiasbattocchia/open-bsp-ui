import { useEffect, useState } from "react";

/**
 * The safety catch on a destructive action: the first click arms it, the
 * second carries it out. An armed action that isn't followed through disarms
 * itself after `timeout` ms (null keeps it armed, as while typing a name to
 * confirm).
 */
export function useArmed(timeout: number | null = 4000) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed || timeout === null) return;
    const id = setTimeout(() => setArmed(false), timeout);
    return () => clearTimeout(id);
  }, [armed, timeout]);

  return [armed, setArmed] as const;
}
