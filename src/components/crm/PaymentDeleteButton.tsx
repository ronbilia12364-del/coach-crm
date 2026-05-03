"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deletePayment, deleteRecurringGroup } from "@/app/actions/payments";
import { useRouter } from "next/navigation";

type Props = {
  paymentId: string;
  clientName: string;
  recurringGroupId?: string | null;
  recurringTotalMonths?: number | null;
};

export default function PaymentDeleteButton({
  paymentId,
  clientName,
  recurringGroupId,
  recurringTotalMonths,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const router = useRouter();

  const isRecurring = !!recurringGroupId;

  async function handleDeleteSingle() {
    setLoading(true);
    const result = await deletePayment(paymentId);
    finish(result.error);
  }

  async function handleDeleteGroup() {
    if (!recurringGroupId) return;
    setLoading(true);
    const result = await deleteRecurringGroup(recurringGroupId);
    finish(result.error);
  }

  function finish(error: string | null) {
    setLoading(false);
    setOpen(false);
    if (!error) {
      setToast({ message: "נמחק בהצלחה", ok: true });
      setTimeout(() => {
        router.refresh();
        setToast(null);
      }, 1500);
    } else {
      setToast({ message: `שגיאה במחיקה: ${error}`, ok: false });
      setTimeout(() => setToast(null), 4000);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
        title="מחק"
      >
        <Trash2 size={13} />
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold">מחיקת תשלום</h3>

            {isRecurring ? (
              <>
                <p className="text-sm text-gray-600">
                  תשלום זה של <span className="font-medium">{clientName}</span> הוא חלק מהוראת קבע.
                  <br />
                  מה תרצה למחוק?
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  מחיקת כל הוראת הקבע תמחק{" "}
                  <span className="font-bold">{recurringTotalMonths} תשלומים</span>.
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleDeleteSingle}
                    disabled={loading}
                    className="text-sm border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-right"
                  >
                    מחק רק את התשלום הזה
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    disabled={loading}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 text-right"
                  >
                    {loading ? "מוחק..." : `מחק את כל הוראת הקבע (${recurringTotalMonths} תשלומים)`}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  האם אתה בטוח שברצונך למחוק את תשלום של{" "}
                  <span className="font-medium">{clientName}</span>?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setOpen(false)} className="btn-secondary">
                    ביטול
                  </button>
                  <button
                    onClick={handleDeleteSingle}
                    disabled={loading}
                    className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? "מוחק..." : "מחק"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
