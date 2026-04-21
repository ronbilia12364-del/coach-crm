"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type {
  MessageTemplate,
  BroadcastRecipient,
  BroadcastStatus,
  RecipientFilters,
  RecipientType,
} from "@/types";

export async function getTemplates(): Promise<MessageTemplate[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("message_templates")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as MessageTemplate[];
}

export async function createTemplate(name: string, content: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("message_templates").insert({ name, content });
  revalidatePath("/crm/broadcast");
  return { error: error?.message ?? null };
}

export async function updateTemplate(id: string, name: string, content: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("message_templates")
    .update({ name, content, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/crm/broadcast");
  return { error: error?.message ?? null };
}

export async function deleteTemplate(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("message_templates").delete().eq("id", id);
  revalidatePath("/crm/broadcast");
  return { error: error?.message ?? null };
}

export async function getRecipients(filters: RecipientFilters): Promise<BroadcastRecipient[]> {
  const supabase = createAdminClient();
  const recipients: BroadcastRecipient[] = [];

  const recentIds = new Set<string>();
  if (filters.excludeRecent) {
    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: recent } = await supabase
        .from("broadcast_log")
        .select("recipient_id, recipient_type")
        .gte("sent_at", since)
        .eq("status", "sent");
      if (recent) {
        recent.forEach((r) => recentIds.add(`${r.recipient_type}:${r.recipient_id}`));
      }
    } catch {
      // table might not exist yet
    }
  }

  if (filters.includeClients && filters.clientStatuses.length > 0) {
    let q = supabase.from("clients").select("id, name, phone, status, plan").in("status", filters.clientStatuses);
    if (filters.clientPlans.length > 0) q = q.in("plan", filters.clientPlans);
    const { data } = await q;
    if (data) {
      for (const c of data) {
        if (!recentIds.has(`client:${c.id}`)) {
          recipients.push({ id: c.id, name: c.name, phone: c.phone, type: "client", status: c.status, plan: c.plan });
        }
      }
    }
  }

  if (filters.includeLeads && filters.leadStatuses.length > 0) {
    const q = supabase.from("leads").select("id, name, phone, status").in("status", filters.leadStatuses);
    const { data } = await q;
    if (data) {
      for (const l of data) {
        if (!recentIds.has(`lead:${l.id}`)) {
          recipients.push({ id: l.id, name: l.name, phone: l.phone, type: "lead", status: l.status });
        }
      }
    }
  }

  return recipients;
}

export async function logBroadcastEntry(entry: {
  recipient_id: string;
  recipient_type: RecipientType;
  recipient_name: string;
  recipient_phone: string;
  message: string;
  status: BroadcastStatus;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("broadcast_log").insert(entry);
  return { error: error?.message ?? null };
}

export async function getDailyBroadcastCount(): Promise<number> {
  try {
    const supabase = createAdminClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("broadcast_log")
      .select("id", { count: "exact", head: true })
      .gte("sent_at", since)
      .eq("status", "sent");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function getLastBroadcastTimes(
  ids: string[],
  type: RecipientType
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("broadcast_log")
      .select("recipient_id, sent_at")
      .in("recipient_id", ids)
      .eq("recipient_type", type)
      .eq("status", "sent")
      .order("sent_at", { ascending: false });
    if (!data) return {};
    const result: Record<string, string> = {};
    for (const row of data) {
      if (!result[row.recipient_id]) result[row.recipient_id] = row.sent_at;
    }
    return result;
  } catch {
    return {};
  }
}
