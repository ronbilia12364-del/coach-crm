"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updatePayment, updateRecurringGroup } from "@/app/actions/payments";
import { useRouter } from "next/navigation";
import { type Payment, type PaymentStatus, PAYMENT_METHOD_LABELS } from "@/types";

type Props = {
  payment: Payment;
  clientName: string;
};

export default function PaymentEditDialog({ payment, clientName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState<"single" | "group">("single");
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const router = useRouter();

  const isRecurring = !!payment.recurring_group_id;

  const [amount, setAmount] = useState(String(payment.amount));
  const [month, setMonth] = useState(payment.month.slice(0, 7));
  const [status, setStatus] = useState<PaymentStatus>(payment.status);
  const [method, setMethod] = useState(payment.method ?? "");
  const [notes, setNotes] = useState(payment.notes ?? "");

  function openDialog() {
    setAmount(String(payment.amount));
    setMonth(payment.month.slice(0, 7));
    setStatus(payment.status);
    setMethod(payment.method ?? "");
    setNotes(payment.notes ?? "");
    setEditMode("single");
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const data = {
      amount: Number(amount),
      month: month + "-01",
      status,
      method: method || null,
      notes: notes || null,
    };

    let result;
    if (editMode === "group" && payment.recurring_group_id) {
      result = await updateRecurringGroup(
        payment.recurring_group_id,
        payment.recurring_month_number ?? 1,
        data
      );
    } else {
      result = await updatePayment(payment.id, data);
    }

    setLoading(false);
    if (!result.error) {
      setOpen(false);
      setToast({ message: "עודכן בהצלחה", ok: true });
      setTimeout(() => {
        router.refresh();
        setToast(null);
      }, 1500);
    } else {
      setToast({ message: `שגיאה: ${result.error}`, ok: false });
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="p-1.5 text-gray-300 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
        title="ערוך"
      >
        <Pencil size={13} />
      </button>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white text-sm px-4 py-2 rounded-xl shadow-lg ${
            toast.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">עריכת תשלום</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 -mt-2">{clientName}</p>

            {isRecurring && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-blue-700">תשלום זה חלק מהוראת קבע:</p>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="radio"
                    name="editMode"
                    value="single"
                    checked={editMode === "single"}
                    onChange={() => setEditMode("single")}
                    className="accent-green-600"
                  />
                  ערוך רק את התשלום הזה
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="radio"
                    name="editMode"
                    value="group"
                    checked={editMode === "group"}
                    onChange={() => setEditMode("group")}
                    className="accent-green-600"
                  />
                  ערוך את כל הוראת הקבע ({payment.recurring_total_months} תשלומים)
                </label>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">סכום (₪)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input w-full"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  חודש{editMode === "group" ? " (חודש זה — שאר יחושבו בהתאם)" : ""}
                </label>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">סטטוס</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                  className="input w-full"
                >
                  <option value="paid">שולם</option>
                  <option value="unpaid">לא שולם</option>
                  <option value="partial">חלקי</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">אופן תשלום</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="input w-full"
                >
                  <option value="">— ללא —</option>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">הערות</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input w-full h-20 resize-none"
                  placeholder="הערות..."
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? "שומר..." : "שמור שינויים"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn-secondary"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
