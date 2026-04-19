"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { addPayment } from "@/app/actions/payments";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { useRouter } from "next/navigation";

export default function AddPaymentButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await addPayment(clientId, formData);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  const thisMonth = new Date().toISOString().slice(0, 7) + "-01";

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-xs py-1 px-3 flex items-center gap-1">
        <Plus size={12} /> תשלום
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">הוסף תשלום</h3>
              <button onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">סכום (₪) *</label>
                  <input name="amount" type="number" required className="input" placeholder="550" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">חודש *</label>
                  <input name="month" type="date" required defaultValue={thisMonth} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">סטטוס</label>
                  <select name="status" className="input">
                    <option value="unpaid">לא שולם</option>
                    <option value="paid">שולם</option>
                    <option value="partial">חלקי</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">אמצעי תשלום</label>
                  <select name="method" className="input">
                    <option value="">— בחר —</option>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">הערות</label>
                <input name="notes" className="input" />
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">ביטול</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? "שומר..." : "הוסף"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
