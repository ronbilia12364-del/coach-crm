"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Send } from "lucide-react";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getDailyBroadcastCount,
} from "@/app/actions/broadcast";
import TemplateCard from "@/components/broadcast/TemplateCard";
import TemplateDialog from "@/components/broadcast/TemplateDialog";
import RecipientFilter from "@/components/broadcast/RecipientFilter";
import BroadcastQueue from "@/components/broadcast/BroadcastQueue";
import type { MessageTemplate, BroadcastRecipient } from "@/types";

const DAILY_LIMIT = 100;

export default function BroadcastPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [dailyCount, setDailyCount] = useState(0);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const [tpl, count] = await Promise.all([getTemplates(), getDailyBroadcastCount()]);
    setTemplates(tpl);
    setDailyCount(count);
    if (tpl.length > 0 && !selectedTemplate) {
      setSelectedTemplate(tpl[0]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecipientsChange = useCallback((r: BroadcastRecipient[]) => {
    setRecipients(r);
  }, []);

  async function handleSaveTemplate(name: string, content: string) {
    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, name, content);
    } else {
      await createTemplate(name, content);
    }
    await loadData();
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("למחוק את התבנית?")) return;
    await deleteTemplate(id);
    if (selectedTemplate?.id === id) setSelectedTemplate(null);
    await loadData();
  }

  const remaining = Math.max(0, DAILY_LIMIT - dailyCount);
  const canStart = selectedTemplate && recipients.length > 0 && remaining > 0;
  const effectiveRecipients = recipients.slice(0, remaining);

  if (broadcasting && selectedTemplate) {
    return (
      <BroadcastQueue
        recipients={effectiveRecipients}
        messageTemplate={selectedTemplate.content}
        onClose={() => {
          setBroadcasting(false);
          loadData();
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📨 שליחה מרוכזת</h1>
          <p className="text-sm text-gray-500 mt-0.5">WhatsApp לקבוצות מסוננות</p>
        </div>
        <div className="text-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
          <p className="text-xs text-gray-400">נותרו היום</p>
          <p className={`text-xl font-bold ${remaining < 20 ? "text-red-500" : "text-green-600"}`}>
            {remaining}
          </p>
          <p className="text-xs text-gray-400">מתוך {DAILY_LIMIT}</p>
        </div>
      </div>

      {/* Daily limit warning */}
      {remaining === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          הגעת למגבלת השליחה היומית ({DAILY_LIMIT} הודעות). נסה שוב מחר.
        </div>
      )}

      {/* Templates */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">תבניות הודעה</h2>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setShowDialog(true);
            }}
            className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            <Plus size={15} />
            תבנית חדשה
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">טוען...</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-gray-400">אין תבניות עדיין. צור תבנית ראשונה.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                selected={selectedTemplate?.id === t.id}
                onSelect={() => setSelectedTemplate(t)}
                onEdit={() => {
                  setEditingTemplate(t);
                  setShowDialog(true);
                }}
                onDelete={() => handleDeleteTemplate(t.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recipients */}
      <RecipientFilter onRecipientsChange={handleRecipientsChange} />

      {/* Start button */}
      <div className="pb-6">
        {!selectedTemplate && (
          <p className="text-sm text-center text-orange-500 mb-3">יש לבחור תבנית הודעה</p>
        )}
        {recipients.length === 0 && (
          <p className="text-sm text-center text-gray-400 mb-3">בחר נמענים בסינון למעלה</p>
        )}
        {recipients.length > remaining && remaining > 0 && (
          <p className="text-sm text-center text-orange-500 mb-3">
            יישלח ל-{effectiveRecipients.length} (מגבלה יומית — {recipients.length - remaining} ידולגו)
          </p>
        )}
        <button
          disabled={!canStart}
          onClick={() => setBroadcasting(true)}
          className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Send size={18} />
          התחל שליחה ({effectiveRecipients.length} נמענים)
        </button>
      </div>

      <TemplateDialog
        open={showDialog}
        template={editingTemplate}
        onClose={() => setShowDialog(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
