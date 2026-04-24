import { createAdminClient as createClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { formatCurrency } from "@/lib/utils";
import { PLAN_PRICES, type Payment } from "@/types";
import { Users, TrendingUp, UserPlus, AlertCircle } from "lucide-react";
import Link from "next/link";
import MonthNavigator from "@/components/crm/MonthNavigator";

async function getDashboardStats() {
  const supabase = createClient();

  const [
    { count: activeClients },
    { data: payments },
    { count: newLeads },
    { count: unpaidCount },
    { data: clients },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("payments").select("amount, status, client_id").gte(
      "month",
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
    ),
    supabase.from("leads").select("*", { count: "exact", head: true }).in("status", ["new", "messaged"]),
    supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "unpaid"),
    supabase.from("clients").select("plan, status").eq("status", "active"),
  ]);

  const monthlyRevenue = payments
    ?.filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0) ?? 0;

  const revenueByPlan: Record<string, number> = { trial: 0, "4months": 0, "10months": 0 };
  clients?.forEach((c) => {
    const price = PLAN_PRICES[c.plan as keyof typeof PLAN_PRICES]?.price ?? 0;
    revenueByPlan[c.plan] = (revenueByPlan[c.plan] || 0) + price;
  });

  return {
    activeClients: activeClients ?? 0,
    monthlyRevenue,
    newLeads: newLeads ?? 0,
    unpaidPayments: unpaidCount ?? 0,
    revenueByPlan,
  };
}

async function getMonthlyPayments(year: number, month: number) {
  const supabase = createClient();
  const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
  const monthEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];
  const { data } = await supabase
    .from("payments")
    .select("id, amount, status, month, client:clients(id, name)")
    .gte("month", monthStart)
    .lte("month", monthEnd)
    .order("status", { ascending: true });
  return (data ?? []) as unknown as (Payment & { client: { id: string; name: string } | null })[];
}

async function getUpcomingCalls() {
  const supabase = createClient();
  const { data } = await supabase
    .from("calls")
    .select("*, client:clients(name, phone), lead:leads(name, phone)")
    .gte("scheduled_at", new Date().toISOString())
    .eq("completed", false)
    .order("scheduled_at", { ascending: true })
    .limit(5);
  return data ?? [];
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const now = new Date();

  let selectedYear = now.getFullYear();
  let selectedMonth = now.getMonth(); // 0-indexed

  if (params.month) {
    const [y, m] = params.month.split("-").map(Number);
    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
      selectedYear = y;
      selectedMonth = m - 1;
    }
  }

  const [stats, upcomingCalls, monthlyPayments] = await Promise.all([
    getDashboardStats(),
    getUpcomingCalls(),
    getMonthlyPayments(selectedYear, selectedMonth),
  ]);

  const statCards = [
    {
      label: "מתאמנים פעילים",
      value: stats.activeClients,
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
      href: "/crm/clients",
    },
    {
      label: "הכנסה חודשית",
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/crm/payments",
    },
    {
      label: "לידים ממתינים",
      value: stats.newLeads,
      icon: UserPlus,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/crm/leads",
    },
    {
      label: "תשלומים פתוחים",
      value: stats.unpaidPayments,
      icon: AlertCircle,
      color: "text-red-600",
      bg: "bg-red-50",
      href: "/crm/payments",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">דשבורד</h2>
        <p className="text-gray-500 mt-1">סקירה כללית של העסק</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
              <div className={cn("p-2 rounded-xl", bg)}>
                <Icon className={color} size={20} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Monthly payments */}
      {(() => {
        const totalExpected = monthlyPayments.reduce((s, p) => s + p.amount, 0);
        const totalCollected = monthlyPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
        return (
          <div className="card">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-gray-900">תשלומים</h3>
                <MonthNavigator year={selectedYear} month={selectedMonth} />
              </div>
              <Link href="/crm/payments" className="text-sm text-green-600 hover:underline">כל התשלומים</Link>
            </div>
            {monthlyPayments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">אין תשלומים לחודש זה</p>
            ) : (
              <div className="space-y-2 mb-4">
                {monthlyPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <Link href={`/crm/clients/${p.client?.id}`} className="font-medium hover:text-green-600">
                      {p.client?.name ?? "—"}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-600"
                      }`}>
                        {p.status === "paid" ? "שולם" : "לא שולם"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-3 flex justify-between text-sm">
              <span className="text-gray-500">נגבה / צפוי</span>
              <span className="font-bold">
                <span className="text-green-600">{formatCurrency(totalCollected)}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span>{formatCurrency(totalExpected)}</span>
              </span>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by plan */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">הכנסה לפי מסלול (חודש נוכחי)</h3>
          <div className="space-y-3">
            {Object.entries(PLAN_PRICES).map(([key, plan]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{plan.label}</span>
                <span className="font-semibold">{formatCurrency(stats.revenueByPlan[key] ?? 0)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">סה"כ</span>
              <span className="font-bold text-green-600">{formatCurrency(stats.monthlyRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Upcoming calls */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">שיחות קרובות</h3>
            <Link href="/crm/calls" className="text-sm text-green-600 hover:underline">
              כל השיחות
            </Link>
          </div>
          {upcomingCalls.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">אין שיחות מתוכננות</p>
          ) : (
            <div className="space-y-3">
              {upcomingCalls.map((call: any) => {
                const person = call.client ?? call.lead;
                const callTypeMap: Record<string, string> = {
                  onboarding: "אונבורדינג",
                  followup: "מעקב",
                  sales: "שיחת מכירה",
                };
                return (
                  <div key={call.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{person?.name ?? "לא ידוע"}</p>
                      <p className="text-xs text-gray-500">{callTypeMap[call.type]}</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Intl.DateTimeFormat("he-IL", {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(call.scheduled_at))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}
