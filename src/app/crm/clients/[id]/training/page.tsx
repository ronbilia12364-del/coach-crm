import { createAdminClient } from "@/lib/supabase/admin";
import TrainingEditor from "./TrainingEditor";

export const dynamic = "force-dynamic";

export default async function TrainingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const supabase = createAdminClient();

  const [{ data: client }, { data: plan }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", clientId).single(),
    supabase
      .from("training_plans")
      .select("*, workouts(*)")
      .eq("client_id", clientId)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <TrainingEditor
      clientId={clientId}
      clientName={client?.name ?? ""}
      initialPlan={plan}
    />
  );
}
