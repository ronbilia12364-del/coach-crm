"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePortalClient } from "@/hooks/usePortalClient";
import { type MediaType } from "@/types";
import { Camera, Utensils, Video, Upload } from "lucide-react";

const UPLOAD_TYPES: { type: MediaType; label: string; icon: React.ReactNode; accept: string }[] = [
  { type: "body_photo", label: "תמונת גוף", icon: <Camera size={24} />, accept: "image/*" },
  { type: "food_photo", label: "תמונת אוכל", icon: <Utensils size={24} />, accept: "image/*" },
  { type: "workout_video", label: "סרטון אימון", icon: <Video size={24} />, accept: "video/*,image/*" },
];

export default function PortalUploadPage() {
  const { clientId, ready } = usePortalClient();
  const [selected, setSelected] = useState<MediaType>("body_photo");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [recent, setRecent] = useState<{ type: string; uploaded_at: string; caption?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ready || !clientId) return;
    const supabase = createClient();
    supabase
      .from("media_uploads")
      .select("type, uploaded_at, caption")
      .eq("client_id", clientId)
      .order("uploaded_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setRecent(data ?? []));
  }, [clientId, ready, done]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file || !clientId) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${clientId}/${selected}/${Date.now()}.${ext}`;

    const { error: storageErr } = await supabase.storage
      .from("client-media")
      .upload(path, file);

    if (!storageErr) {
      await supabase.from("media_uploads").insert({
        client_id: clientId,
        type: selected,
        storage_path: path,
        caption: caption || null,
      });
    }

    setUploading(false);
    setFile(null);
    setPreview(null);
    setCaption("");
    setDone(true);
    setTimeout(() => setDone(false), 3000);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (!ready) return <div className="flex items-center justify-center h-64 text-gray-400">טוען...</div>;

  const currentType = UPLOAD_TYPES.find((t) => t.type === selected)!;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">העלאת תוכן</h2>

      {/* Type selector */}
      <div className="grid grid-cols-3 gap-3">
        {UPLOAD_TYPES.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => setSelected(type)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
              selected === type
                ? "border-green-500 bg-green-50 text-green-600"
                : "border-gray-100 bg-white text-gray-400"
            }`}
          >
            {icon}
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>

      {/* Upload area */}
      <div
        className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center cursor-pointer hover:border-green-400 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          file?.type.startsWith("video") ? (
            <video src={preview} className="max-h-48 mx-auto rounded-xl" controls />
          ) : (
            <img src={preview} className="max-h-48 mx-auto rounded-xl object-cover" alt="preview" />
          )
        ) : (
          <div className="space-y-3 text-gray-400">
            <Upload size={40} className="mx-auto" />
            <p className="text-sm">לחץ לבחירת {currentType.label}</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={currentType.accept}
          onChange={handleFile}
          className="hidden"
        />
      </div>

      {file && (
        <div className="space-y-3">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="input"
            placeholder="הוסף הערה (אופציונלי)"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {uploading ? "מעלה..." : "העלה"}
          </button>
        </div>
      )}

      {done && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center text-green-700 font-medium">
          ✅ הועלה בהצלחה!
        </div>
      )}

      {/* Recent uploads */}
      {recent.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <h3 className="font-semibold text-sm">העלאות אחרונות</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.map((r, i) => {
              const typeLabel: Record<string, string> = {
                body_photo: "📸 תמונת גוף",
                food_photo: "🍽️ תמונת אוכל",
                workout_video: "🎬 סרטון אימון",
              };
              return (
                <div key={i} className="flex justify-between items-center px-4 py-3">
                  <p className="text-sm">{typeLabel[r.type]}</p>
                  <p className="text-xs text-gray-400">
                    {new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit" }).format(new Date(r.uploaded_at))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
