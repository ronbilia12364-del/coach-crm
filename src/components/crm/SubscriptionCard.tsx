"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Snowflake, Play, CalendarDays, Clock } from "lucide-react";
import { freezeSubscription, unfreezeSubscription } from "@/app/actions/clients";
import { computeEndDate } from "@/lib/utils";
import { type Client } from "@/types";

export default function SubscriptionCard({ client }: { client: Client }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isFrozen = !!client.frozen_at;
  const endDate = computeEndDate(client);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = endDate
    ? Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000)
    : null;

  async function handleFreeze() {
    setLoading(true);
    await freezeSubscription(client.id);
    setLoading(false);
    router.refresh();
  }

  async function handleUnfreeze() {
    setLoading(true);
    await unfreezeSubscription(client.id);
    setLoading(false);
    router.refresh();
  }

  if (!client.start_date) return null;

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays size={16} className="text-green-500" />
        <h3 className="font-semibold text-sm">מנוי וליווי</h3>
        {isFrozen && (
          <span className="mr-auto text-xs bg-blue-100 text-blue-600 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <Snowflake size={11} />
            מוקפא
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        {endDate && (
          <div className="flex justify-between">
            <span className="text-gray-500">תאריך סיום</span>
            <span className="font-medium">
              {endDate.toLocaleDateString("he-IL")}
            </span>
          </div>
        )}

        {daysLeft !== null && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">ימים נותרו</span>
            <span
              className={`font-bold ${
                isFrozen
                  ? "text-blue-500"
                  : daysLeft <= 0
                  ? "text-red-500"
                  : daysLeft <= 7
                  ? "text-orange-500"
                  : "text-green-600"
              }`}
            >
              {isFrozen ? "מוקפא" : daysLeft <= 0 ? "הסתיים" : `${daysLeft} ימים`}
            </span>
          </div>
        )}

        {(client.frozen_days ?? 0) > 0 && (
          <div className="flex justify-between text-xs text-gray-400">
            <span>ימי הקפאה שנוספו</span>
            <span>{client.frozen_days} ימים</span>
          </div>
        )}

        {isFrozen && client.frozen_at && (
          <div className="flex justify-between text-xs text-blue-400">
            <span>מוקפא מאז</span>
            <span>{new Date(client.frozen_at).toLocaleDateString("he-IL")}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {endDate && client.start_date && daysLeft !== null && !isFrozen && (
        <ProgressBar startDate={client.start_date} endDate={endDate} />
      )}

      <button
        onClick={isFrozen ? handleUnfreeze : handleFreeze}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${
          isFrozen
            ? "bg-green-50 hover:bg-green-100 text-green-600"
            : "bg-blue-50 hover:bg-blue-100 text-blue-600"
        }`}
      >
        {isFrozen ? <Play size={14} /> : <Snowflake size={14} />}
        {loading ? "..." : isFrozen ? "חדש מנוי" : "הקפא מנוי"}
      </button>
    </div>
  );
}

function ProgressBar({ startDate, endDate }: { startDate: string; endDate: Date }) {
  const start = new Date(startDate).getTime();
  const end = endDate.getTime();
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));

  return (
    <div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-400" : pct >= 75 ? "bg-orange-400" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-left">{Math.round(pct)}% מהליווי</p>
    </div>
  );
}
