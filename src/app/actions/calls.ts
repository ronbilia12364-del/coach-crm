"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function addCall(formData: FormData) {
  const supabase = createAdminClient();
  const target = formData.get("target") as string;
  const [targetType, targetId] = target.split(":");

  const { error } = await supabase.from("calls").insert({
    client_id: targetType === "client" ? targetId : null,
    lead_id: targetType === "lead" ? targetId : null,
    type: formData.get("call_type"),
    scheduled_at: new Date(formData.get("scheduled_at") as string).toISOString(),
    notes: formData.get("notes") || null,
  });
  revalidatePath("/crm/calls");
  revalidatePath("/crm");
  return { error: error?.message ?? null };
}

export async function completeCall(callId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("calls")
    .update({ completed: true })
    .eq("id", callId);
  revalidatePath("/crm/calls");
  revalidatePath("/crm");
  return { error: error?.message ?? null };
}
