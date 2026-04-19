"use client";

import { STATUS_LABELS, type ClientStatus } from "@/types";

const COLORS: Record<ClientStatus, string> = {
  active: "bg-green-100 text-green-700",
  lead: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  inactive: "bg-gray-100 text-gray-500",
};

export default function ClientStatusBadge({ status }: { status: ClientStatus }) {
  return (
    <span className={`badge ${COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
