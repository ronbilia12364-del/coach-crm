import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeEndDate } from "@/lib/utils";
import { sendPushToAll } from "@/lib/push/send";
import { type Client } from "@/types";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results: string[] = [];

  // ── 1. Plans ending in 7 days or tomorrow ──────────────────────────
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .in("status", ["active", "inactive"])
    .not("start_date", "is", null);

  for (const client of (clients ?? []) as Client[]) {
    const endDate = computeEndDate(client);
    if (!endDate) continue;
    endDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((endDate.getTime() - today.getTime()) / 86_400_000);

    if (daysLeft === 7) {
      const msg = `המסלול של ${client.name} מסתיים בעוד 7 ימים (${endDate.toLocaleDateString("he-IL")})`;
      console.log("[Cron] 7-day warning:", msg);
      await sendPushToAll({ title: "⚠️ מסלול מסתיים בקרוב", body: msg, url: `/crm/clients/${client.id}` });
      results.push(msg);
    } else if (daysLeft === 1) {
      const msg = `המסלול של ${client.name} מסתיים מחר! (${endDate.toLocaleDateString("he-IL")})`;
      console.log("[Cron] 1-day warning:", msg);
      await sendPushToAll({ title: "🚨 מסלול מסתיים מחר!", body: msg, url: `/crm/clients/${client.id}` });
      results.push(msg);
    }
  }

  // ── 2. Payments due today ──────────────────────────────────────────
  const todayStr = today.toISOString().split("T")[0];
  const { data: dueToday } = await supabase
    .from("payments")
    .select("id, amount, client:clients(id, name)")
    .eq("status", "unpaid")
    .eq("month", todayStr);

  for (const p of dueToday ?? []) {
    const name = (p.client as unknown as { name: string } | null)?.name ?? "מתאמן";
    const clientId = (p.client as unknown as { id: string } | null)?.id;
    const msg = `תשלום של ₪${p.amount} מ-${name} לא שולם היום`;
    console.log("[Cron] Payment due today:", msg);
    await sendPushToAll({ title: "💸 תשלום לא שולם", body: msg, url: clientId ? `/crm/clients/${clientId}` : "/crm/payments" });
    results.push(msg);
  }

  // ── 3. Payments due in 1-2 days ───────────────────────────────────
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];
  const dayAfter = new Date(Date.now() + 2 * 86_400_000).toISOString().split("T")[0];
  const { data: upcoming } = await supabase
    .from("payments")
    .select("id, amount, month, client:clients(id, name)")
    .eq("status", "unpaid")
    .in("month", [tomorrow, dayAfter]);

  for (const p of upcoming ?? []) {
    const name = (p.client as unknown as { name: string } | null)?.name ?? "מתאמן";
    const clientId = (p.client as unknown as { id: string } | null)?.id;
    const when = p.month === tomorrow ? "מחר" : "בעוד יומיים";
    const msg = `תשלום של ₪${p.amount} מ-${name} צפוי ${when}`;
    console.log("[Cron] Upcoming payment:", msg);
    await sendPushToAll({ title: "📅 תשלום צפוי בקרוב", body: msg, url: clientId ? `/crm/clients/${clientId}` : "/crm/payments" });
    results.push(msg);
  }

  return NextResponse.json({ ok: true, alerts: results.length, details: results });
}
