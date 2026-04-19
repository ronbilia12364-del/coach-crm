"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePortalClient } from "@/hooks/usePortalClient";
import { PLAN_LABELS, STATUS_LABELS } from "@/types";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { LogOut } from "lucide-react";

export default function PortalProfilePage() {
  const { clientId, ready } = usePortalClient();
  const [client, setClient] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!ready || !clientId) return;
    createClient()
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single()
      .then(({ data }) => setClient(data));
  }, [clientId, ready]);

  function handleLogout() {
    localStorage.removeItem("portal_client_id");
    localStorage.removeItem("portal_client_name");
    router.push("/portal/login");
  }

  if (!ready || !client) return <div className="flex items-center justify-center h-64 text-gray-400">טוען...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">הפרופיל שלי</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">💪</span>
        </div>
        <h3 className="text-xl font-bold">{client.name}</h3>
        <p className="text-gray-500 text-sm mt-1">{client.phone}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        <Row label="מסלול" value={PLAN_LABELS[client.plan as keyof typeof PLAN_LABELS]} />
        <Row label="סטטוס" value={STATUS_LABELS[client.status as keyof typeof STATUS_LABELS]} />
        {client.start_date && <Row label="תחילת אימונים" value={formatDate(client.start_date)} />}
        {client.weight_goal && <Row label={`יעד משקל`} value={`${client.weight_goal} ק"ג`} />}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors"
      >
        <LogOut size={18} />
        יציאה
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-6 py-4">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  );
}
