"use client";

import Link from "next/link";

export default function ManageTrainingButton({
  clientId,
  planId,
}: {
  clientId: string;
  planId?: string;
}) {
  return (
    <Link
      href={`/crm/clients/${clientId}/training`}
      className="btn-secondary text-xs py-1 px-3 block text-center"
    >
      {planId ? "ערוך אימונים" : "צור תוכנית"}
    </Link>
  );
}
