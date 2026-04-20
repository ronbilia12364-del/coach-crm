"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const ALLOWED_TABLES = new Set(["leads", "clients", "calls", "payments"]);

const REVALIDATE_PATHS: Record<string, string[]> = {
  leads: ["/crm/leads"],
  clients: ["/crm/clients", "/crm/payments", "/crm/calls"],
  calls: ["/crm/calls"],
  payments: ["/crm/payments"],
};

export async function deleteRecord(id: string, tableName: string) {
  if (!ALLOWED_TABLES.has(tableName)) {
    return { error: "טבלה לא מורשית" };
  }

  const supabase = createAdminClient();

  if (tableName === "clients") {
    await supabase.from("payments").delete().eq("client_id", id);
    await supabase.from("calls").delete().eq("client_id", id);
  }

  const { error } = await supabase.from(tableName).delete().eq("id", id);

  for (const path of REVALIDATE_PATHS[tableName] ?? []) {
    revalidatePath(path);
  }

  return { error: error?.message ?? null };
}
