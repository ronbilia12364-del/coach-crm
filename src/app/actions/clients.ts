"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { PLAN_PRICES } from "@/types";

export async function addClient(formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("clients").insert({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") || null,
    plan: formData.get("plan"),
    status: formData.get("status"),
    start_date: formData.get("start_date") || null,
    weight_goal: formData.get("weight_goal") ? Number(formData.get("weight_goal")) : null,
    notes: formData.get("notes") || null,
  });
  revalidatePath("/crm/clients");
  return { error: error?.message ?? null };
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clients")
    .update({
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email") || null,
      plan: formData.get("plan"),
      status: formData.get("status"),
      start_date: formData.get("start_date") || null,
      weight_goal: formData.get("weight_goal") ? Number(formData.get("weight_goal")) : null,
      notes: formData.get("notes") || null,
    })
    .eq("id", id);
  revalidatePath(`/crm/clients/${id}`);
  revalidatePath("/crm/clients");
  return { error: error?.message ?? null };
}

export async function freezeSubscription(clientId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("clients")
    .update({ frozen_at: new Date().toISOString(), status: "inactive" })
    .eq("id", clientId)
    .is("frozen_at", null);
  revalidatePath(`/crm/clients/${clientId}`);
  return { error: error?.message ?? null };
}

export async function unfreezeSubscription(clientId: string) {
  const supabase = createAdminClient();

  const { data: client } = await supabase
    .from("clients")
    .select("frozen_at, frozen_days")
    .eq("id", clientId)
    .single();

  if (!client?.frozen_at) return { error: "המנוי לא מוקפא" };

  const frozenSince = new Date(client.frozen_at);
  const daysFrozen = Math.floor((Date.now() - frozenSince.getTime()) / 86_400_000);
  const newFrozenDays = (client.frozen_days ?? 0) + daysFrozen;

  const { error } = await supabase
    .from("clients")
    .update({ frozen_at: null, frozen_days: newFrozenDays, status: "active" })
    .eq("id", clientId);

  revalidatePath(`/crm/clients/${clientId}`);
  return { error: error?.message ?? null };
}
