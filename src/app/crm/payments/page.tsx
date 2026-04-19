import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type Payment, type PaymentStatus } from "@/types";
import PaymentStatusBadge from "@/components/crm/PaymentStatusBadge";
import MarkPaidButton from "@/components/crm/MarkPaidButton";
import Link from "next/link";

export default async function PaymentsPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("payments")
    .select("*, client:clients(id, name, phone)")
    .order("month", { ascending: false });

  const payments = (data ?? []) as (Payment & { client: any })[];

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter((p) => p.status === "unpaid").reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">תשלומים</h2>
        <p className="text-gray-500 mt-1">ניהול תשלומים מכל המתאמנים</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card border-r-4 border-green-500">
          <p className="text-sm text-gray-500">שולם</p>
          <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card border-r-4 border-red-400">
          <p className="text-sm text-gray-500">לא שולם</p>
          <p className="text-xl md:text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalUnpaid)}</p>
        </div>
      </div>

      {/* Unpaid first */}
      <div>
        <h3 className="font-semibold text-red-600 mb-3">
          ממתין לתשלום ({payments.filter((p) => p.status === "unpaid").length})
        </h3>
        <div className="space-y-2">
          {payments.filter((p) => p.status === "unpaid").map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
          {payments.filter((p) => p.status === "unpaid").length === 0 && (
            <div className="card text-center text-green-600 font-medium">✅ כל התשלומים שולמו!</div>
          )}
        </div>
      </div>

      {/* All payments */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">כל התשלומים</h3>

        {/* Desktop table */}
        <div className="hidden md:block card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">מתאמן</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">חודש</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">סכום</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">אמצעי</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">סטטוס</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link
                      href={`/crm/clients/${payment.client?.id}`}
                      className="hover:text-green-600 font-medium"
                    >
                      {payment.client?.name}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{formatDate(payment.month)}</td>
                  <td className="px-6 py-3 font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-3 text-gray-500">
                    {payment.method
                      ? PAYMENT_METHOD_LABELS[payment.method as keyof typeof PAYMENT_METHOD_LABELS]
                      : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <PaymentStatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-3">
                    {payment.status === "unpaid" && <MarkPaidButton paymentId={payment.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {payments.map((payment) => (
            <div key={payment.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/crm/clients/${payment.client?.id}`}
                    className="font-semibold text-base hover:text-green-600"
                  >
                    {payment.client?.name}
                  </Link>
                  <p className="text-sm text-gray-400 mt-0.5">{formatDate(payment.month)}</p>
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {payment.method
                    ? PAYMENT_METHOD_LABELS[payment.method as keyof typeof PAYMENT_METHOD_LABELS]
                    : "—"}
                </div>
                <span className="font-bold text-base">{formatCurrency(payment.amount)}</span>
              </div>
              {payment.status === "unpaid" && (
                <div className="pt-1">
                  <MarkPaidButton paymentId={payment.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentRow({ payment }: { payment: Payment & { client: any } }) {
  return (
    <div className="card flex justify-between items-center py-3">
      <div>
        <Link
          href={`/crm/clients/${payment.client?.id}`}
          className="font-medium hover:text-green-600"
        >
          {payment.client?.name}
        </Link>
        <p className="text-xs text-gray-400">{formatDate(payment.month)}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold">{formatCurrency(payment.amount)}</span>
        <MarkPaidButton paymentId={payment.id} />
      </div>
    </div>
  );
}
