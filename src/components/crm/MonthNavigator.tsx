"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const HEBREW_MONTHS = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר",
];

export default function MonthNavigator({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(y: number, m: number) {
    setOpen(false);
    router.push(`/crm?month=${y}-${String(m + 1).padStart(2, "0")}`);
  }

  // 6 months back, current, 5 months forward = 12 total
  const options: { year: number; month: number }[] = [];
  for (let i = -6; i <= 5; i++) {
    let m = month + i;
    let y = year;
    while (m < 0) { m += 12; y--; }
    while (m > 11) { m -= 12; y++; }
    options.push({ year: y, month: m });
  }

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-800"
      >
        {HEBREW_MONTHS[month]} {year}
        {!isCurrentMonth && (
          <span className="text-xs font-normal text-green-600 mr-1">← לא נוכחי</span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]">
          {options.map(({ year: y, month: m }) => {
            const isSelected = y === year && m === month;
            const isToday = y === now.getFullYear() && m === now.getMonth();
            return (
              <button
                key={`${y}-${m}`}
                onClick={() => select(y, m)}
                className={`w-full text-right px-4 py-2 text-sm transition-colors flex items-center justify-between gap-2 ${
                  isSelected
                    ? "bg-green-50 text-green-700 font-bold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{HEBREW_MONTHS[m]} {y}</span>
                {isToday && (
                  <span className="text-xs text-gray-400 font-normal">נוכחי</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
