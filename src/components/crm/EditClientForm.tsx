"use client";

import { useState } from "react";
import { updateClient } from "@/app/actions/clients";
import { PLAN_LABELS, STATUS_LABELS, type Client } from "@/types";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";

export default function EditClientForm({ client }: { client: Client }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateClient(client.id, formData);
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    setEditing(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="card space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">פרטי מתאמן</h3>
          <button onClick={() => setEditing(true)} className="p-1 hover:bg-gray-100 rounded-lg">
            <Pencil size={14} className="text-gray-400" />
          </button>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="טלפון" value={client.phone} />
          {client.email && <Row label="אימייל" value={client.email} />}
          <Row label="מסלול" value={PLAN_LABELS[client.plan]} />
          <Row label="סטטוס" value={STATUS_LABELS[client.status]} />
          {client.start_date && <Row label="התחלה" value={new Date(client.start_date).toLocaleDateString("he-IL")} />}
          {client.weight_goal && <Row label='יעד משקל' value={`${client.weight_goal} ק"ג`} />}
          {client.notes && <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500">{client.notes}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-sm">עריכת פרטים</h3>
        <button onClick={() => setEditing(false)}><X size={16} className="text-gray-400" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs text-gray-500">שם</label>
          <input name="name" defaultValue={client.name} required className="input mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500">טלפון</label>
          <input name="phone" defaultValue={client.phone} required className="input mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500">אימייל</label>
          <input name="email" type="email" defaultValue={client.email ?? ""} className="input mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500">מסלול</label>
          <select name="plan" defaultValue={client.plan} className="input mt-1">
            {Object.entries(PLAN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">סטטוס</label>
          <select name="status" defaultValue={client.status} className="input mt-1">
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">תאריך התחלה</label>
          <input name="start_date" type="date" defaultValue={client.start_date ?? ""} className="input mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500">יעד משקל</label>
          <input name="weight_goal" type="number" step="0.1" defaultValue={client.weight_goal ?? ""} className="input mt-1" />
        </div>
        <div>
          <label className="text-xs text-gray-500">הערות</label>
          <textarea name="notes" defaultValue={client.notes ?? ""} rows={2} className="input mt-1 resize-none" />
        </div>
        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save size={14} />
          {loading ? "שומר..." : "שמור שינויים"}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
