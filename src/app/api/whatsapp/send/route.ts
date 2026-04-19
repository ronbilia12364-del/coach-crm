import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  console.log("[FB Webhook GET]", { mode, tokenMatch: token === process.env.FACEBOOK_VERIFY_TOKEN });
  if (mode === "subscribe" && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("[FB Webhook POST] body:", JSON.stringify(body));

  if (body?.object !== "page") {
    console.log("[FB Webhook] Not a page object");
    return NextResponse.json({ ok: true });
  }

  const changes = body?.entry?.[0]?.changes ?? [];
  console.log("[FB Webhook] Changes count:", changes.length);

  for (const change of changes) {
    console.log("[FB Webhook] Change field:", change.field);
    if (change.field !== "leadgen") continue;

    const leadgenId = change.value?.leadgen_id as string | undefined;
    console.log("[FB Webhook] Leadgen ID:", leadgenId);
    if (!leadgenId) continue;

    try {
      const leadData = await fetchLeadData(leadgenId);
      console.log("[FB Webhook] Lead data:", leadData);
      if (!leadData) continue;

      const { name, phone } = leadData;
      const supabase = createAdminClient();
      const { error } = await supabase.from("leads").insert({
        name,
        phone,
        source: "facebook",
        status: "new",
        notes: `ליד מ-Facebook Lead Ads (leadgen_id: ${leadgenId})`,
      });

      if (error) {
        console.error("[FB Webhook] Supabase error:", error);
      } else {
        console.log("[FB Webhook] Lead inserted successfully");
        const message = `היי ${name}! ראיתי שהשארת פרטים 💪 מתי זמין לקבוע שיחה קצרה של 15 דקות לראות איך אני יכול לעזור לך להגיע ליעד?`;
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
  if (!token) {
    console.error("[FB Webhook] No token!");
    return null;
  }
  const url = `https://graph.facebook.com/v20.0/${leadgenId}?access_token=${token}`;
  const res = await fetch(url);
  console.log("[FB Webhook] FB API status:", res.status);

  if (!res.ok) {
    const errText = await res.text();
    console.error("[FB Webhook] FB API error:", errText);
    return null;
  }

  const data = await res.json();
  console.log("[FB Webhook] FB API data:", JSON.stringify(data));

  const fields: { name: string; values: string[] }[] = data.field_data ?? [];
  const get = (keys: string[]) =>
    fields.find((f) => keys.includes(f.name))?.values?.[0] ?? "";
  const name = get(["full_name", "first_name", "name"]);
  const phone = get(["phone_number", "phone"]);
  if (!name || !phone) return null;
  return { name, phone };
}
