import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { buildWhatsAppUrl, formatDate, formatCurrency } from "@/lib/utils";
import { PLAN_LABELS, PAYMENT_METHOD_LABELS, STATUS_LABELS } from "@/types";
import { MessageCircle, Scale, Dumbbell, Utensils, Image } from "lucide-react";
import ClientStatusBadge from "@/components/crm/ClientStatusBadge";
import PaymentStatusBadge from "@/components/crm/PaymentStatusBadge";
import EditClientForm from "@/components/crm/EditClientForm";
import SubscriptionCard from "@/components/crm/SubscriptionCard";
import AddPaymentButton from "@/components/crm/AddPaymentButton";
import ManageNutritionButton from "@/components/crm/ManageNutritionButton";
import ManageTrainingButton from "@/components/crm/ManageTrainingButton";
import Link from "next/link";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: client },
    { data: payments },
    { data: weightLogs },
    { data: nutritionPlan },
    { data: trainingPlan },
    { data: media },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase.from("payments").select("*").eq("client_id", id).order("month", { ascending: false }),
    supabase.from("weight_logs").select("*").eq("client_id", id).order("logged_at", { ascending: false }).limit(10),
    supabase.from("nutrition_plans").select("*, meals(*)").eq("client_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("training_plans").select("*, workouts(*)").eq("client_id", id).order("week_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("media_uploads").select("*").eq("client_id", id).order("uploaded_at", { ascending: false }).limit(6),
  ]);

  if (!client) notFound();

  const totalPaid = payments?.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{client.name}</h2>
            <ClientStatusBadge status={client.status} />
          </div>
          <p className="text-gray-500 mt-1">{PLAN_LABELS[client.plan as keyof typeof PLAN_LABELS]}</p>
        </div>
        <div className="flex gap-2">
          <a
            href={buildWhatsAppUrl(client.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 btn-primary"
          >
            <MessageCircle size={16} />
            WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info */}
        <div className="lg:col-span-1 space-y-4">
          <EditClientForm client={client} />
          <SubscriptionCard client={client} />

          {/* Weight summary */}
          {weightLogs && weightLogs.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Scale size={16} className="text-blue-500" />
                <h3 className="font-semibold text-sm">משקל</h3>
              </div>
              <div className="flex justify-between text-sm">
                <div>
                  <p className="text-gray-500">נוכחי</p>
                  <p className="font-bold text-lg">{weightLogs[0].weight} ק"ג</p>
                </div>
                {client.weight_goal && (
                  <div className="text-left">
                    <p className="text-gray-500">יעד</p>
                    <p className="font-bold text-lg text-green-600">{client.weight_goal} ק"ג</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                עודכן: {formatDate(weightLogs[0].logged_at)}
              </p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Payments */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">תשלומים</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">סה"כ שולם: <strong>{formatCurrency(totalPaid)}</strong></span>
                <AddPaymentButton clientId={id} />
              </div>
            </div>
            {!payments || payments.length === 0 ? (
              <p className="text-gray-400 text-sm">אין תשלומים</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{formatDate(payment.month)}</p>
                      {payment.method && (
                        <p className="text-xs text-gray-500">{PAYMENT_METHOD_LABELS[payment.method as keyof typeof PAYMENT_METHOD_LABELS]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      <PaymentStatusBadge status={payment.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nutrition & Training quick links */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Utensils size={16} className="text-orange-500" />
                <h3 className="font-semibold text-sm">תפריט תזונה</h3>
              </div>
              {nutritionPlan ? (
                <p className="text-xs text-gray-500 mb-3">{nutritionPlan.name} • {nutritionPlan.total_calories} קל</p>
              ) : (
                <p className="text-xs text-gray-400 mb-3">אין תפריט</p>
              )}
              <ManageNutritionButton clientId={id} planId={nutritionPlan?.id} />
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={16} className="text-purple-500" />
                <h3 className="font-semibold text-sm">תוכנית אימונים</h3>
              </div>
              {trainingPlan ? (
                <p className="text-xs text-gray-500 mb-3">{trainingPlan.name}</p>
              ) : (
                <p className="text-xs text-gray-400 mb-3">אין תוכנית</p>
              )}
              <ManageTrainingButton clientId={id} planId={trainingPlan?.id} />
            </div>
          </div>

          {/* Media uploads */}
          {media && media.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Image size={16} className="text-pink-500" />
                <h3 className="font-semibold text-sm">מדיה שהועלתה</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {media.map((item) => {
                  const typeLabels: Record<string, string> = {
                    body_photo: "📸",
                    food_photo: "🍽️",
                    workout_video: "🎬",
                  };
                  return (
                    <div key={item.id} className="bg-gray-100 rounded-xl p-3 text-center">
                      <p className="text-2xl">{typeLabels[item.type]}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(item.uploaded_at)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
