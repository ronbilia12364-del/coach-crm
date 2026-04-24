"use client";

import { useRouter } from "next/navigation";

const HEBREW_MONTHS = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];

export default function MonthNavigator({ year, month }: { year: number; month: number }) {
  const router = useRouter();

  function go(y: number, m: number) {
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    router.push(`/crm?month=${y}-${String(m + 1).padStart(2, "0")}`);
  }

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => go(year, month - 1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 font-medium"
        aria-label="חודש קודם"
      >
        ←
      </button>
      <span className="font-semibold text-gray-900 min-w-[120px] text-center text-sm">
        {HEBREW_MONTHS[month]} {year}
      </span>
      <button
        onClick={() => go(year, month + 1)}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 font-medium"
        aria-label="חודש הבא"
      >
        →
      </button>
      {!isCurrentMonth && (
        <button
          onClick={() => router.push("/crm")}
          className="text-xs text-green-600 hover:underline mr-2"
        >
          החודש הנוכחי
        </button>
      )}
    </div>
  );
}
