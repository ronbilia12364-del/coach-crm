"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type MealDraft = {
  meal_type: string;
  name: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export async function saveNutritionPlan(
  clientId: string,
  planId: string | null,
  planName: string,
  meals: MealDraft[]
) {
  const supabase = createAdminClient();

  const totalCalories = meals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.protein ?? 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs ?? 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fat ?? 0), 0);

  let resolvedPlanId = planId;

  if (resolvedPlanId) {
    await supabase.from("nutrition_plans").update({
      name: planName,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
    }).eq("id", resolvedPlanId);
    await supabase.from("meals").delete().eq("plan_id", resolvedPlanId);
  } else {
    const { data, error } = await supabase.from("nutrition_plans").insert({
      client_id: clientId,
      name: planName,
      total_calories: totalCalories,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fat: totalFat,
    }).select().single();
    if (error) return { error: error.message };
    resolvedPlanId = data.id;
  }

  if (resolvedPlanId && meals.length > 0) {
    const { error } = await supabase.from("meals").insert(
      meals.map((m, i) => ({ ...m, plan_id: resolvedPlanId!, order_index: i }))
    );
    if (error) return { error: error.message };
  }

  revalidatePath(`/crm/clients/${clientId}`);
  return { error: null, planId: resolvedPlanId };
}
