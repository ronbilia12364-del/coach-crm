import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[FB Webhook] Received:", JSON.stringify(body));

  if (body?.object !== "page") {
    return NextResponse.json({ ok: true });
  }

  const changes = body?.entry?.[0]?.changes ?? [];

  for (const change of changes) {
    if (change.field !== "leadgen") continue;
    const leadgenId = change.value?.leadgen_id as string | undefined;
    if (!leadgenId) continue;

    try {
      const leadData = await fetchLeadData(leadgenId);
      if (!leadData) continue;

      const { name, phone } = leadData;
      const supabase = createAdminClient();
      const { error } = await supabase.from("leads").insert({
        name,
        phone,
        source: "facebook",
        status: "new",
        notes: "ליד מ-Facebook Lead Ads (leadgen_id: " + leadgenId + ")",
      });

      if (!error) {
        const message = "היי " + name + "! ראיתי שהשארת פרטים 💪 מתי זמין לקבוע שיחה קצרה של 15 דקות?";
        await sendWhatsAppMessage(phone, message);
      }
    } catch (err) {
      console.error("[FB Webhook] Error:", err);
    }
  }
  return NextResponse.json({ ok: true });
}

async function fetchLeadData(leadgenId: string): Promise<{ name: string; phone: string } | null> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  const url = "https://graph.facebook.com/v20.0/" + leadgenId + "?access_token=" + token;
  const res = await fetch(url);
  console.log("[FB Webhook] FB API status:", res.status);

  if (!res.ok) {
    const errText = await res.text();
    console.error("[FB Webhook] FB API error:", errText);
    return null;
  }

  const data = await res.json();
  console.log("[FB Webhook] FB API data:", JSON.stringify(data));

  type Field = { name: string; values: string[] };
  const fields: Field[] = data.field_data ?? [];

  let name = "";
  let phone = "";
  for (const f of fields) {
    if (f.name === "full_name" || f.name === "first_name" || f.name === "name") {
      name = f.values[0] ?? "";
    }
    if (f.name === "phone_number" || f.name === "phone") {
      phone = f.values[0] ?? "";
    }
  }

  if (!name || !phone) return null;
  return { name, phone };
}
