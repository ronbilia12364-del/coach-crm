"use client";

import { completeCall } from "@/app/actions/calls";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function CompleteCallButton({ callId }: { callId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const result = await completeCall(callId);
    setLoading(false);
    if (result.error) { alert(result.error); return; }
    router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
      <CheckCircle2 size={12} />
      {loading ? "..." : "הושלם"}
    </button>
  );
}
