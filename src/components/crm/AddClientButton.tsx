"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addClient } from "@/app/actions/clients";
import { PLAN_LABELS } from "@/types";
import { useRouter } from "next/navigation";

export default function AddClientButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await addClient(formData);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={16} /> הוסף מתאמן
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">מתאמן חדש</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">שם *</label>
                  <input name="name" required className="input" placeholder="ישראל ישראלי" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">טלפון *</label>
                  <input name="phone" required className="input" placeholder="050-1234567" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">אימייל</label>
                <input name="email" type="email" className="input" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">מסלול *</label>
                  <select name="plan" required className="input">
                    {Object.entries(PLAN_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">סטטוס</label>
                  <select name="status" className="input">
                    <option value="pending">ממתין</option>
                    <option value="active">פעיל</option>
                    <option value="inactive">לא פעיל</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">תאריך התחלה</label>
                  <input name="start_date" type="date" className="input" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">יעד משקל (ק"ג)</label>
                  <input name="weight_goal" type="number" step="0.1" className="input" placeholder="70" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">הערות</label>
                <textarea name="notes" rows={2} className="input resize-none" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">ביטול</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "שומר..." : "הוסף מתאמן"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
