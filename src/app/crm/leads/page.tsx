import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { buildWhatsAppUrl, buildLeadWhatsAppMessage, formatDate } from "@/lib/utils";
import { LEAD_STATUS_LABELS, type Lead, type LeadStatus } from "@/types";
import { MessageCircle, UserCheck } from "lucide-react";
import AddLeadButton from "@/components/crm/AddLeadButton";
import LeadStatusSelect from "@/components/crm/LeadStatusSelect";
import ConvertLeadButton from "@/components/crm/ConvertLeadButton";
import Link from "next/link";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-700",
  messaged: "bg-yellow-100 text-yellow-700",
  call_scheduled: "bg-purple-100 text-purple-700",
  converted: "bg-green-100 text-green-700",
  lost: "bg-gray-100 text-gray-500",
};

export default async function LeadsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .not("status", "eq", "converted")
    .order("created_at", { ascending: false });

  const leads = (data ?? []) as Lead[];

  const byStatus = Object.entries(LEAD_STATUS_LABELS).filter(([k]) => k !== "converted" && k !== "lost");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">לידים</h2>
          <p className="text-gray-500 mt-1">{leads.length} לידים פעילים</p>
        </div>
        <AddLeadButton />
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {byStatus.map(([status, label]) => {
          const statusLeads = leads.filter((l) => l.status === status);
          return (
            <div key={status} className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-700">{label}</h3>
                <span className="badge bg-gray-200 text-gray-600">{statusLeads.length}</span>
              </div>
              <div className="space-y-3">
                {statusLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
                {statusLeads.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">אין לידים</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const waUrl = buildWhatsAppUrl(lead.phone, buildLeadWhatsAppMessage(lead.name));
  const sourceIcon = lead.source === "instagram" ? "📸" : "👥";

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">{lead.name}</p>
          <p className="text-xs text-gray-400 font-mono">{lead.phone}</p>
        </div>
        <span className="text-base">{sourceIcon}</span>
      </div>
      {lead.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{lead.notes}</p>}
      <p className="text-xs text-gray-400">{formatDate(lead.created_at)}</p>
      <div className="flex gap-2">
        <LeadStatusSelect leadId={lead.id} currentStatus={lead.status as LeadStatus} />
      </div>
      <div className="flex gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg transition-colors flex-1 justify-center"
        >
          <MessageCircle size={12} />
          WhatsApp
        </a>
        <ConvertLeadButton lead={lead} />
      </div>
    </div>
  );
}
