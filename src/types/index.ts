export type LeadStatus = "new" | "messaged" | "call_scheduled" | "converted" | "lost";
export type LeadSource = "instagram" | "facebook" | "other";
export type ClientStatus = "active" | "lead" | "pending" | "inactive";
export type ClientPlan = "trial" | "4months" | "10months";
export type PaymentStatus = "paid" | "unpaid" | "partial";
export type PaymentMethod = "bit" | "paypal" | "credit_card" | "bank_transfer" | "app";
export type CallType = "onboarding" | "followup" | "sales";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export type MediaType = "body_photo" | "food_photo" | "workout_video";
export type DayOfWeek = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export const PLAN_PRICES: Record<ClientPlan, { label: string; price: number; months: number }> = {
  trial: { label: "חודש ניסיון", price: 197, months: 1 },
  "4months": { label: "4 חודשים", price: 550, months: 4 },
  "10months": { label: "10 חודשים", price: 400, months: 10 },
};

export const PLAN_LABELS: Record<ClientPlan, string> = {
  trial: "חודש ניסיון",
  "4months": "4 חודשים",
  "10months": "10 חודשים",
};

export function getPlanLabel(plan: string): string {
  return (PLAN_LABELS as Record<string, string>)[plan] ?? plan;
}

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: "פעיל",
  lead: "ליד",
  pending: "ממתין",
  inactive: "לא פעיל",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "חדש",
  messaged: "נשלחה הודעה",
  call_scheduled: "נקבעה שיחה",
  converted: "הפך ללקוח",
  lost: "אבד",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bit: "ביט",
  paypal: "PayPal",
  credit_card: "כרטיס אשראי",
  bank_transfer: "העברה בנקאית",
  app: "אפליקציה",
};

export const CALL_TYPE_LABELS: Record<CallType, string> = {
  onboarding: "אונבורדינג",
  followup: "מעקב",
  sales: "שיחת מכירה",
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "ארוחת בוקר",
  lunch: "ארוחת צהריים",
  dinner: "ארוחת ערב",
  snack: "ארוחת ביניים",
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  sunday: "ראשון",
  monday: "שני",
  tuesday: "שלישי",
  wednesday: "רביעי",
  thursday: "חמישי",
  friday: "שישי",
  saturday: "שבת",
};

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  age?: number | null;
  goal?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  plan: string;
  status: ClientStatus;
  start_date?: string;
  weight_goal?: number;
  notes?: string;
  lead_id?: string;
  frozen_at?: string | null;
  frozen_days?: number;
  total_months?: number | null;
  monthly_amount?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  month: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  notes?: string;
  paid_at?: string;
  created_at: string;
  is_recurring?: boolean;
  recurring_group_id?: string | null;
  recurring_total_months?: number | null;
  recurring_month_number?: number | null;
}

export interface Call {
  id: string;
  client_id?: string;
  lead_id?: string;
  type: CallType;
  scheduled_at: string;
  completed: boolean;
  duration_min?: number;
  notes?: string;
  created_at: string;
  client?: Client;
  lead?: Lead;
}

export interface NutritionPlan {
  id: string;
  client_id: string;
  name: string;
  total_calories?: number;
  total_protein?: number;
  total_carbs?: number;
  total_fat?: number;
  created_at: string;
  updated_at: string;
  meals?: Meal[];
}

export interface Meal {
  id: string;
  plan_id: string;
  meal_type: MealType;
  name: string;
  description?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  order_index: number;
}

export interface WeightLog {
  id: string;
  client_id: string;
  weight: number;
  logged_at: string;
  notes?: string;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  client_id: string;
  week_start: string;
  name: string;
  created_at: string;
  workouts?: Workout[];
}

export interface Workout {
  id: string;
  plan_id: string;
  day: DayOfWeek;
  name: string;
  description?: string;
  exercises?: Exercise[];
  completed: boolean;
  completed_at?: string;
  client_notes?: string;
  order_index: number;
}

export interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  notes?: string;
}

export interface MediaUpload {
  id: string;
  client_id: string;
  type: MediaType;
  storage_path: string;
  caption?: string;
  uploaded_at: string;
}

export interface DashboardStats {
  activeClients: number;
  monthlyRevenue: number;
  newLeads: number;
  unpaidPayments: number;
  revenueByPlan: Record<ClientPlan, number>;
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type BroadcastStatus = "sent" | "skipped" | "failed";
export type RecipientType = "client" | "lead";

export interface BroadcastRecipient {
  id: string;
  name: string;
  phone: string;
  type: RecipientType;
  status?: string;
  plan?: string;
}

export interface RecipientFilters {
  includeClients: boolean;
  includeLeads: boolean;
  clientStatuses: string[];
  clientPlans: string[];
  leadStatuses: string[];
  excludeRecent: boolean;
}
