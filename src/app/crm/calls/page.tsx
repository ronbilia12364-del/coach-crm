import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
import { formatDateTime } from "@/lib/utils";
import { CALL_TYPE_LABELS, type Call, type CallType } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";
import AddCallButton from "@/components/crm/AddCallButton";
import CompleteCallButton from "@/components/crm/CompleteCallButton";
import DeleteButton from "@/components/ui/delete-button";

export default async function CallsPage() {
  const supabase = createAdminClient();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [{ data }, { data: activeClients }, { data: activeLeads }] = await Promise.all([
    supabase
      .from("calls")
      .select("*, client:clients(name, phone), lead:leads(name, phone)")
      .gte("scheduled_at", weekStart.toISOString())
      .lt("scheduled_at", weekEnd.toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase.from("clients").select("id, name").eq("status", "active"),
    supabase.from("leads").select("id, name").in("status", ["new", "messaged", "call_scheduled"]),
  ]);

  const calls = (data ?? []) as (Call & { client: any; lead: any })[];
  const clients = (activeClients ?? []) as { id: string; name: string }[];
  const leads = (activeLeads ?? []) as { id: string; name: string }[];

  const upcoming = calls.filter((c) => !c.completed && new Date(c.scheduled_at) >= now);
  const past = calls.filter((c) => c.completed || new Date(c.scheduled_at) < now);

  const CALL_TYPE_COLORS: Record<CallType, string> = {
    onboarding: "bg-blue-100 text-blue-700",
    followup: "bg-purple-100 text-purple-700",
    sales: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">שיחות</h2>
          <p className="text-gray-500 mt-1">
            שבוע נוכחי — {calls.length} שיחות ({upcoming.length} קרובות)
          </p>
        </div>
        <AddCallButton clients={clients} leads={leads} />
      </div>

      {/* Upcoming calls */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-3">שיחות קרובות</h3>
        {upcoming.length === 0 ? (
          <div className="card text-center text-gray-400">אין שיחות מתוכננות השבוע</div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((call) => (
              <CallRow key={call.id} call={call} typeColors={CALL_TYPE_COLORS} />
            ))}
          </div>
        )}
      </div>

      {/* Past calls */}
      {past.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-500 mb-3">עברו / הושלמו</h3>
          <div className="space-y-3 opacity-60">
            {past.map((call) => (
              <CallRow key={call.id} call={call} typeColors={CALL_TYPE_COLORS} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CallRow({
  call,
  typeColors,
}: {
  call: Call & { client: any; lead: any };
  typeColors: Record<CallType, string>;
}) {
  const person = call.client ?? call.lead;
  return (
    <div className="card flex items-center gap-4 py-4">
      <div className="text-gray-400">
        {call.completed ? (
          <CheckCircle2 size={20} className="text-green-500" />
        ) : (
          <Circle size={20} />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{person?.name ?? "לא ידוע"}</p>
          <span className={`badge ${typeColors[call.type as CallType]}`}>
            {CALL_TYPE_LABELS[call.type as CallType]}
          </span>
        </div>
        <p className="text-sm text-gray-500">{formatDateTime(call.scheduled_at)}</p>
        {call.notes && <p className="text-xs text-gray-400 mt-1">{call.notes}</p>}
      </div>
      <div className="flex gap-2">
        {person?.phone && (
          <a
            href={`tel:${person.phone}`}
            className="btn-secondary text-xs py-1 px-3"
          >
            📞 התקשר
          </a>
        )}
        {!call.completed && <CompleteCallButton callId={call.id} />}
        <DeleteButton
          itemId={call.id}
          tableName="calls"
          itemLabel={`שיחה עם ${person?.name ?? "לא ידוע"}`}
        />
      </div>
    </div>
  );
}
