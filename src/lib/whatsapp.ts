const API_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

function toInternationalPhone(phone: string): string {
  // Strip all non-digits
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) {
    console.error("[WhatsApp] No token configured");
    return false;
  }

  const to = toInternationalPhone(phone);
  console.log("[WhatsApp] Sending to:", phone, "→", to);

  const res = await fetch(API_URL, {
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

  console.log("[WhatsApp] Response status:", res.status);

  if (!res.ok) {
    const body = await res.text();
    console.error("[WhatsApp] Error response:", body);
    return false;
  }

  return true;
}
