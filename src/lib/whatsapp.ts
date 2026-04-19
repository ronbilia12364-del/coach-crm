const API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

function toInternationalPhone(phone: string): string {
  // Strip all non-digits
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<void> {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return;

  const to = toInternationalPhone(phone);

  await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }),
  });
}
