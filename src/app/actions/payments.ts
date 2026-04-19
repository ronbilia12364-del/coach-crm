"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function addPayment(clientId: string, formData: FormData) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("payments").insert({
    client_id: clientId,
    amount: Number(formData.get("amount")),
    month: formData.get("month"),
    status: formData.get("status"),
    method: formData.get("method") || null,
    notes: formData.get("notes") || null,
  });
  revalidatePath(`/crm/clients/${clientId}`);
  revalidatePath("/crm/payments");
  return { error: error?.message ?? null };
}

export async function markPaid(paymentId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", paymentId);
  revalidatePath("/crm/payments");
  revalidatePath("/crm/clients");
  return { error: error?.message ?? null };
}
