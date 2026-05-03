import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS, type Payment, type PaymentStatus } from "@/types";
import PaymentStatusBadge from "@/components/crm/PaymentStatusBadge";
import MarkPaidButton from "@/components/crm/MarkPaidButton";
import PaymentDeleteButton from "@/components/crm/PaymentDeleteButton";
import PaymentEditDialog from "@/components/crm/PaymentEditDialog";
import ClientPaymentsTooltip from "@/components/crm/ClientPaymentsTooltip";

export default async function PaymentsPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("payments")
    .select("*, client:clients(id, name, phone)")
    .order("month", { ascending: false });

  const payments = (data ?? []) as (Payment & { client: any })[];

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter((p) => p.status === "unpaid").reduce((s, p) => s + p.amount, 0);

  const paymentsByClient = payments.reduce<Record<string, Payment[]>>((acc, p) => {
    (acc[p.client_id] ??= []).push(p);
    return acc;
  }, {});

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
            <PaymentRow
              key={payment.id}
              payment={payment}
              clientPayments={paymentsByClient[payment.client_id] ?? []}
            />
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
                    <div className="flex items-center gap-2">
                      <ClientPaymentsTooltip
                        clientName={payment.client?.name ?? ""}
                        clientId={payment.client_id}
                        href={`/crm/clients/${payment.client?.id}`}
                        clientPayments={paymentsByClient[payment.client_id] ?? []}
                      />
                      {payment.is_recurring && (
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                          🔁 ה&quot;ק
                        </span>
                      )}
                    </div>
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
                    <div className="flex items-center gap-1">
                      {payment.status === "unpaid" && <MarkPaidButton paymentId={payment.id} />}
                      <PaymentEditDialog
                        payment={payment}
                        clientName={payment.client?.name ?? ""}
                      />
                      <PaymentDeleteButton
                        paymentId={payment.id}
                        clientName={payment.client?.name ?? ""}
                        recurringGroupId={payment.recurring_group_id}
                        recurringTotalMonths={payment.recurring_total_months}
                      />
                    </div>
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
                  <div className="flex items-center gap-2">
                    <ClientPaymentsTooltip
                      clientName={payment.client?.name ?? ""}
                      clientId={payment.client_id}
                      href={`/crm/clients/${payment.client?.id}`}
                      clientPayments={paymentsByClient[payment.client_id] ?? []}
                    />
                    {payment.is_recurring && (
                      <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                        🔁 ה&quot;ק
                      </span>
                    )}
                  </div>
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
              <div className="flex items-center gap-2 pt-1">
                {payment.status === "unpaid" && <MarkPaidButton paymentId={payment.id} />}
                <PaymentEditDialog
                  payment={payment}
                  clientName={payment.client?.name ?? ""}
                />
                <PaymentDeleteButton
                  paymentId={payment.id}
                  clientName={payment.client?.name ?? ""}
                  recurringGroupId={payment.recurring_group_id}
                  recurringTotalMonths={payment.recurring_total_months}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PaymentRow({
  payment,
  clientPayments,
}: {
  payment: Payment & { client: any };
  clientPayments: Payment[];
}) {
  return (
    <div className="card flex justify-between items-center py-3">
      <div>
        <div className="flex items-center gap-2">
          <ClientPaymentsTooltip
            clientName={payment.client?.name ?? ""}
            clientId={payment.client_id}
            href={`/crm/clients/${payment.client?.id}`}
            clientPayments={clientPayments}
          />
          {payment.is_recurring && (
            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 whitespace-nowrap">
              🔁 ה&quot;ק
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">{formatDate(payment.month)}</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-bold ml-1">{formatCurrency(payment.amount)}</span>
        <MarkPaidButton paymentId={payment.id} />
        <PaymentEditDialog
          payment={payment}
          clientName={payment.client?.name ?? ""}
        />
        <PaymentDeleteButton
          paymentId={payment.id}
          clientName={payment.client?.name ?? ""}
          recurringGroupId={payment.recurring_group_id}
          recurringTotalMonths={payment.recurring_total_months}
        />
      </div>
    </div>
  );
}
