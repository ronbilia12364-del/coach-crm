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

export async function addClientWithPayments(data: {
  name: string;
  phone: string;
  email?: string;
  plan: string;
  status: string;
  start_date?: string;
  weight_goal?: number | null;
  notes?: string;
  add_payments: boolean;
  total_months?: number;
  monthly_amount?: number;
}) {
  const supabase = createAdminClient();

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      plan: data.plan,
      status: data.status,
      start_date: data.start_date || null,
      weight_goal: data.weight_goal || null,
      notes: data.notes || null,
      total_months: data.total_months || null,
      monthly_amount: data.monthly_amount || null,
    })
    .select()
    .single();

  if (error || !client) {
    return { error: error?.message ?? "שגיאה ביצירת מתאמן" };
  }

  if (
    data.add_payments &&
    data.start_date &&
    data.total_months &&
    data.total_months > 0 &&
    data.monthly_amount &&
    data.monthly_amount > 0
  ) {
    const startDate = new Date(data.start_date);
    const payments = Array.from({ length: data.total_months }, (_, i) => ({
      client_id: client.id,
      amount: data.monthly_amount,
      month: new Date(startDate.getFullYear(), startDate.getMonth() + i, startDate.getDate())
        .toISOString()
        .split("T")[0],
      status: "unpaid",
      notes: `חודש ${i + 1} מתוך ${data.total_months}`,
    }));

    const { error: payError } = await supabase.from("payments").insert(payments);
    if (payError) console.error("[addClientWithPayments] payments insert:", payError);
  }

  revalidatePath("/crm/clients");
  revalidatePath("/crm/payments");
  revalidatePath("/crm");
  return { error: null };
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
