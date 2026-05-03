import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { formatCurrency, formatDate } from "@/lib/utils";
import { type Payment } from "@/types";
import MarkPaidButton from "@/components/crm/MarkPaidButton";
import PaymentDeleteButton from "@/components/crm/PaymentDeleteButton";
import PaymentEditDialog from "@/components/crm/PaymentEditDialog";
import ClientPaymentsTooltip from "@/components/crm/ClientPaymentsTooltip";
import ClientGroupedPayments, { type ClientGroup } from "@/components/crm/ClientGroupedPayments";

export default async function PaymentsPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("payments")
    .select("*, client:clients(id, name, phone)")
    .order("month", { ascending: false });

  const payments = (data ?? []) as (Payment & { client: any })[];

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = payments.filter((p) => p.status === "unpaid").reduce((s, p) => s + p.amount, 0);

  // Group payments by client
  const paymentsByClient = payments.reduce<Record<string, (Payment & { client: any })[]>>(
    (acc, p) => { (acc[p.client_id] ??= []).push(p); return acc; },
    {}
  );

  // Build groups in the order clients first appear (most recent payment first)
  const seenClients = new Set<string>();
  const clientOrder: string[] = [];
  for (const p of payments) {
    if (!seenClients.has(p.client_id)) {
      seenClients.add(p.client_id);
      clientOrder.push(p.client_id);
    }
  }

  const clientGroups: ClientGroup[] = clientOrder
    .map((clientId) => {
      const cp = paymentsByClient[clientId] ?? [];
      const clientInfo = cp[0]?.client;
      const paidCount = cp.filter((p) => p.status === "paid").length;
      const totalPaidAmt = cp.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
      const totalUnpaidAmt = cp.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
      return {
        clientId,
        clientName: clientInfo?.name ?? "",
        clientHref: `/crm/clients/${clientInfo?.id}`,
        payments: [...cp].sort((a, b) => a.month.localeCompare(b.month)),
        hasRecurring: cp.some((p) => p.is_recurring),
        paidCount,
        totalPaid: totalPaidAmt,
        totalUnpaid: totalUnpaidAmt,
      };
    })
    .sort((a, b) => {
      // Clients with unpaid payments first, then alphabetically
      if (a.totalUnpaid > 0 && b.totalUnpaid === 0) return -1;
      if (a.totalUnpaid === 0 && b.totalUnpaid > 0) return 1;
      return a.clientName.localeCompare(b.clientName, "he");
    });

  const unpaidPayments = payments.filter((p) => p.status === "unpaid");

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

      {/* Unpaid section — individual rows */}
      <div>
        <h3 className="font-semibold text-red-600 mb-3">
          ממתין לתשלום ({unpaidPayments.length})
        </h3>
        <div className="space-y-2">
          {unpaidPayments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              clientPayments={paymentsByClient[payment.client_id] ?? []}
            />
          ))}
          {unpaidPayments.length === 0 && (
            <div className="card text-center text-green-600 font-medium">✅ כל התשלומים שולמו!</div>
          )}
        </div>
      </div>

      {/* All payments — grouped by client */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">
          כל התשלומים ({clientGroups.length} לקוחות)
        </h3>
        <ClientGroupedPayments groups={clientGroups} />
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
        <PaymentEditDialog payment={payment} clientName={payment.client?.name ?? ""} />
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
