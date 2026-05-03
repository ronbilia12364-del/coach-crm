"use client";

import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { addPayment, addRecurringPayments } from "@/app/actions/payments";
import { PAYMENT_METHOD_LABELS } from "@/types";
import { useRouter } from "next/navigation";
import { addMonths, startOfMonth } from "date-fns";

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function formatMonthHebrew(date: Date): string {
  return `${HEBREW_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export default function AddPaymentButton({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [totalMonths, setTotalMonths] = useState(4);
  const [startMonth, setStartMonth] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const router = useRouter();

  const thisMonth = new Date().toISOString().slice(0, 7) + "-01";

  const recurringPreview = useMemo(() => {
    if (!isRecurring || !startMonth) return [];
    const base = startOfMonth(new Date(startMonth));
    return Array.from({ length: totalMonths }, (_, i) => addMonths(base, i));
  }, [isRecurring, startMonth, totalMonths]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);

    const result = isRecurring
      ? await addRecurringPayments(clientId, formData)
      : await addPayment(clientId, formData);

    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setOpen(false);
    setIsRecurring(false);
    setTotalMonths(4);
    router.refresh();
  }

  function handleClose() {
    setOpen(false);
    setIsRecurring(false);
    setTotalMonths(4);
    setError(null);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary text-xs py-1 px-3 flex items-center gap-1">
        <Plus size={12} /> תשלום
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">הוסף תשלום</h3>
              <button onClick={handleClose}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Recurring checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 accent-green-600"
                />
                <span className="text-sm font-medium text-gray-700">הוראת קבע</span>
              </label>

              {/* Amount fields */}
              {isRecurring ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">מחיר חודשי (₪) *</label>
                    <input name="monthly_amount" type="number" required className="input" placeholder="550" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">מספר חודשים *</label>
                    <input
                      name="total_months"
                      type="number"
                      required
                      min={2}
                      max={24}
                      value={totalMonths}
                      onChange={(e) => setTotalMonths(Math.max(2, Number(e.target.value)))}
                      className="input"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">סכום (₪) *</label>
                  <input name="amount" type="number" required className="input" placeholder="550" />
                </div>
              )}

              {/* Month */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  {isRecurring ? "חודש התחלה *" : "חודש *"}
                </label>
                <input
                  name="month"
                  type="date"
                  required
                  defaultValue={thisMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="input"
                />
              </div>

              {/* Recurring preview */}
              {isRecurring && recurringPreview.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-800">
                  <p className="font-semibold mb-1">ייווצרו {recurringPreview.length} תשלומים:</p>
                  <p className="text-green-700 leading-relaxed">
                    {recurringPreview.map(formatMonthHebrew).join(" · ")}
                  </p>
                </div>
              )}

              {/* Status + Method */}
              <div className="grid grid-cols-2 gap-3">
                {!isRecurring && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">סטטוס</label>
                    <select name="status" className="input">
                      <option value="unpaid">לא שולם</option>
                      <option value="paid">שולם</option>
                      <option value="partial">חלקי</option>
                    </select>
                  </div>
                )}
                <div className={isRecurring ? "col-span-2" : ""}>
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
                <button type="button" onClick={handleClose} className="btn-secondary">ביטול</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading
                    ? "שומר..."
                    : isRecurring
                    ? `צור ${totalMonths} תשלומים`
                    : "הוסף"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
