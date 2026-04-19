import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { phone, message, lead_id, client_id } = await req.json();

  if (!phone || !message) {
    return NextResponse.json({ error: "phone and message are required" }, { status: 400 });
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    return NextResponse.json({ error: "WhatsApp not configured" }, { status: 503 });
  }

  const cleaned = phone.replace(/\D/g, "");
  const to = cleaned.startsWith("0") ? "972" + cleaned.slice(1) : cleaned;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    }
  );

  const data = await res.json();
  const status = res.ok ? "sent" : "failed";

  const supabase = await createServiceClient();
  await supabase.from("whatsapp_log").insert({
    phone,
    message,
    lead_id: lead_id ?? null,
    client_id: client_id ?? null,
    direction: "outgoing",
    status,
  });

  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
