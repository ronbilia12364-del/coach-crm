"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePortalClient } from "@/hooks/usePortalClient";
import { DAY_LABELS, type DayOfWeek, type TrainingPlan, type Workout, type Exercise } from "@/types";
import { CheckCircle2, Circle, MessageSquare } from "lucide-react";

const DAYS: DayOfWeek[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function PortalTrainingPage() {
  const { clientId, ready } = usePortalClient();
  const [plan, setPlan] = useState<(TrainingPlan & { workouts: Workout[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteModal, setNoteModal] = useState<{ workoutId: string; current: string } | null>(null);
  const [noteText, setNoteText] = useState("");

  async function fetchPlan() {
    if (!clientId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("training_plans")
      .select("*, workouts(*)")
      .eq("client_id", clientId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      data.workouts = (data.workouts ?? []).sort(
        (a: Workout, b: Workout) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
      );
    }
    setPlan(data ?? null);
    setLoading(false);
  }

  useEffect(() => {
    if (ready && clientId) fetchPlan();
  }, [clientId, ready]);

  async function toggleCompleted(workout: Workout) {
    const supabase = createClient();
    await supabase
      .from("workouts")
      .update({
        completed: !workout.completed,
        completed_at: !workout.completed ? new Date().toISOString() : null,
      })
      .eq("id", workout.id);
    fetchPlan();
  }

  async function saveNote() {
    if (!noteModal) return;
    const supabase = createClient();
    await supabase.from("workouts").update({ client_notes: noteText }).eq("id", noteModal.workoutId);
    setNoteModal(null);
    fetchPlan();
  }

  if (!ready || loading) return <div className="flex items-center justify-center h-64 text-gray-400">טוען...</div>;

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
        <div className="text-5xl">🏋️</div>
        <p className="text-gray-500">המאמן עדיין לא הוסיף תוכנית אימונים</p>
      </div>
    );
  }

  const completed = plan.workouts.filter((w) => w.completed).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">תוכנית אימונים</h2>
        <p className="text-gray-500 text-sm">{plan.name}</p>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">התקדמות השבוע</span>
          <span className="text-sm font-medium">{completed} / {plan.workouts.length}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all"
            style={{ width: `${(completed / plan.workouts.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Workouts */}
      <div className="space-y-3">
        {plan.workouts.map((workout) => (
          <div
            key={workout.id}
            className={`bg-white rounded-2xl shadow-sm border transition-all ${
              workout.completed ? "border-green-200 bg-green-50" : "border-gray-100"
            }`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleCompleted(workout)}>
                    {workout.completed ? (
                      <CheckCircle2 size={24} className="text-green-500" />
                    ) : (
                      <Circle size={24} className="text-gray-300" />
                    )}
                  </button>
                  <div>
                    <p className="font-medium">{workout.name}</p>
                    <p className="text-xs text-gray-400">{DAY_LABELS[workout.day]}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setNoteModal({ workoutId: workout.id, current: workout.client_notes ?? "" });
                    setNoteText(workout.client_notes ?? "");
                  }}
                  className="p-2 text-gray-400 hover:text-green-600"
                >
                  <MessageSquare size={18} />
                </button>
              </div>

              {workout.description && (
                <p className="text-sm text-gray-500 mt-2 mr-9">{workout.description}</p>
              )}

              {workout.exercises && (workout.exercises as Exercise[]).length > 0 && (
                <div className="mt-3 mr-9 space-y-1">
                  {(workout.exercises as Exercise[]).map((ex, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
                      <span className="font-medium">{ex.name}</span>
                      {ex.sets && <span className="text-gray-400">— {ex.sets} × {ex.reps}</span>}
                    </div>
                  ))}
                </div>
              )}

              {workout.client_notes && (
                <div className="mt-3 mr-9 bg-yellow-50 rounded-xl p-2.5">
                  <p className="text-xs text-yellow-700">{workout.client_notes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Note modal */}
      {noteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-4">
            <h3 className="font-bold text-lg">הערה מהאימון</h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="input resize-none h-32"
              placeholder="איך הרגשת? מה היה קשה? כמה הרמת?"
            />
            <div className="flex gap-2">
              <button onClick={() => setNoteModal(null)} className="btn-secondary flex-1">ביטול</button>
              <button onClick={saveNote} className="btn-primary flex-1">שמור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
