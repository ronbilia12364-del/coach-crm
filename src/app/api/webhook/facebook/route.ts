import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// GET — Facebook webhook verification challenge
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

// POST — incoming lead from Facebook Lead Ads
export async function POST(req: NextRequest) {
  const body = await req.json();

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
        notes: `ליד מ-Facebook Lead Ads (leadgen_id: ${leadgenId})`,
      });

      if (!error) {
        const message = `היי ${name}! ראיתי שהשארת פרטים 💪 תרצה לקבוע שיחה קצרה של 15 דקות לראות איך אני יכול לעזור לך להגיע ליעד?`;
        await sendWhatsAppMessage(phone, message);
      }
    } catch (err) {
      console.error("Facebook webhook error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

async function fetchLeadData(leadgenId: string): Promise<{ name: string; phone: string } | null> {
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${token}`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const fields: { name: string; values: string[] }[] = data.field_data ?? [];

  const get = (keys: string[]) =>
    fields.find((f) => keys.includes(f.name))?.values?.[0] ?? "";

  const name = get(["full_name", "first_name", "name"]);
  const phone = get(["phone_number", "phone"]);

  if (!name || !phone) return null;
  return { name, phone };
}
