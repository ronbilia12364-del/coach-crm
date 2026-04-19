import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// Incoming messages
export async function POST(req: NextRequest) {
  const body = await req.json();

  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const messages = changes?.value?.messages;

  if (!messages?.length) return NextResponse.json({ ok: true });

  const supabase = await createServiceClient();

  for (const msg of messages) {
    const phone = msg.from;
    const text = msg.text?.body ?? "";

    await supabase.from("whatsapp_log").insert({
      phone,
      message: text,
      direction: "incoming",
      status: "delivered",
    });
  }

  return NextResponse.json({ ok: true });
}
