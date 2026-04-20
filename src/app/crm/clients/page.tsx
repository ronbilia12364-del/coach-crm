import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { buildWhatsAppUrl, formatDate } from "@/lib/utils";
import {
  STATUS_LABELS,
  PLAN_LABELS,
  type Client,
  type ClientStatus,
} from "@/types";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import ClientStatusBadge from "@/components/crm/ClientStatusBadge";
import AddClientButton from "@/components/crm/AddClientButton";
import DeleteButton from "@/components/ui/delete-button";

async function getClients(status?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []) as Client[];
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const clients = await getClients(params.status);

  const statusFilters: { value: string; label: string }[] = [
    { value: "", label: "הכל" },
    { value: "active", label: "פעיל" },
    { value: "pending", label: "ממתין" },
    { value: "inactive", label: "לא פעיל" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">מתאמנים</h2>
          <p className="text-gray-500 mt-1">{clients.length} מתאמנים</p>
        </div>
        <AddClientButton />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(({ value, label }) => (
          <Link
            key={value}
            href={value ? `/crm/clients?status=${value}` : "/crm/clients"}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              params.status === value || (!params.status && value === "")
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">שם</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">טלפון</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">מסלול</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">התחלה</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">סטטוס</th>
              <th className="text-right px-6 py-3 text-gray-500 font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  אין מתאמנים עדיין
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <Link href={`/crm/clients/${client.id}`} className="hover:text-green-600">
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">{client.phone}</td>
                  <td className="px-6 py-4 text-gray-600">{PLAN_LABELS[client.plan]}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {client.start_date ? formatDate(client.start_date) : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <ClientStatusBadge status={client.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/crm/clients/${client.id}`} className="btn-secondary text-xs py-1 px-2">
                        פרטים
                      </Link>
                      <a
                        href={buildWhatsAppUrl(client.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors"
                        title="פתח WhatsApp"
                      >
                        <MessageCircle size={16} />
                      </a>
                      <DeleteButton
                        itemId={client.id}
                        tableName="clients"
                        itemLabel={client.name}
                        cascadeNote="פעולה זו תמחק גם את כל השיחות והתשלומים הקשורים למתאמן זה."
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {clients.length === 0 ? (
          <div className="card text-center py-10 text-gray-400">אין מתאמנים עדיין</div>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/crm/clients/${client.id}`}
                    className="font-semibold text-base hover:text-green-600"
                  >
                    {client.name}
                  </Link>
                  <p className="text-sm text-gray-500 font-mono mt-0.5">{client.phone}</p>
                </div>
                <ClientStatusBadge status={client.status} />
              </div>
              <div className="flex gap-4 text-sm text-gray-600">
                <span>{PLAN_LABELS[client.plan]}</span>
                {client.start_date && (
                  <span className="text-gray-400">{formatDate(client.start_date)}</span>
                )}
              </div>
              <div className="flex gap-2 pt-1">
                <Link
                  href={`/crm/clients/${client.id}`}
                  className="flex-1 text-center btn-secondary text-sm py-2.5"
                >
                  פרטים
                </Link>
                <a
                  href={buildWhatsAppUrl(client.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors text-sm font-medium"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
                <DeleteButton
                  itemId={client.id}
                  tableName="clients"
                  itemLabel={client.name}
                  cascadeNote="פעולה זו תמחק גם את כל השיחות והתשלומים הקשורים למתאמן זה."
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
