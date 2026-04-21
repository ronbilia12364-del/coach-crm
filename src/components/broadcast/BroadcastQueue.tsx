"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { replaceName, buildBroadcastWAUrl } from "@/lib/broadcast/helpers";
import { logBroadcastEntry } from "@/app/actions/broadcast";
import type { BroadcastRecipient } from "@/types";
import SafetyBreak from "./SafetyBreak";

type Phase = "opening" | "timing" | "ready" | "batch_break" | "paused" | "done";

const BATCH_SIZE = 30;

interface Props {
  recipients: BroadcastRecipient[];
  messageTemplate: string;
  onClose: () => void;
}

export default function BroadcastQueue({ recipients, messageTemplate, onClose }: Props) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("opening");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [confirmClose, setConfirmClose] = useState(false);

  const total = recipients.length;
  const current = recipients[index];
  const processed = sentCount + skippedCount;
  const progressPct = total > 0 ? Math.round((processed / total) * 100) : 0;

  // Countdown timer
  useEffect(() => {
    if (phase !== "timing") return;
    if (timerSeconds <= 0) {
      setPhase("ready");
      return;
    }
    const id = setTimeout(() => setTimerSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timerSeconds]);

  function openWhatsApp() {
    if (!current) return;
    const msg = replaceName(messageTemplate, current.name);
    window.open(buildBroadcastWAUrl(current.phone, msg), "_blank");
    setTimerSeconds(Math.floor(Math.random() * 31) + 30); // 30–60 sec
    setPhase("timing");
  }

  async function markSent() {
    if (!current) return;
    const msg = replaceName(messageTemplate, current.name);
    await logBroadcastEntry({
      recipient_id: current.id,
      recipient_type: current.type,
      recipient_name: current.name,
      recipient_phone: current.phone,
      message: msg,
      status: "sent",
    });

    const newSent = sentCount + 1;
    setSentCount(newSent);
    advance(newSent, skippedCount);
  }

  async function skipCurrent() {
    if (!current) return;
    const msg = replaceName(messageTemplate, current.name);
    await logBroadcastEntry({
      recipient_id: current.id,
      recipient_type: current.type,
      recipient_name: current.name,
      recipient_phone: current.phone,
      message: msg,
      status: "skipped",
    });

    const newSkipped = skippedCount + 1;
    setSkippedCount(newSkipped);
    advance(sentCount, newSkipped);
  }

  function advance(sent: number, skipped: number) {
    const nextIndex = index + 1;
    if (nextIndex >= total) {
      setPhase("done");
      return;
    }
    setIndex(nextIndex);
    // Batch break every BATCH_SIZE sent messages
    if (sent > 0 && sent % BATCH_SIZE === 0) {
      setPhase("batch_break");
    } else {
      setPhase("opening");
    }
  }

  function handleClose() {
    if (phase === "done" || processed === 0) {
      onClose();
    } else {
      setConfirmClose(true);
    }
  }

  // ─── DONE ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">סיימת!</h2>
        <div className="text-gray-600 space-y-1 mb-8">
          <p>שלחת <span className="font-bold text-green-600">{sentCount}</span> הודעות</p>
          {skippedCount > 0 && (
            <p>דילגת על <span className="font-bold text-gray-500">{skippedCount}</span></p>
          )}
        </div>
        <button onClick={onClose} className="btn-primary px-8 py-3 text-base">
          חזור ל-CRM
        </button>
      </div>
    );
  }

  // ─── MODAL ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-base">📨 שליחה מרוכזת</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">
              {processed} / {total} נשלחו
            </span>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1 text-center">{progressPct}%</p>
      </div>

      {/* Confirm close banner */}
      {confirmClose && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3 flex-shrink-0 flex items-center justify-between gap-4">
          <p className="text-sm text-orange-700 font-medium">לצאת? ההתקדמות לא תישמר.</p>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => setConfirmClose(false)}
              className="text-xs px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              המשך
            </button>
            <button
              onClick={onClose}
              className="text-xs px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              צא
            </button>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 overflow-y-auto">
        {/* PAUSED */}
        {phase === "paused" && (
          <div className="flex flex-col items-center justify-center min-h-full p-8 text-center">
            <p className="text-5xl mb-4">⏸</p>
            <p className="font-bold text-xl text-white mb-2">השליחה מושהית</p>
            <p className="text-gray-400 mb-6 text-sm">לחץ כדי להמשיך</p>
            <button
              onClick={() => setPhase("opening")}
              className="bg-green-500 hover:bg-green-600 text-white font-bold px-10 py-3 rounded-2xl transition-colors"
            >
              ▶ המשך שליחה
            </button>
          </div>
        )}

        {/* BATCH BREAK */}
        {phase === "batch_break" && (
          <div className="p-4 max-w-sm mx-auto">
            <div className="bg-white rounded-2xl p-6">
              <SafetyBreak onResume={() => setPhase("opening")} />
            </div>
          </div>
        )}

        {/* MAIN FLOW */}
        {(phase === "opening" || phase === "timing" || phase === "ready") && current && (
          <div className="p-4 space-y-4 max-w-md mx-auto">
            {/* Recipient card */}
            <div className="bg-white rounded-2xl p-5 text-center space-y-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl bg-gray-100">
                {current.type === "client" ? "👤" : "🎯"}
              </div>
              <div>
                <p className="font-bold text-2xl">{current.name}</p>
                <p className="text-gray-500 text-sm font-mono mt-0.5">{current.phone}</p>
              </div>
              <span className={`badge ${
                current.type === "client"
                  ? "bg-green-100 text-green-700"
                  : "bg-purple-100 text-purple-700"
              }`}>
                {current.type === "client" ? "מתאמן" : "ליד"}
              </span>
            </div>

            {/* Message preview */}
            <div className="bg-white rounded-2xl p-4">
              <p className="text-xs text-gray-400 mb-2">ההודעה שתישלח:</p>
              <div className="bg-green-50 rounded-xl p-3 text-sm leading-relaxed">
                {replaceName(messageTemplate, current.name)}
              </div>
            </div>

            {/* Timer */}
            {phase === "timing" && (
              <div className="bg-white rounded-2xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-2">⏱ המתן לפני השליחה הבאה</p>
                <p className="text-4xl font-mono font-bold text-orange-500">{timerSeconds}</p>
                <p className="text-xs text-gray-400 mt-1">שניות (הגנת בטיחות)</p>
              </div>
            )}

            {/* Action buttons */}
            {phase === "opening" && (
              <button
                onClick={openWhatsApp}
                className="w-full py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-lg rounded-2xl transition-colors shadow-lg"
              >
                📱 פתח WhatsApp ושלח
              </button>
            )}

            {phase === "ready" && (
              <div className="space-y-3">
                <button
                  onClick={markSent}
                  className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-base rounded-2xl transition-colors shadow-lg"
                >
                  ✅ סמן כנשלח והמשך
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={skipCurrent}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors text-sm"
                  >
                    ⏭ דלג
                  </button>
                  <button
                    onClick={() => setPhase("paused")}
                    className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-sm"
                  >
                    ⏸ השהה
                  </button>
                </div>
              </div>
            )}

            {phase === "timing" && (
              <div className="flex gap-3">
                <button
                  disabled
                  className="flex-1 py-3 bg-gray-100 text-gray-400 font-medium rounded-xl cursor-not-allowed text-sm"
                >
                  ⏭ דלג (ממתין...)
                </button>
                <button
                  onClick={() => setPhase("paused")}
                  className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-sm"
                >
                  ⏸ השהה
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
