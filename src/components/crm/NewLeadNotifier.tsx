"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function playChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();

    const tone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    tone(880, now, 0.35);
    tone(1108, now + 0.18, 0.35);
  } catch {
    // Browser blocked autoplay audio — silently ignore
  }
}

export default function NewLeadNotifier() {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("new-leads-notifier")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const name = (payload.new as { name?: string }).name ?? "לא ידוע";
          playChime();
          toast.success(`🎯 ליד חדש נכנס: ${name}`, {
            duration: 5000,
            action: {
              label: "צפה בלידים",
              onClick: () => { window.location.href = "/crm/leads"; },
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
