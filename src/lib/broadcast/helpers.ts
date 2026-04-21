export function replaceName(template: string, name: string): string {
  return template.replace(/\{name\}/g, name);
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.startsWith("0") ? "972" + cleaned.slice(1) : cleaned;
}

export function encodeMessage(message: string): string {
  return encodeURIComponent(message);
}

export function buildBroadcastWAUrl(phone: string, message: string): string {
  return `https://wa.me/${formatPhone(phone)}?text=${encodeMessage(message)}`;
}
