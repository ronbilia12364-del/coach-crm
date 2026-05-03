"use client";

import { Fragment, useState } from "react";
import { ChevronDown } from "lucide-react";
import { type Payment, PAYMENT_METHOD_LABELS } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import PaymentStatusBadge from "@/components/crm/PaymentStatusBadge";
import MarkPaidButton from "@/components/crm/MarkPaidButton";
import PaymentEditDialog from "@/components/crm/PaymentEditDialog";
import PaymentDeleteButton from "@/components/crm/PaymentDeleteButton";
import ClientPaymentsTooltip from "@/components/crm/ClientPaymentsTooltip";

export type ClientGroup = {
  clientId: string;
  clientName: string;
  clientHref: string;
  payments: (Payment & { client: any })[];
  hasRecurring: boolean;
  paidCount: number;
  totalPaid: number;
  totalUnpaid: number;
};

export default function ClientGroupedPayments({ groups }: { groups: ClientGroup[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">מתאמן</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">סיכום</th>
              <th className="w-12 px-6 py-3" />
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const isOpen = openIds.has(group.clientId);
              return (
                <Fragment key={group.clientId}>
                  {/* Group header row */}
                  <tr
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer select-none"
                    onClick={() => toggle(group.clientId)}
                  >
                    <td className="px-6 py-3">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ClientPaymentsTooltip
                          clientName={group.clientName}
                          clientId={group.clientId}
                          href={group.clientHref}
                          clientPayments={group.payments}
                        />
                        {group.hasRecurring && (
                          <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                            🔁 ה&quot;ק
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {group.payments.length} תשלומים · {group.paidCount} שולמו
                      {group.totalUnpaid > 0 && (
                        <span className="text-red-500 font-medium">
                          {" "}· {formatCurrency(group.totalUnpaid)} נותר
                        </span>
                      )}
                      {group.totalUnpaid === 0 && group.payments.length > 0 && (
                        <span className="text-green-600 font-medium"> · ✅ הכל שולם</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <ChevronDown
                        size={15}
                        className={`text-gray-400 transition-transform duration-200 inline-block ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </td>
                  </tr>

                  {/* Expanded payment rows */}
                  {isOpen &&
                    group.payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="bg-gray-50/60 border-t border-gray-100/60"
                      >
                        <td className="pr-6 pl-14 py-2.5 text-gray-500">
                          {formatDate(payment.month)}
                        </td>
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            <PaymentStatusBadge status={payment.status} />
                            {payment.method && (
                              <span className="text-xs text-gray-400">
                                {PAYMENT_METHOD_LABELS[payment.method as keyof typeof PAYMENT_METHOD_LABELS]}
                              </span>
                            )}
                            {payment.is_recurring && (
                              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                                🔁 ה&quot;ק
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-2.5">
                          <div className="flex items-center gap-1 justify-center">
                            {payment.status === "unpaid" && (
                              <MarkPaidButton paymentId={payment.id} />
                            )}
                            <PaymentEditDialog
                              payment={payment}
                              clientName={group.clientName}
                            />
                            <PaymentDeleteButton
                              paymentId={payment.id}
                              clientName={group.clientName}
                              recurringGroupId={payment.recurring_group_id}
                              recurringTotalMonths={payment.recurring_total_months}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {groups.map((group) => {
          const isOpen = openIds.has(group.clientId);
          return (
            <div key={group.clientId} className="card p-0 overflow-hidden">
              {/* Card header */}
              <button
                onClick={() => toggle(group.clientId)}
                className="w-full text-right px-4 py-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{group.clientName}</span>
                    {group.hasRecurring && (
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5">
                        🔁 ה&quot;ק
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {group.payments.length} תשלומים · {group.paidCount} שולמו
                    {group.totalUnpaid > 0 && (
                      <span className="text-red-500 font-medium">
                        {" "}· {formatCurrency(group.totalUnpaid)} נותר
                      </span>
                    )}
                    {group.totalUnpaid === 0 && group.payments.length > 0 && (
                      <span className="text-green-600 font-medium"> · ✅ הכל שולם</span>
                    )}
                  </span>
                </div>
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Expanded payments */}
              {isOpen && (
                <div className="border-t border-gray-100 divide-y divide-gray-50">
                  {group.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-700">
                            {formatDate(payment.month)}
                          </span>
                          {payment.is_recurring && (
                            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-1.5 py-0.5">
                              🔁
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="font-bold text-sm">
                            {formatCurrency(payment.amount)}
                          </span>
                          <PaymentStatusBadge status={payment.status} />
                          {payment.method && (
                            <span className="text-xs text-gray-400">
                              {PAYMENT_METHOD_LABELS[payment.method as keyof typeof PAYMENT_METHOD_LABELS]}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {payment.status === "unpaid" && (
                          <MarkPaidButton paymentId={payment.id} />
                        )}
                        <PaymentEditDialog
                          payment={payment}
                          clientName={group.clientName}
                        />
                        <PaymentDeleteButton
                          paymentId={payment.id}
                          clientName={group.clientName}
                          recurringGroupId={payment.recurring_group_id}
                          recurringTotalMonths={payment.recurring_total_months}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
