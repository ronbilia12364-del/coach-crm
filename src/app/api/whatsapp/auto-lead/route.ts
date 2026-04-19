import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildLeadWhatsAppMessage } from "@/lib/utils";

// Called after a new lead is created to auto-send the welcome message
export async function POST(req: NextRequest) {
  const { lead_id } = await req.json();
  if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const supabase = await createServiceClient();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const message = buildLeadWhatsAppMessage(lead.name);

  const sendRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/whatsapp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: lead.phone, message, lead_id }),
  });

  if (sendRes.ok) {
    await supabase.from("leads").update({ status: "messaged" }).eq("id", lead_id);
  }

  return NextResponse.json({ ok: sendRes.ok });
}
