"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function addLead(formData: FormData) {
  const supabase = createAdminClient();
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;

  const { error } = await supabase.from("leads").insert({
    name,
    phone,
    source: formData.get("source"),
    notes: formData.get("notes") || null,
    status: "new",
  });

  if (!error) {
    const message = `היי ${name}! ראיתי שהשארת פרטים 💪 תרצה לקבוע שיחה קצרה של 15 דקות לראות איך אני יכול לעזור לך להגיע ליעד?`;
    await sendWhatsAppMessage(phone, message);
  }

  revalidatePath("/crm/leads");
  return { error: error?.message ?? null };
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("leads").update({ status }).eq("id", id);
  revalidatePath("/crm/leads");
  return { error: error?.message ?? null };
}

export async function convertLead(leadId: string, formData: FormData) {
  const supabase = createAdminClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: formData.get("name"),
      phone: formData.get("phone"),
      plan: formData.get("plan"),
      status: "active",
      start_date: formData.get("start_date") || null,
      lead_id: leadId,
    })
    .select()
    .single();

  if (clientError) return { error: clientError.message, clientId: null };

  await supabase.from("leads").update({ status: "converted" }).eq("id", leadId);
  revalidatePath("/crm/leads");
  revalidatePath("/crm/clients");
  return { error: null, clientId: client.id as string };
}
