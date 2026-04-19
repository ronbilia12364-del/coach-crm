"use client";

import { useState } from "react";
import { saveNutritionPlan } from "@/app/actions/nutrition";
import { MEAL_TYPE_LABELS, type MealType, type NutritionPlan, type Meal } from "@/types";
import { Plus, Trash2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

type MealDraft = Omit<Meal, "id" | "plan_id">;

export default function NutritionEditor({
  clientId,
  clientName,
  initialPlan,
}: {
  clientId: string;
  clientName: string;
  initialPlan: (NutritionPlan & { meals?: Meal[] }) | null;
}) {
  const router = useRouter();
  const [planName, setPlanName] = useState(initialPlan?.name ?? "תפריט נוכחי");
  const [planId, setPlanId] = useState<string | null>(initialPlan?.id ?? null);
  const [meals, setMeals] = useState<MealDraft[]>(() => {
    if (!initialPlan?.meals?.length) return [{ meal_type: "breakfast", name: "", order_index: 0 }];
    return [...initialPlan.meals]
      .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type as MealType) - MEAL_ORDER.indexOf(b.meal_type as MealType))
      .map(({ id: _id, plan_id: _pid, ...m }) => m);
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function addMeal() {
    setMeals((prev) => [...prev, { meal_type: "breakfast", name: "", order_index: prev.length }]);
  }

  function removeMeal(idx: number) {
    setMeals((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateMeal(idx: number, field: string, value: string | number) {
    setMeals((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  }

  async function handleSave() {
    setLoading(true);
    const result = await saveNutritionPlan(clientId, planId, planName, meals);
    if (result.planId) setPlanId(result.planId);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const totals = {
    calories: meals.reduce((s, m) => s + (m.calories ?? 0), 0),
    protein: meals.reduce((s, m) => s + (m.protein ?? 0), 0),
    carbs: meals.reduce((s, m) => s + (m.carbs ?? 0), 0),
    fat: meals.reduce((s, m) => s + (m.fat ?? 0), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">תפריט תזונה</h2>
          <p className="text-gray-500">{clientName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-secondary">חזור</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {loading ? "שומר..." : saved ? "✅ נשמר!" : "שמור תפריט"}
          </button>
        </div>
      </div>

      <div className="card">
        <label className="text-xs text-gray-500 mb-1 block">שם התפריט</label>
        <input
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className="input"
          placeholder="תפריט נוכחי"
        />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "קלוריות", value: totals.calories, unit: "קל" },
          { label: "חלבון", value: totals.protein, unit: 'ג"ר' },
          { label: "פחמימות", value: totals.carbs, unit: 'ג"ר' },
          { label: "שומן", value: totals.fat, unit: 'ג"ר' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="card text-center py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
            <p className="text-xs text-gray-400">{unit}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {meals.map((meal, idx) => (
          <div key={idx} className="card space-y-3">
            <div className="flex justify-between items-center">
              <select
                value={meal.meal_type}
                onChange={(e) => updateMeal(idx, "meal_type", e.target.value)}
                className="input w-auto text-sm font-medium"
              >
                {MEAL_ORDER.map((t) => (
                  <option key={t} value={t}>{MEAL_TYPE_LABELS[t]}</option>
                ))}
              </select>
              <button onClick={() => removeMeal(idx)} className="text-red-400 hover:text-red-600 p-1">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <input
                placeholder="שם הארוחה"
                value={meal.name}
                onChange={(e) => updateMeal(idx, "name", e.target.value)}
                className="input"
              />
              <textarea
                placeholder="תיאור מפורט (אופציונלי)"
                value={meal.description ?? ""}
                onChange={(e) => updateMeal(idx, "description", e.target.value)}
                rows={2}
                className="input resize-none text-sm"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { field: "calories", label: "קלוריות" },
                { field: "protein", label: "חלבון" },
                { field: "carbs", label: "פחמימות" },
                { field: "fat", label: "שומן" },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                  <input
                    type="number"
                    value={(meal as any)[field] ?? ""}
                    onChange={(e) => updateMeal(idx, field, Number(e.target.value))}
                    className="input text-sm"
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={addMeal} className="btn-secondary w-full flex items-center justify-center gap-2">
        <Plus size={16} />
        הוסף ארוחה
      </button>
    </div>
  );
}
