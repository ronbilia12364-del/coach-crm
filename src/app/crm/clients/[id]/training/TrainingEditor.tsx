"use client";

import { useState } from "react";
import { saveTrainingPlan } from "@/app/actions/training";
import { DAY_LABELS, type DayOfWeek, type TrainingPlan, type Workout, type Exercise } from "@/types";
import { Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";

const DAYS: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

type WorkoutDraft = {
  day: DayOfWeek;
  name: string;
  description: string;
  exercises: Exercise[];
};

export default function TrainingEditor({
  clientId,
  clientName,
  initialPlan,
}: {
  clientId: string;
  clientName: string;
  initialPlan: (TrainingPlan & { workouts?: Workout[] }) | null;
}) {
  const router = useRouter();
  const [planName, setPlanName] = useState(initialPlan?.name ?? "שבוע נוכחי");
  const [planId, setPlanId] = useState<string | null>(initialPlan?.id ?? null);
  const [weekStart, setWeekStart] = useState(
    initialPlan?.week_start ??
    new Date(Date.now() - new Date().getDay() * 86400000).toISOString().split("T")[0]
  );
  const [workouts, setWorkouts] = useState<WorkoutDraft[]>(() => {
    if (!initialPlan?.workouts?.length) return [];
    return [...initialPlan.workouts]
      .sort((a, b) => DAYS.indexOf(a.day as DayOfWeek) - DAYS.indexOf(b.day as DayOfWeek))
      .map((w) => ({
        day: w.day as DayOfWeek,
        name: w.name,
        description: w.description ?? "",
        exercises: (w.exercises as Exercise[]) ?? [],
      }));
  });
  const [expanded, setExpanded] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function addWorkout() {
    const usedDays = workouts.map((w) => w.day);
    const nextDay = DAYS.find((d) => !usedDays.includes(d)) ?? "sunday";
    setWorkouts((prev) => [...prev, { day: nextDay, name: "", description: "", exercises: [] }]);
    setExpanded((prev) => [...prev, workouts.length]);
  }

  function removeWorkout(idx: number) {
    setWorkouts((prev) => prev.filter((_, i) => i !== idx));
    setExpanded((prev) => prev.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)));
  }

  function updateWorkout(idx: number, field: string, value: string) {
    setWorkouts((prev) => prev.map((w, i) => (i === idx ? { ...w, [field]: value } : w)));
  }

  function addExercise(wIdx: number) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wIdx ? { ...w, exercises: [...w.exercises, { name: "", sets: 3, reps: "10" }] } : w
      )
    );
  }

  function updateExercise(wIdx: number, eIdx: number, field: string, value: string | number) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wIdx
          ? { ...w, exercises: w.exercises.map((e, j) => (j === eIdx ? { ...e, [field]: value } : e)) }
          : w
      )
    );
  }

  function removeExercise(wIdx: number, eIdx: number) {
    setWorkouts((prev) =>
      prev.map((w, i) =>
        i === wIdx ? { ...w, exercises: w.exercises.filter((_, j) => j !== eIdx) } : w
      )
    );
  }

  async function handleSave() {
    setLoading(true);
    const result = await saveTrainingPlan(clientId, planId, planName, weekStart, workouts);
    if (result.planId) setPlanId(result.planId);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">תוכנית אימונים</h2>
          <p className="text-gray-500">{clientName}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.back()} className="btn-secondary">חזור</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2">
            <Save size={16} />
            {loading ? "שומר..." : saved ? "✅ נשמר!" : "שמור תוכנית"}
          </button>
        </div>
      </div>

      <div className="card grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">שם התוכנית</label>
          <input value={planName} onChange={(e) => setPlanName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">תחילת שבוע</label>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="input" />
        </div>
      </div>

      <div className="space-y-3">
        {workouts.map((workout, wIdx) => (
          <div key={wIdx} className="card">
            <div className="flex items-center gap-3 mb-3">
              <select
                value={workout.day}
                onChange={(e) => updateWorkout(wIdx, "day", e.target.value)}
                className="input w-auto font-medium"
              >
                {DAYS.map((d) => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
              </select>
              <input
                value={workout.name}
                onChange={(e) => updateWorkout(wIdx, "name", e.target.value)}
                placeholder="שם האימון"
                className="input flex-1"
              />
              <button onClick={() => setExpanded((p) => p.includes(wIdx) ? p.filter(i => i !== wIdx) : [...p, wIdx])}>
                {expanded.includes(wIdx) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              <button onClick={() => removeWorkout(wIdx)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>

            {expanded.includes(wIdx) && (
              <div className="space-y-3 border-t pt-3 mt-3">
                <textarea
                  value={workout.description}
                  onChange={(e) => updateWorkout(wIdx, "description", e.target.value)}
                  placeholder="תיאור כללי"
                  rows={2}
                  className="input resize-none text-sm w-full"
                />
                <div className="space-y-2">
                  {workout.exercises.map((ex, eIdx) => (
                    <div key={eIdx} className="flex gap-2 items-center bg-gray-50 rounded-xl p-2">
                      <input
                        value={ex.name}
                        onChange={(e) => updateExercise(wIdx, eIdx, "name", e.target.value)}
                        placeholder="תרגיל"
                        className="input flex-1 text-sm"
                      />
                      <input
                        type="number"
                        value={ex.sets ?? ""}
                        onChange={(e) => updateExercise(wIdx, eIdx, "sets", Number(e.target.value))}
                        placeholder="סטים"
                        className="input w-16 text-sm"
                      />
                      <input
                        value={ex.reps ?? ""}
                        onChange={(e) => updateExercise(wIdx, eIdx, "reps", e.target.value)}
                        placeholder="חזרות"
                        className="input w-20 text-sm"
                      />
                      <button onClick={() => removeExercise(wIdx, eIdx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addExercise(wIdx)} className="btn-secondary text-xs flex items-center gap-1">
                  <Plus size={12} /> הוסף תרגיל
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={addWorkout} className="btn-secondary w-full flex items-center justify-center gap-2">
        <Plus size={16} />
        הוסף אימון
      </button>
    </div>
  );
}
