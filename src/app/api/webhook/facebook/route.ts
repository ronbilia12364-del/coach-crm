import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToAll } from "@/lib/push/send";

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

  const entries: unknown[] = body?.entry ?? [];

  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? [];

    for (const change of changes) {
      const c = change as { field?: string; value?: { leadgen_id?: string } };
      if (c.field !== "leadgen") continue;

      const leadgenId = c.value?.leadgen_id;
      if (!leadgenId) continue;

      try {
        const leadData = await fetchLeadData(leadgenId);
        if (!leadData) {
          console.error(`[FB Webhook] fetchLeadData returned null for leadgen_id=${leadgenId}`);
          continue;
        }

        const { name, phone, age, goal } = leadData;
        const supabase = createAdminClient();
        const { error } = await supabase.from("leads").insert({
          name,
          phone: phone || null,
          source: "facebook",
          status: "new",
          age: age ?? null,
          goal: goal || null,
          notes: `ליד מ-Facebook Lead Ads (leadgen_id: ${leadgenId})`,
        });

        if (error) {
          console.error("[FB Webhook] Supabase insert error:", error);
          continue;
        }

        console.log("[FB Webhook] Lead saved, sending push notification");
        sendPushToAll({
          title: "🎯 ליד חדש!",
          body: `${name}${phone ? " — " + phone : ""}`,
          url: "/crm/leads",
        }).catch((e) => console.error("[FB Webhook] Push error:", e));
      } catch (err) {
        console.error("[FB Webhook] Error:", err);
      }
    }
  }
  return NextResponse.json({ ok: true });
}

async function fetchLeadData(leadgenId: string): Promise<{ name: string; phone: string; age: number | null; goal: string | null } | null> {
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
  console.log("[FB Webhook] Field names:", fields.map(f => f.name).join(", "));

  const get = (keys: string[]) =>
    fields.find((f) => keys.includes(f.name.replace(/\?/g, "")))?.values?.[0] ?? "";

  const firstName = get(["first_name", "שם_פרטי", "שם פרטי", "שם-פרטי"]);
  const lastName = get(["last_name", "שם_משפחה", "שם משפחה", "שם-משפחה"]);
  const fullName = get(["full_name", "name", "name_full", "שם_מלא", "שם מלא", "שם-מלא", "שם"]);
  const name = fullName || [firstName, lastName].filter(Boolean).join(" ") || firstName;

  const phone = get(["phone_number", "phone", "mobile_phone", "phone_number_mobile", "phone_mobile", "מספר_טלפון", "מספר טלפון", "מספר-טלפון", "טלפון"]);

  const ageRaw = get(["age", "גיל", "בן_כמה_את", "בן_כמה_אתה", "כמה_אתה", "כמה_את"]);
  const ageNum = parseInt(ageRaw, 10);
  const age = !isNaN(ageNum) && ageNum > 0 ? ageNum : null;

  const goal = get(["goal", "מטרה", "מה_המטרה_שלך", "המטרה_שלך", "איזה_מטרה"]) || null;

  if (!name) {
    const fieldNames = fields.map((f) => f.name).join(", ");
    console.error(`[FB Webhook] Lead has no name. Fields in form: [${fieldNames}]`);
    return null;
  }

  return { name, phone, age, goal };
}
