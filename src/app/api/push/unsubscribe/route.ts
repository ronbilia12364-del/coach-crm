import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

  console.log("[Push] Unsubscribed:", endpoint.slice(-30));
  return NextResponse.json({ ok: true });
}
