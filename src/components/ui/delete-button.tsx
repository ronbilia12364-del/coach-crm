"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecord } from "@/app/actions/delete";
import { useRouter } from "next/navigation";

type AllowedTable = "leads" | "clients" | "calls" | "payments";

export default function DeleteButton({
  itemId,
  tableName,
  itemLabel,
  cascadeNote,
}: {
  itemId: string;
  tableName: AllowedTable;
  itemLabel: string;
  cascadeNote?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteRecord(itemId, tableName);
    setLoading(false);
    setOpen(false);
    if (!result.error) {
      setToast({ message: "נמחק בהצלחה", ok: true });
      setTimeout(() => {
        router.refresh();
        setToast(null);
      }, 1500);
    } else {
      setToast({ message: `שגיאה במחיקה: ${result.error}`, ok: false });
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
            <h3 className="text-lg font-bold">אישור מחיקה</h3>
            <p className="text-sm text-gray-600">
              האם אתה בטוח שברצונך למחוק את{" "}
              <span className="font-medium">{itemLabel}</span>?
            </p>
            {cascadeNote && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {cascadeNote}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="btn-secondary">
                ביטול
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "מוחק..." : "מחק"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
