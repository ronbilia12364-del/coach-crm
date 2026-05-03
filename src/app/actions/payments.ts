"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { addMonths, startOfMonth, format } from "date-fns";

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

export async function addRecurringPayments(clientId: string, formData: FormData) {
  const supabase = createAdminClient();

  const monthlyAmount = Number(formData.get("monthly_amount"));
  const totalMonths = Number(formData.get("total_months"));
  const startMonth = formData.get("month") as string;
  const method = (formData.get("method") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!monthlyAmount || !totalMonths || !startMonth) {
    return { error: "נא למלא את כל השדות הנדרשים" };
  }

  const groupId = crypto.randomUUID();
  const startDate = startOfMonth(new Date(startMonth));

  const payments = Array.from({ length: totalMonths }, (_, i) => {
    const monthDate = addMonths(startDate, i);
    return {
      client_id: clientId,
      amount: monthlyAmount,
      month: format(monthDate, "yyyy-MM-dd"),
      status: "unpaid",
      method,
      notes,
      is_recurring: true,
      recurring_group_id: groupId,
      recurring_total_months: totalMonths,
      recurring_month_number: i + 1,
    };
  });

  const { error } = await supabase.from("payments").insert(payments);
  revalidatePath(`/crm/clients/${clientId}`);
  revalidatePath("/crm/payments");
  return { error: error?.message ?? null };
}

export async function deletePayment(paymentId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  revalidatePath("/crm/payments");
  revalidatePath("/crm/clients");
  return { error: error?.message ?? null };
}

export async function deleteRecurringGroup(groupId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("recurring_group_id", groupId);
  revalidatePath("/crm/payments");
  revalidatePath("/crm/clients");
  return { error: error?.message ?? null };
}

export async function updatePayment(
  paymentId: string,
  data: { amount: number; month: string; status: string; method: string | null; notes: string | null }
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("payments").update(data).eq("id", paymentId);
  revalidatePath("/crm/payments");
  revalidatePath("/crm/clients");
  return { error: error?.message ?? null };
}

export async function updateRecurringGroup(
  groupId: string,
  recurringMonthNumber: number,
  data: { amount: number; month: string; status: string; method: string | null; notes: string | null }
) {
  const supabase = createAdminClient();

  const { data: groupPayments, error: fetchError } = await supabase
    .from("payments")
    .select("id, recurring_month_number")
    .eq("recurring_group_id", groupId)
    .order("recurring_month_number", { ascending: true });

  if (fetchError) return { error: fetchError.message };

  const thisMonth = startOfMonth(new Date(data.month));
  const newFirstMonth = addMonths(thisMonth, -(recurringMonthNumber - 1));

  await Promise.all(
    (groupPayments ?? []).map((p) => {
      const idx = (p.recurring_month_number ?? 1) - 1;
      const newMonth = format(addMonths(newFirstMonth, idx), "yyyy-MM-dd");
      return supabase
        .from("payments")
        .update({ amount: data.amount, month: newMonth, status: data.status, method: data.method, notes: data.notes })
        .eq("id", p.id);
    })
  );

  revalidatePath("/crm/payments");
  revalidatePath("/crm/clients");
  return { error: null };
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
