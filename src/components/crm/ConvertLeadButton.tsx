"use client";

import { useState } from "react";
import { UserCheck, X } from "lucide-react";
import { convertLead } from "@/app/actions/leads";
import { PLAN_LABELS, type Lead } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ConvertLeadButton({ lead }: { lead: Lead }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleConvert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("name", lead.name);
    formData.set("phone", lead.phone);
    const result = await convertLead(lead.id, formData);
    setLoading(false);
    setOpen(false);
    if (result.clientId) {
      toast.success("✅ הליד הפך למתאמן בהצלחה!");
      router.push("/crm/clients");
    } else {
      toast.error(result.error ?? "שגיאה בהמרת הליד");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg transition-colors flex-1 justify-center"
      >
        <UserCheck size={12} />
        הפוך למתאמן
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">הפוך {lead.name} למתאמן</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleConvert} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">מסלול *</label>
                <select name="plan" required className="input">
                  {Object.entries(PLAN_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">תאריך התחלה</label>
                <input name="start_date" type="date" className="input" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">ביטול</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "ממיר..." : "הפוך למתאמן ✅"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
