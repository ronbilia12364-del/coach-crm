import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PLAN_PRICES, type Client } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function buildWhatsAppUrl(phone: string, message?: string) {
  const cleaned = phone.replace(/\D/g, "");
  const normalized = cleaned.startsWith("0") ? "972" + cleaned.slice(1) : cleaned;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function computeEndDate(client: Pick<Client, "start_date" | "plan" | "frozen_at" | "frozen_days">): Date | null {
  if (!client.start_date) return null;

  const months = PLAN_PRICES[client.plan as keyof typeof PLAN_PRICES]?.months ?? 1;
  const end = new Date(client.start_date);
  end.setMonth(end.getMonth() + months);

  let totalFrozenDays = client.frozen_days ?? 0;
  if (client.frozen_at) {
    totalFrozenDays += Math.floor((Date.now() - new Date(client.frozen_at).getTime()) / 86_400_000);
  }
  end.setDate(end.getDate() + totalFrozenDays);
  return end;
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

export function buildLeadWhatsAppMessage(name: string) {
  return `היי ${name}! ראיתי שהשארת פרטים 💪 מתי זמין לקבוע שיחה קצרה של 15 דקות לראות איך אני יכול לעזור לך להגיע ליעד?`;
}
