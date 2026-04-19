"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getPortalClient(clientId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from("clients").select("*").eq("id", clientId).single();
  return data;
}

export async function getWeightLogs(clientId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("client_id", clientId)
    .order("logged_at");
  return data ?? [];
}

export async function addWeightLog(clientId: string, weight: number, notes?: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("weight_logs").insert({
    client_id: clientId,
    weight,
    logged_at: new Date().toISOString().split("T")[0],
    notes: notes || null,
  });
  return { error: error?.message ?? null };
}

export async function getLatestNutritionPlan(clientId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("nutrition_plans")
    .select("*, meals(*)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getLatestTrainingPlan(clientId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("training_plans")
    .select("*, workouts(*)")
    .eq("client_id", clientId)
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function toggleWorkoutCompleted(workoutId: string, completed: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("workouts").update({
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  }).eq("id", workoutId);
  return { error: error?.message ?? null };
}

export async function saveWorkoutNote(workoutId: string, clientNotes: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("workouts")
    .update({ client_notes: clientNotes })
    .eq("id", workoutId);
  return { error: error?.message ?? null };
}

export async function getMediaUploads(clientId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("media_uploads")
    .select("type, uploaded_at, caption")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false })
    .limit(6);
  return data ?? [];
}

export async function saveMediaUpload(
  clientId: string,
  type: string,
  storagePath: string,
  caption?: string
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("media_uploads").insert({
    client_id: clientId,
    type,
    storage_path: storagePath,
    caption: caption || null,
  });
  return { error: error?.message ?? null };
}
