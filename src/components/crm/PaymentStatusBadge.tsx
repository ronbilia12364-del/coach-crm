"use client";

import { type PaymentStatus } from "@/types";

const LABELS: Record<PaymentStatus, string> = {
  paid: "שולם",
  unpaid: "לא שולם",
  partial: "חלקי",
};

const COLORS: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-700",
  unpaid: "bg-red-100 text-red-600",
  partial: "bg-yellow-100 text-yellow-700",
};

export default function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span className={`badge ${COLORS[status]}`}>
      {LABELS[status]}
    </span>
  );
}
