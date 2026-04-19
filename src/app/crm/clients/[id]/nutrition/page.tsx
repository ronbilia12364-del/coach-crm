import { createAdminClient } from "@/lib/supabase/admin";
import NutritionEditor from "./NutritionEditor";

export const dynamic = "force-dynamic";

export default async function NutritionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const supabase = createAdminClient();

  const [{ data: client }, { data: plan }] = await Promise.all([
    supabase.from("clients").select("name").eq("id", clientId).single(),
    supabase
      .from("nutrition_plans")
      .select("*, meals(*)")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <NutritionEditor
      clientId={clientId}
      clientName={client?.name ?? ""}
      initialPlan={plan}
    />
  );
}
