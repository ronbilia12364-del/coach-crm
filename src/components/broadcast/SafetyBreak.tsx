"use client";

import { useState, useEffect } from "react";

interface Props {
  onResume: () => void;
}

export default function SafetyBreak({ onResume }: Props) {
  const [seconds, setSeconds] = useState(600); // 10 minutes
  const [confirmSkip, setConfirmSkip] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      onResume();
      return;
    }
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds, onResume]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
      <div className="text-5xl">🛑</div>

      <div>
        <p className="font-bold text-xl mb-1">הפסקת חובה</p>
        <p className="text-sm text-gray-500">הגנה מחסימה על ידי WhatsApp</p>
        <p className="text-xs text-gray-400 mt-1">שלחת 30 הודעות ברצף</p>
      </div>

      <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-10 py-5">
        <p className="text-xs text-orange-500 mb-1">ממשיך אוטומטית בעוד</p>
        <p className="text-5xl font-mono font-bold text-orange-600">
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
      </div>

      {!confirmSkip ? (
        <button
          type="button"
          onClick={() => setConfirmSkip(true)}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          אני יודע מה אני עושה, דלג על ההפסקה
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-orange-600 font-medium px-4">
            ⚠️ דילוג עלול לגרום לחסימה ב-WhatsApp!
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmSkip(false)}
              className="btn-secondary px-5"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={onResume}
              className="bg-red-500 hover:bg-red-600 text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors"
            >
              דלג בכל זאת
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
