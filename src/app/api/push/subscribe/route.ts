import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { endpoint, p256dh, auth, userAgent } = await req.json();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    { endpoint, p256dh, auth, user_agent: userAgent ?? null, last_used_at: new Date().toISOString() },
    { onConflict: "endpoint" }
  );

  if (error) {
    console.error("[Push] Subscribe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[Push] Subscribed:", endpoint.slice(-30));
  return NextResponse.json({ ok: true });
}
