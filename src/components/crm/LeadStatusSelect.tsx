"use client";

import { updateLeadStatus } from "@/app/actions/leads";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/types";
import { useRouter } from "next/navigation";

export default function LeadStatusSelect({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: LeadStatus;
}) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await updateLeadStatus(leadId, e.target.value);
    router.refresh();
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className="input text-xs py-1 flex-1"
    >
      {Object.entries(LEAD_STATUS_LABELS)
        .filter(([k]) => k !== "converted")
        .map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
    </select>
  );
}
