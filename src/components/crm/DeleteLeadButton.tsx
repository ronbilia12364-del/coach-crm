"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteLead } from "@/app/actions/leads";
import { useRouter } from "next/navigation";

export default function DeleteLeadButton({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const result = await deleteLead(leadId);
    setLoading(false);
    if (!result.error) {
      setSuccess(true);
      setOpen(false);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
        title="מחק ליד"
      >
        <Trash2 size={13} />
      </button>

      {success && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white text-sm px-4 py-2 rounded-xl shadow-lg">
          הליד נמחק בהצלחה
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold">מחיקת ליד</h3>
            <p className="text-sm text-gray-600">
              האם אתה בטוח שברצונך למחוק את הליד <span className="font-medium">{leadName}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setOpen(false)} className="btn-secondary">ביטול</button>
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
