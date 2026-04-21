"use client";

import { Pencil, Trash2, Check } from "lucide-react";
import type { MessageTemplate } from "@/types";

interface Props {
  template: MessageTemplate;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TemplateCard({ template, selected, onSelect, onEdit, onDelete }: Props) {
  return (
    <div
      onClick={onSelect}
      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? "border-green-500 bg-green-50"
          : "border-gray-200 bg-white hover:border-green-300"
      }`}
    >
      {/* Edit/Delete icons */}
      <div className="absolute top-3 left-3 flex gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="ערוך תבנית"
        >
          <Pencil size={13} className="text-gray-400" />
        </button>
        {!template.is_default && (
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="מחק תבנית"
          >
            <Trash2 size={13} className="text-red-400" />
          </button>
        )}
      </div>

      {/* Selected checkmark */}
      {selected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      )}

      <div className="mt-1 space-y-1.5">
        <p className="font-semibold text-sm pl-14">{template.name}</p>
        <p className="text-xs text-gray-500 line-clamp-3">{template.content}</p>
      </div>

      <div className={`mt-3 w-full text-xs py-1.5 rounded-lg text-center font-medium transition-colors ${
        selected
          ? "bg-green-500 text-white"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}>
        {selected ? "✓ נבחר" : "בחר"}
      </div>
    </div>
  );
}
