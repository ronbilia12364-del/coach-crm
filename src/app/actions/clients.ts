"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

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
