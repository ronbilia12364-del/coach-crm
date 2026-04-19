"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PortalLoginPage() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const cleaned = phone.replace(/\D/g, "");
    const variants = [
      cleaned,
      cleaned.replace(/^0/, "972"),
      "0" + cleaned.replace(/^972/, ""),
    ];

    const { data, error: err } = await supabase
      .from("clients")
      .select("id, name, status")
      .in("phone", variants)
      .eq("status", "active")
      .single();

    if (err || !data) {
      setError("מספר הטלפון לא נמצא. פנה למאמן שלך.");
      setLoading(false);
      return;
    }

    // Store client session in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("portal_client_id", data.id);
      localStorage.setItem("portal_client_name", data.name);
    }

    router.push("/portal/nutrition");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💪</div>
          <h1 className="text-2xl font-bold">פורטל המתאמן</h1>
          <p className="text-gray-500 mt-2 text-sm">הכנס את מספר הטלפון שלך כדי להיכנס</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">מספר טלפון</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input text-center text-lg tracking-widest"
              placeholder="050-1234567"
              required
              dir="ltr"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 rounded-xl p-3">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
            {loading ? "בודק..." : "כניסה 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}
