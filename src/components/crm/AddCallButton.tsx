"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addCall } from "@/app/actions/calls";
import { CALL_TYPE_LABELS } from "@/types";
import { useRouter } from "next/navigation";

type Person = { id: string; name: string };

export default function AddCallButton({
  clients,
  leads,
}: {
  clients: Person[];
  leads: Person[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await addCall(formData);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={16} /> הוסף שיחה
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">קביעת שיחה</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">עם מי?</label>
                <select name="target" required className="input">
                  {clients.length > 0 && (
                    <optgroup label="מתאמנים">
                      {clients.map((c) => <option key={c.id} value={`client:${c.id}`}>{c.name}</option>)}
                    </optgroup>
                  )}
                  {leads.length > 0 && (
                    <optgroup label="לידים">
                      {leads.map((l) => <option key={l.id} value={`lead:${l.id}`}>{l.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">סוג שיחה</label>
                <select name="call_type" required className="input">
                  {Object.entries(CALL_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">מועד</label>
                <input name="scheduled_at" type="datetime-local" required className="input" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">הערות</label>
                <input name="notes" className="input" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">ביטול</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "שומר..." : "קבע שיחה"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
