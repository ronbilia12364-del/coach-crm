import webPush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

function initVapid() {
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@coach-crm.com";
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  if (!publicKey || !privateKey) return false;
  webPush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToAll(payload: PushPayload): Promise<{ sent: number; removed: number }> {
  if (!initVapid()) {
    console.warn("[Push] VAPID keys not configured — skipping push");
    return { sent: 0, removed: 0 };
  }

  const supabase = createAdminClient();
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs?.length) return { sent: 0, removed: 0 };

  let sent = 0;
  const toRemove: string[] = [];

  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: unknown) {
      const code = (err as { statusCode?: number }).statusCode;
      if (code === 410 || code === 404) {
        toRemove.push(sub.id);
      } else {
        console.error("[Push] Send error for", sub.endpoint.slice(-20), err);
      }
    }
  }

  if (toRemove.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", toRemove);
    console.log("[Push] Removed", toRemove.length, "stale subscriptions");
  }

  console.log(`[Push] Sent: ${sent}, removed: ${toRemove.length}`);
  return { sent, removed: toRemove.length };
}
