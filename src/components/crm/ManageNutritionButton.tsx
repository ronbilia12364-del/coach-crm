"use client";

import Link from "next/link";

export default function ManageNutritionButton({
  clientId,
  planId,
}: {
  clientId: string;
  planId?: string;
}) {
  return (
    <Link
      href={`/crm/clients/${clientId}/nutrition`}
      className="btn-secondary text-xs py-1 px-3 block text-center"
    >
      {planId ? "ערוך תפריט" : "צור תפריט"}
    </Link>
  );
}
