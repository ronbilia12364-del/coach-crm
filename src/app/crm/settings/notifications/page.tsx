"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCircle2, Send } from "lucide-react";
import { subscribeToPush, unsubscribeFromPush, isSubscribed } from "@/lib/push/subscribe";
import { toast } from "sonner";

const PREF_KEY = "push_prefs";

const PREF_OPTIONS = [
  { id: "new_lead", label: "ליד חדש מפייסבוק" },
  { id: "plan_7days", label: "מסלול מסתיים בעוד 7 ימים" },
  { id: "plan_tomorrow", label: "מסלול מסתיים מחר" },
  { id: "payment_due", label: "תשלום עומד להיגבות (1–2 ימים)" },
  { id: "payment_today", label: "תשלום לא שולם היום" },
] as const;

function loadPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function savePrefs(prefs: Record<string, boolean>) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

export default function NotificationsSettingsPage() {
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    const stored = loadPrefs();
    const defaults: Record<string, boolean> = {};
    PREF_OPTIONS.forEach(({ id }) => {
      defaults[id] = stored[id] ?? true;
    });
    setPrefs(defaults);
    isSubscribed().then(setSubscribed);
  }, []);

  function togglePref(id: string) {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    savePrefs(next);
  }

  async function handleSubscribe() {
    setLoading(true);
    try {
      await subscribeToPush();
      setSubscribed(true);
      toast.success("התראות הופעלו בהצלחה!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "שגיאה";
      if (msg.includes("denied")) {
        toast.error("הרשאת התראות נדחתה — אפשר בהגדרות הדפדפן");
      } else {
        toast.error("שגיאה בהפעלת התראות: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    try {
      await unsubscribeFromPush();
      setSubscribed(false);
      toast.success("התראות הושבתו");
    } catch {
      toast.error("שגיאה בביטול התראות");
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    const res = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "✅ בדיקת התראה", body: "אם אתה רואה את זה — הכל עובד!", url: "/crm" }),
    });
    if (res.ok) toast.success("התראת בדיקה נשלחה!");
    else toast.error("שליחה נכשלה");
  }

  if (!supported) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold">🔔 הגדרות התראות</h1>
        <div className="card text-center py-10 text-gray-400">
          הדפדפן שלך לא תומך ב-Push Notifications
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">🔔 הגדרות התראות</h1>
        <p className="text-gray-500 text-sm mt-1">Push Notifications לדפדפן</p>
      </div>

      {/* Status card */}
      <div className={`card border-2 ${subscribed ? "border-green-400" : "border-gray-200"}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${subscribed ? "bg-green-50" : "bg-gray-100"}`}>
            {subscribed ? (
              <Bell className="text-green-600" size={24} />
            ) : (
              <BellOff className="text-gray-400" size={24} />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {subscribed === null
                ? "בודק..."
                : subscribed
                ? "התראות מופעלות"
                : "התראות כבויות"}
            </p>
            <p className="text-sm text-gray-500">
              {subscribed
                ? "תקבל התראות על אירועים חשובים"
                : "הפעל כדי לקבל התראות בדפדפן"}
            </p>
          </div>
          {subscribed && (
            <CheckCircle2 className="text-green-500" size={20} />
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {!subscribed ? (
            <button
              onClick={handleSubscribe}
              disabled={loading || subscribed === null}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Bell size={16} />
              {loading ? "מפעיל..." : "הפעל התראות"}
            </button>
          ) : (
            <>
              <button
                onClick={handleTest}
                className="btn-secondary flex items-center gap-2"
              >
                <Send size={14} />
                בדוק התראה
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="flex items-center gap-2 text-sm px-4 py-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
              >
                <BellOff size={14} />
                {loading ? "מבטל..." : "השבת"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Preferences */}
      <div className="card space-y-4">
        <h2 className="font-semibold">סוגי התראות</h2>
        <p className="text-xs text-gray-400">ההעדפות נשמרות על המכשיר הזה</p>
        <div className="space-y-3">
          {PREF_OPTIONS.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs[id] ?? true}
                onChange={() => togglePref(id)}
                className="w-4 h-4 rounded accent-green-600"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          💡 הגדרות אלו מקומיות. השרת שולח את כל סוגי ההתראות — ביטול כאן אינו מונע שליחה מהשרת.
        </p>
      </div>
    </div>
  );
}
