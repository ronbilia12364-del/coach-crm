"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function usePortalClient() {
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const id = localStorage.getItem("portal_client_id");
    const name = localStorage.getItem("portal_client_name");
    if (!id) {
      router.replace("/portal/login");
      return;
    }
    setClientId(id);
    setClientName(name ?? "");
    setReady(true);
  }, [router]);

  return { clientId, clientName, ready };
}
