"use client";

import { useCallback, useEffect, useState } from "react";
import { getRole, setRole as persist } from "@/lib/store";
import type { Role } from "@/lib/types";

const EVT = "gs-role-change";

// Shared role state across client components. Defaults to "developer" until the
// stored value loads. `ready` lets pages avoid a flash before localStorage reads.
export function useRole(): { role: Role; setRole: (r: Role) => void; ready: boolean } {
  const [role, setRoleState] = useState<Role>("developer");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const r = getRole();
    if (r) setRoleState(r);
    setReady(true);
    const h = (e: Event) => setRoleState((e as CustomEvent).detail as Role);
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, []);

  const setRole = useCallback((r: Role) => {
    persist(r);
    setRoleState(r);
    window.dispatchEvent(new CustomEvent(EVT, { detail: r }));
  }, []);

  return { role, setRole, ready };
}
