"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Category, CATEGORIES } from "@/types";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface Props {
  category: Category;
}

export default function AdCreateForm({ category }: Props) {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [dailyBid, setDailyBid] = useState(3);
  const [duration, setDuration] = useState<number>(7);
  const [customDays, setCustomDays] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalCents = dailyBid * 100 * duration;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Rasm 5 MB dan kichik bo'lishi kerak");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setError("");

    // Validations
    if (!title.trim()) return setError("Sarlavha kiriting");
    if (title.length > 60) return setError("Sarlavha 60 belgidan oshmasin");
    if (!url.trim() || !url.startsWith("https://")) return setError("URL https:// bilan boshlanishi kerak");
    if (!imageFile) return setError("Rasm yuklang");
    if (dailyBid < 1) return setError("Minimal kunlik narx $1");
    if (duration < 1) return setError("Minimal davr 1 kun");
    if (duration > 365) return setError("Maksimal davr 365 kun");
    if (description.length > 200) return setError("Tavsif 200 belgidan oshmasin");

    setSubmitting(true);
    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `ads/${firebaseUser.uid}/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const imageURL = await getDownloadURL(snapshot.ref);

      // Create ad document in Firestore
      const adRef = await addDoc(collection(db, "ads"), {
        advertiserUID: firebaseUser.uid,
        title: title.trim(),
        description: description.trim(),
        imageURL,
        destinationURL: url.trim(),
        category,
        dailyBidCents: dailyBid * 100,
        durationDays: duration,
        totalPaidCents: 0,
        status: "pending", // Will go through moderation
        startsAt: null,
        expiresAt: null,
        impressions: 0,
        clicks: 0,
        externalTxId: "",
        paymentMethod: "",
        createdAt: serverTimestamp(),
      });

      // Redirect to pending/moderation page
      router.push(`/ads/${adRef.id}/pending`);
    } catch (err: any) {
      setError("Xato yuz berdi: " + (err?.message || "Qayta urinib ko'ring"));
    } finally {
      setSubmitting(false);
    }
  };

  const catMeta = CATEGORIES[category];

  return (
    <form onSubmit={handleSubmit} className="card rounded-2xl p-6 space-y-6">
      <h3 className="font-semibold text-text text-lg">Reklama ma'lumotlari</h3>

      {error && (
        <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="text-xs text-muted font-medium mb-1.5 block">
          Sarlavha <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kompaniya yoki mahsulot nomi"
          className="input"
          maxLength={60}
          required
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${title.length > 55 ? "text-gold" : "text-muted"}`}>
            {title.length}/60
          </span>
        </div>
      </div>

      {/* Image upload */}
      <div>
        <label className="text-xs text-muted font-medium mb-1.5 block">
          Rasm <span className="text-danger">*</span> <span className="text-muted">(max 5 MB)</span>
        </label>
        {imagePreview ? (
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-code">
            <Image src={imagePreview} alt="preview" fill className="object-cover" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[16/9] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 text-muted hover:border-violet/50 hover:text-text transition-all"
          >
            <Upload size={28} />
            <div className="text-sm">Rasm yuklash uchun bosing</div>
            <div className="text-xs">PNG, JPG, WebP — max 5 MB</div>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />
      </div>

      {/* URL */}
      <div>
        <label className="text-xs text-muted font-medium mb-1.5 block">
          Veb-sayt URL <span className="text-danger">*</span>
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://sizningsayt.uz"
          className="input"
          required
        />
        <p className="text-xs text-muted mt-1">HTTPS bilan boshlangan URL kerak</p>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs text-muted font-medium mb-1.5 block">
          Qisqa tavsif <span className="text-muted">(ixtiyoriy)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kompaniya yoki mahsulot haqida qisqacha..."
          className="input resize-none"
          rows={3}
          maxLength={200}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${description.length > 180 ? "text-gold" : "text-muted"}`}>
            {description.length}/200
          </span>
        </div>
      </div>

      {/* Daily bid */}
      <div>
        <label className="text-xs text-muted font-medium mb-1.5 block">
          Kunlik narx (USD) <span className="text-danger">*</span>
        </label>
        <div className="flex items-center gap-3">
          <span className="text-muted text-lg">$</span>
          <input
            type="number"
            value={dailyBid}
            onChange={(e) => setDailyBid(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            className="input w-32"
            required
          />
          <span className="text-muted text-sm">/kun</span>
        </div>
        <p className="text-xs text-muted mt-1">Minimal $1/kun. Ko'proq to'lagan — yuqoriroq o'rin.</p>
      </div>

      {/* Duration */}
      <div>
        <label className="text-xs text-muted font-medium mb-3 block">
          Davr <span className="text-danger">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {([7, 14, 30] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDuration(d); setIsCustom(false); setCustomDays(""); }}
              className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                !isCustom && duration === d
                  ? "border-violet bg-violet/10 text-violet-light"
                  : "border-border text-muted hover:border-violet/40"
              }`}
            >
              {d} kun
              <div className={`text-xs font-normal mt-0.5 ${!isCustom && duration === d ? "text-violet-light/70" : "text-muted/60"}`}>
                ${dailyBid * d}
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setIsCustom(true); setCustomDays(""); }}
            className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
              isCustom
                ? "border-violet bg-violet/10 text-violet-light"
                : "border-border text-muted hover:border-violet/40"
            }`}
          >
            O'zim belgilayman
            <div className={`text-xs font-normal mt-0.5 ${isCustom ? "text-violet-light/70" : "text-muted/60"}`}>
              {isCustom && customDays ? `$${dailyBid * parseInt(customDays)}` : "necha kun?"}
            </div>
          </button>
        </div>
        {isCustom && (
          <div className="flex items-center gap-2 mt-3">
            <input
              type="number"
              min={1}
              max={365}
              value={customDays}
              onChange={(e) => {
                const val = e.target.value;
                setCustomDays(val);
                const n = parseInt(val);
                if (!isNaN(n) && n >= 1) setDuration(n);
              }}
              placeholder="Kunlar sonini kiriting (1–365)"
              className="flex-1 px-4 py-2.5 bg-code border border-border rounded-xl text-sm text-text placeholder:text-muted focus:outline-none focus:border-violet"
            />
            <span className="text-sm text-muted whitespace-nowrap">kun</span>
          </div>
        )}
      </div>

      {/* Total summary */}
      <div className="bg-code rounded-xl p-4 border border-border">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">Toifa</span>
          <span className="text-text">{catMeta.emoji} {catMeta.label}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">Kunlik narx</span>
          <span className="text-text">${dailyBid}/kun</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted">Davr</span>
          <span className="text-text">{duration} kun</span>
        </div>
        <div className="border-t border-border pt-2 mt-2 flex justify-between">
          <span className="font-semibold text-text">Jami (tasdiqlangandan keyin)</span>
          <span className="font-bold text-xl text-emerald">${dailyBid * duration}</span>
        </div>
      </div>

      <div className="bg-violet/5 border border-violet/20 rounded-xl p-4 text-sm text-muted">
        <strong className="text-text">Eslatma:</strong> Reklama avval AI tomonidan tekshiriladi (30–60 soniya).
        Tasdiqlangandan keyingina to'lov olinadi. Rad etilgan reklama uchun hech qanday to'lov yo'q.
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full text-base py-4"
      >
        {submitting ? "Yuborilmoqda..." : "Moderatsiyaga yuborish →"}
      </button>
    </form>
  );
}
