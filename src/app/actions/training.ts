"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Exercise } from "@/types";

type WorkoutDraft = {
  day: string;
  name: string;
  description: string;
  exercises: Exercise[];
};

export async function saveTrainingPlan(
  clientId: string,
  planId: string | null,
  planName: string,
  weekStart: string,
  workouts: WorkoutDraft[]
) {
  const supabase = createAdminClient();

  let resolvedPlanId = planId;

  if (resolvedPlanId) {
    await supabase.from("training_plans")
      .update({ name: planName, week_start: weekStart })
      .eq("id", resolvedPlanId);
    await supabase.from("workouts").delete().eq("plan_id", resolvedPlanId);
  } else {
    const { data, error } = await supabase.from("training_plans").insert({
      client_id: clientId,
      name: planName,
      week_start: weekStart,
    }).select().single();
    if (error) return { error: error.message };
    resolvedPlanId = data.id;
  }

  if (resolvedPlanId && workouts.length > 0) {
    const { error } = await supabase.from("workouts").insert(
      workouts.map((w, i) => ({
        plan_id: resolvedPlanId!,
        day: w.day,
        name: w.name,
        description: w.description || null,
        exercises: w.exercises,
        order_index: i,
      }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath(`/crm/clients/${clientId}`);
  return { error: null, planId: resolvedPlanId };
}
