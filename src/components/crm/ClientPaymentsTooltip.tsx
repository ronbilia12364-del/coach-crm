"use client";

import { useState, useRef } from "react";
import { type Payment } from "@/types";
import { formatCurrency } from "@/lib/utils";

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

function formatMonthHebrew(monthStr: string) {
  const d = new Date(monthStr);
  return `${HEBREW_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function statusIcon(payment: Payment) {
  if (payment.status === "paid") return "✅";
  const now = new Date();
  const payMonth = new Date(payment.month);
  return payMonth > now ? "⏳" : "❌";
}

type Props = {
  clientName: string;
  clientId: string;
  href: string;
  clientPayments: Payment[];
};

export default function ClientPaymentsTooltip({ clientName, clientId: _clientId, href, clientPayments }: Props) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sorted = [...clientPayments].sort((a, b) => a.month.localeCompare(b.month));
  const totalPaid = sorted.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = sorted.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }

  function hide() {
    hideTimer.current = setTimeout(() => setVisible(false), 120);
  }

  return (
    <span className="relative inline-block">
      <a
        href={href}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={(e) => {
          if (window.matchMedia("(hover: none)").matches) {
            e.preventDefault();
            setVisible((v) => !v);
          }
        }}
        className="font-medium hover:text-green-600"
      >
        {clientName}
      </a>

      {visible && (
        <div
          onMouseEnter={show}
          onMouseLeave={hide}
          className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-56 text-xs"
          style={{ direction: "rtl" }}
        >
          <p className="font-semibold text-sm text-gray-800 mb-2 border-b border-gray-100 pb-1.5">
            {clientName}
          </p>

          {sorted.length === 0 ? (
            <p className="text-gray-400">אין תשלומים</p>
          ) : (
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {sorted.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span className="text-gray-600 truncate">{formatMonthHebrew(p.month)}</span>
                  <span className="flex items-center gap-1 whitespace-nowrap flex-shrink-0">
                    <span className="font-medium text-gray-700">{formatCurrency(p.amount)}</span>
                    <span>{statusIcon(p)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          {sorted.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-gray-100 space-y-0.5">
              {totalPaid > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>שולם:</span>
                  <span className="text-green-600 font-medium">{formatCurrency(totalPaid)}</span>
                </div>
              )}
              {totalUnpaid > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>נותר:</span>
                  <span className="text-red-500 font-medium">{formatCurrency(totalUnpaid)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </span>
  );
}
