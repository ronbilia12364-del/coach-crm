"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePortalClient } from "@/hooks/usePortalClient";
import { MEAL_TYPE_LABELS, type MealType, type NutritionPlan, type Meal } from "@/types";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
};

export default function PortalNutritionPage() {
  const { clientId, clientName, ready } = usePortalClient();
  const [plan, setPlan] = useState<(NutritionPlan & { meals: Meal[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !clientId) return;
    const supabase = createClient();
    supabase
      .from("nutrition_plans")
      .select("*, meals(*)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          data.meals = (data.meals ?? []).sort(
            (a: Meal, b: Meal) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type)
          );
          setPlan(data);
        }
        setLoading(false);
      });
  }, [clientId, ready]);

  if (!ready || loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">טוען...</div>;
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
        <div className="text-5xl">🥗</div>
        <p className="text-gray-500">המאמן עדיין לא הוסיף תפריט</p>
      </div>
    );
  }

  const mealsByType = MEAL_ORDER.map((type) => ({
    type,
    meals: plan.meals.filter((m) => m.meal_type === type),
  })).filter(({ meals }) => meals.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">תפריט תזונה</h2>
        <p className="text-gray-500 text-sm">{plan.name}</p>
      </div>

      {/* Macro summary */}
      <div className="bg-green-600 rounded-2xl p-4 text-white">
        <p className="text-sm opacity-80 mb-2">סיכום יומי</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold">{plan.total_calories}</p>
            <p className="text-xs opacity-70">קלוריות</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{plan.total_protein}</p>
            <p className="text-xs opacity-70">חלבון</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{plan.total_carbs}</p>
            <p className="text-xs opacity-70">פחמימות</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{plan.total_fat}</p>
            <p className="text-xs opacity-70">שומן</p>
          </div>
        </div>
      </div>

      {/* Meals */}
      {mealsByType.map(({ type, meals }) => (
        <div key={type}>
          <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span>{MEAL_ICONS[type]}</span>
            {MEAL_TYPE_LABELS[type]}
          </h3>
          <div className="space-y-2">
            {meals.map((meal) => (
              <div key={meal.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="font-medium">{meal.name}</p>
                {meal.description && <p className="text-sm text-gray-500 mt-1">{meal.description}</p>}
                {meal.calories && (
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    {meal.calories && <span>{meal.calories} קל</span>}
                    {meal.protein && <span>חלבון: {meal.protein}ג</span>}
                    {meal.carbs && <span>פחמימות: {meal.carbs}ג</span>}
                    {meal.fat && <span>שומן: {meal.fat}ג</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
