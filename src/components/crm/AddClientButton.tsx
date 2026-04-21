"use client";

import { useState } from "react";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { addClientWithPayments } from "@/app/actions/clients";
import { PLAN_LABELS } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const today = new Date().toISOString().split("T")[0];

export default function AddClientButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("trial");
  const [customPlan, setCustomPlan] = useState("");
  const [showPayments, setShowPayments] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [totalMonths, setTotalMonths] = useState(1);
  const [monthlyAmount, setMonthlyAmount] = useState<number | "">("");
  const router = useRouter();

  function resetForm() {
    setPlan("trial");
    setCustomPlan("");
    setShowPayments(false);
    setStartDate(today);
    setTotalMonths(1);
    setMonthlyAmount("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const finalPlan = plan === "__custom__" ? customPlan.trim() : plan;
    if (!finalPlan) {
      toast.error("יש להזין שם מסלול");
      return;
    }

    setLoading(true);
    const fd = new FormData(e.currentTarget);

    const result = await addClientWithPayments({
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      email: (fd.get("email") as string) || undefined,
      plan: finalPlan,
      status: (fd.get("status") as string) || "pending",
      start_date: startDate || undefined,
      weight_goal: fd.get("weight_goal") ? Number(fd.get("weight_goal")) : null,
      notes: (fd.get("notes") as string) || undefined,
      add_payments: showPayments && !!monthlyAmount && totalMonths > 0,
      total_months: showPayments ? totalMonths : undefined,
      monthly_amount: showPayments && monthlyAmount ? Number(monthlyAmount) : undefined,
    });

    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("המתאמן נוסף בהצלחה" + (showPayments && monthlyAmount ? ` + ${totalMonths} תשלומים` : ""));
    setOpen(false);
    resetForm();
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus size={16} /> הוסף מתאמן
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">מתאמן חדש</h3>
              <button onClick={() => { setOpen(false); resetForm(); }}>
                <X size={20} className="text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Basic fields */}
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
                  <select
                    className="input"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    required
                  >
                    {Object.entries(PLAN_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                    <option value="__custom__">➕ מסלול אחר...</option>
                  </select>
                  {plan === "__custom__" && (
                    <input
                      className="input mt-2"
                      placeholder="שם המסלול"
                      value={customPlan}
                      onChange={(e) => setCustomPlan(e.target.value)}
                      required
                    />
                  )}
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
                  <input
                    type="date"
                    className="input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
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

              {/* Payment section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPayments((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <span>💰 הוסף תשלומים אוטומטית (אופציונלי)</span>
                  {showPayments ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {showPayments && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">מספר חודשים</label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          className="input"
                          value={totalMonths}
                          onChange={(e) => setTotalMonths(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">סכום לחודש (₪)</label>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className="input"
                          placeholder="400"
                          value={monthlyAmount}
                          onChange={(e) => setMonthlyAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    </div>
                    {monthlyAmount && totalMonths > 0 && startDate && (
                      <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        ייווצרו {totalMonths} תשלומים של ₪{monthlyAmount} כ"א, החל מ-{startDate}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1 pb-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); resetForm(); }}
                  className="btn-secondary"
                >
                  ביטול
                </button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading
                    ? "שומר..."
                    : showPayments && monthlyAmount
                    ? "הוסף מתאמן + תשלומים"
                    : "הוסף מתאמן"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
