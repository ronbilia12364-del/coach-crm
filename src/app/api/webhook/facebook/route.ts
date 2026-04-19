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
