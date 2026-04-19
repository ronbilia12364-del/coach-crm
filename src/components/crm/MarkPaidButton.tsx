"use client";

import { markPaid } from "@/app/actions/payments";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MarkPaidButton({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    const result = await markPaid(paymentId);
    setLoading(false);
    if (result.error) { alert(result.error); return; }
    router.refresh();
  }

  return (
    <button onClick={handleClick} disabled={loading} className="btn-primary text-xs py-1 px-3">
      {loading ? "..." : "✅ סמן שולם"}
    </button>
  );
}
