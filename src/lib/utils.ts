import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function buildLeadWhatsAppMessage(name: string) {
  return `היי ${name}! ראיתי שהשארת פרטים 💪 מתי זמין לקבוע שיחה קצרה של 15 דקות לראות איך אני יכול לעזור לך להגיע ליעד?`;
}
