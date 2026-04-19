import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { computeEndDate } from "@/lib/utils";
import { type Client } from "@/types";

// Called daily by Vercel Cron (see vercel.json)
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .in("status", ["active", "inactive"])
    .not("start_date", "is", null);

  if (!clients?.length) return NextResponse.json({ ok: true, checked: 0 });

  const coachPhone = process.env.COACH_PHONE ?? "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let alerts = 0;

  for (const client of clients as Client[]) {
    const endDate = computeEndDate(client);
    if (!endDate) continue;

    endDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((endDate.getTime() - today.getTime()) / 86_400_000);

    if (daysLeft === 7) {
      await sendWhatsAppMessage(
        coachPhone,
        `⚠️ המתאמן ${client.name} מסיים ליווי בעוד 7 ימים! (${endDate.toLocaleDateString("he-IL")})`
      );
      alerts++;
    } else if (daysLeft === 0) {
      await sendWhatsAppMessage(
        coachPhone,
        `✅ המתאמן ${client.name} סיים את תהליך הליווי היום!`
      );
      alerts++;
    }
  }

  return NextResponse.json({ ok: true, checked: clients.length, alerts });
}
