"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePortalClient } from "@/hooks/usePortalClient";
import { type WeightLog } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";

export default function PortalWeightPage() {
  const { clientId, ready } = usePortalClient();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [goal, setGoal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function fetchData() {
    if (!clientId) return;
    const supabase = createClient();
    const [{ data: logsData }, { data: client }] = await Promise.all([
      supabase.from("weight_logs").select("*").eq("client_id", clientId).order("logged_at"),
      supabase.from("clients").select("weight_goal").eq("id", clientId).single(),
    ]);
    setLogs(logsData ?? []);
    setGoal(client?.weight_goal ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (ready && clientId) fetchData();
  }, [clientId, ready]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("weight_logs").insert({
      client_id: clientId,
      weight: Number(weight),
      logged_at: new Date().toISOString().split("T")[0],
      notes: notes || null,
    });
    setWeight("");
    setNotes("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchData();
  }

  if (!ready || loading) return <div className="flex items-center justify-center h-64 text-gray-400">טוען...</div>;

  const latest = logs[logs.length - 1];
  const first = logs[0];
  const diff = latest && first ? latest.weight - first.weight : 0;

  const chartData = logs.map((l) => ({
    date: new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit" }).format(new Date(l.logged_at)),
    משקל: l.weight,
  }));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">מעקב שקילות</h2>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">נוכחי</p>
          <p className="text-2xl font-bold mt-1">{latest?.weight ?? "—"}</p>
          <p className="text-xs text-gray-400">ק"ג</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">שינוי</p>
          <p className={`text-2xl font-bold mt-1 ${diff < 0 ? "text-green-600" : diff > 0 ? "text-red-500" : ""}`}>
            {diff > 0 ? "+" : ""}{diff.toFixed(1)}
          </p>
          <p className="text-xs text-gray-400">ק"ג</p>
        </div>
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">יעד</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{goal ?? "—"}</p>
          <p className="text-xs text-gray-400">ק"ג</p>
        </div>
      </div>

      {/* Chart */}
      {logs.length > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-medium mb-3 text-gray-700">גרף התקדמות</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
              <Tooltip />
              {goal && <ReferenceLine y={goal} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "יעד", position: "right", fontSize: 11 }} />}
              <Line type="monotone" dataKey="משקל" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Add weight */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold mb-3">הוסף שקילה</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">משקל (ק"ג)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              className="input text-center text-lg"
              placeholder="75.5"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">הערה (אופציונלי)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input text-sm" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={16} />
            {saving ? "שומר..." : saved ? "✅ נשמר!" : "הוסף שקילה"}
          </button>
        </form>
      </div>

      {/* History */}
      {logs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-semibold text-sm">היסטוריה</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {[...logs].reverse().slice(0, 10).map((log) => (
              <div key={log.id} className="flex justify-between items-center px-4 py-3">
                <p className="text-sm text-gray-500">{formatDate(log.logged_at)}</p>
                <p className="font-medium">{log.weight} ק"ג</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
