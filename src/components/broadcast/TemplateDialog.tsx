"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { replaceName } from "@/lib/broadcast/helpers";
import type { MessageTemplate } from "@/types";

interface Props {
  open: boolean;
  template?: MessageTemplate | null;
  onClose: () => void;
  onSave: (name: string, content: string) => Promise<void>;
}

export default function TemplateDialog({ open, template, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setContent(template?.content ?? "");
    }
  }, [open, template]);

  if (!open) return null;

  const preview = content ? replaceName(content, "ישראל ישראלי") : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setLoading(true);
    try {
      await onSave(name.trim(), content.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{template ? "עריכת תבנית" : "תבנית חדשה"}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם התבנית</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='למשל: "ברוכים הבאים"'
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תוכן ההודעה</label>
            <textarea
              className="input h-28 resize-none"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב את ההודעה כאן..."
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              השתמש ב-<code className="bg-gray-100 px-1 rounded font-mono">{"{name}"}</code> להכנסת שם המקבל
            </p>
          </div>

          {preview && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">👁 תצוגה מקדימה (ישראל ישראלי):</p>
              <p className="text-sm text-gray-700">{preview}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              בטל
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !content.trim()}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "שומר..." : "שמור תבנית"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
