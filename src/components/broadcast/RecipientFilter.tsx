"use client";

import { useEffect } from "react";
import { getRecipients } from "@/app/actions/broadcast";
import type { BroadcastRecipient, RecipientFilters } from "@/types";
import { useState } from "react";

const CLIENT_STATUSES = [
  { value: "active", label: "פעיל" },
  { value: "pending", label: "ממתין" },
  { value: "inactive", label: "לא פעיל" },
];

const CLIENT_PLANS = [
  { value: "trial", label: "ניסיון" },
  { value: "4months", label: "4 חודשים" },
  { value: "10months", label: "10 חודשים" },
];

const LEAD_STATUSES = [
  { value: "new", label: "חדש" },
  { value: "messaged", label: "נשלחה הודעה" },
  { value: "call_scheduled", label: "נקבעה שיחה" },
];

interface Props {
  onRecipientsChange: (recipients: BroadcastRecipient[]) => void;
}

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

function FilterChip({
  label,
  active,
  onClick,
  color = "green",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: "green" | "blue" | "purple";
}) {
  const colors = {
    green: active ? "bg-green-100 text-green-700 border-green-300" : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200",
    blue: active ? "bg-blue-100 text-blue-700 border-blue-300" : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200",
    purple: active ? "bg-purple-100 text-purple-700 border-purple-300" : "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${colors[color]}`}
    >
      {label}
    </button>
  );
}

export default function RecipientFilter({ onRecipientsChange }: Props) {
  const [includeClients, setIncludeClients] = useState(false);
  const [includeLeads, setIncludeLeads] = useState(false);
  const [clientStatuses, setClientStatuses] = useState<string[]>([]);
  const [clientPlans, setClientPlans] = useState<string[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<string[]>([]);
  const [excludeRecent, setExcludeRecent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const filters: RecipientFilters = {
      includeClients,
      includeLeads,
      clientStatuses,
      clientPlans,
      leadStatuses,
      excludeRecent,
    };

    let cancelled = false;
    setLoading(true);

    getRecipients(filters)
      .then((data) => {
        if (!cancelled) {
          setCount(data.length);
          onRecipientsChange(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [includeClients, includeLeads, clientStatuses, clientPlans, leadStatuses, excludeRecent, onRecipientsChange]);

  return (
    <div className="card space-y-5">
      <h3 className="font-bold text-base">סינון נמענים</h3>

      {/* Type toggles */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">סוג נמען</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              const next = !includeClients;
              setIncludeClients(next);
              if (!next) {
                setClientStatuses([]);
                setClientPlans([]);
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              includeClients
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            👤 מתאמנים
          </button>
          <button
            type="button"
            onClick={() => {
              const next = !includeLeads;
              setIncludeLeads(next);
              if (!next) setLeadStatuses([]);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
              includeLeads
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            🎯 לידים
          </button>
        </div>
      </div>

      {/* Client sub-filters */}
      {includeClients && (
        <div className="space-y-3 pe-4 border-e-2 border-green-200 ms-1">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">סטטוס מתאמן</p>
            <div className="flex flex-wrap gap-2">
              {CLIENT_STATUSES.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={clientStatuses.includes(value)}
                  onClick={() => setClientStatuses((prev) => toggle(prev, value))}
                  color="green"
                />
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">מסלול (אופציונלי)</p>
            <div className="flex flex-wrap gap-2">
              {CLIENT_PLANS.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={clientPlans.includes(value)}
                  onClick={() => setClientPlans((prev) => toggle(prev, value))}
                  color="blue"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lead sub-filters */}
      {includeLeads && (
        <div className="space-y-3 pe-4 border-e-2 border-green-200 ms-1">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">סטטוס ליד</p>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUSES.map(({ value, label }) => (
                <FilterChip
                  key={value}
                  label={label}
                  active={leadStatuses.includes(value)}
                  onClick={() => setLeadStatuses((prev) => toggle(prev, value))}
                  color="purple"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Exclude recent */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={excludeRecent}
          onChange={(e) => setExcludeRecent(e.target.checked)}
          className="w-4 h-4 rounded accent-green-600 flex-shrink-0"
        />
        <span className="text-sm text-gray-600">
          אל תכלול מי שקיבל הודעה ב-24 שעות האחרונות
        </span>
      </label>

      {/* Live count */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        {loading ? (
          <p className="text-sm text-gray-400">מחשב...</p>
        ) : (
          <p className="text-sm font-semibold">
            📊 יישלח ל-<span className="text-green-600 text-base mx-1">{count}</span>אנשים
          </p>
        )}
      </div>
    </div>
  );
}
