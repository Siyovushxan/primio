"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES, Category } from "@/types";
import Link from "next/link";
import Image from "next/image";

const inp: React.CSSProperties = {
  width: "100%", padding: "12px 14px", borderRadius: 11,
  background: "#160F2A", border: "1px solid #2D1F50",
  color: "#EDE9FE", fontSize: ".9rem", outline: "none", boxSizing: "border-box",
};
const fieldLabel: React.CSSProperties = {
  display: "block", fontSize: ".77rem", fontWeight: 700, color: "#EDE9FE", marginBottom: 8,
};
const card: React.CSSProperties = {
  background: "#1A1230", border: "1px solid #2D1F50", borderRadius: 18,
};
const DURATIONS = [7, 14, 30];
const CAT_KEYS = Object.keys(CATEGORIES) as Category[];

export default function EditAdPage() {
  const { adId } = useParams<{ adId: string }>();
  const router = useRouter();
  const { firebaseUser, userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const [bidCents, setBidCents] = useState(100);
  const [duration, setDuration] = useState(7);
  const [isCustomDur, setIsCustomDur] = useState(false);
  const [customDays, setCustomDays] = useState("");
  const [existingImageURL, setExistingImageURL] = useState("");
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  // Load existing ad
  useEffect(() => {
    if (!adId) return;
    getDoc(doc(db, "ads", adId)).then((snap) => {
      if (!snap.exists()) { router.push("/dashboard"); return; }
      const data = snap.data();
      // Only owner can edit
      if (firebaseUser && data.advertiserUID !== firebaseUser.uid) {
        router.push("/dashboard"); return;
      }
      // Only pending or rejected ads
      if (data.status !== "pending" && data.status !== "rejected") {
        router.push("/dashboard"); return;
      }
      setTitle(data.title || "");
      setDescription(data.description || "");
      setUrl(data.destinationURL || "");
      setCategory(data.category || null);
      setBidCents(data.dailyBidCents || 100);
      const dur = data.durationDays || 7;
      if (DURATIONS.includes(dur)) { setDuration(dur); }
      else { setIsCustomDur(true); setCustomDays(String(dur)); setDuration(dur); }
      setExistingImageURL(data.imageURL || "");
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adId, firebaseUser?.uid]);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) { setError("Faqat rasm fayli yuklang"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Rasm 5 MB dan kichik bo'lsin"); return; }
    setNewImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setNewImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const compressForModeration = (file: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 512;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        URL.revokeObjectURL(img.src);
        resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) return setError("Sarlavha kiriting");
    if (title.length > 60) return setError("Sarlavha 60 belgidan oshmasin");
    if (!url.trim() || !url.startsWith("https://")) return setError("URL https:// bilan boshlanishi kerak");
    if (!category) return setError("Toifa tanlang");
    if (bidCents < 100) return setError("Minimal kunlik narx $1");
    if (description.length > 200) return setError("Tavsif 200 belgidan oshmasin");

    const effectiveDays = isCustomDur ? parseInt(customDays) || 0 : duration;
    if (effectiveDays < 1 || effectiveDays > 365) return setError("Davr 1 dan 365 kungacha bo'lishi kerak");

    if (!firebaseUser) return;
    setSubmitting(true);

    try {
      let imageBase64: string | undefined;
      let imageBase64Mod: string | undefined;
      let imageMimeTypeMod: string | undefined;
      let finalImageURL = existingImageURL;

      // If new image selected, encode original + compressed for moderation
      if (newImageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(newImageFile);
        });
        const compressed = await compressForModeration(newImageFile);
        imageBase64Mod = compressed.base64;
        imageMimeTypeMod = compressed.mimeType;
      }

      // Run AI moderation — compressed rasm bilan (512px, JPEG 0.75)
      const modRes = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageBase64Mod,
          mimeType: imageMimeTypeMod,
          title: title.trim(),
          description: description.trim(),
          destinationURL: url.trim(),
        }),
      });
      const modData = await modRes.json();
      if (!modData.approved) {
        setError("❌ " + (modData.reason || "Moderatsiyadan o'tmadi"));
        return;
      }

      // Upload new image to ImgBB if provided
      if (imageBase64) {
        const imgForm = new FormData();
        imgForm.append("image", imageBase64);
        const imgRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`,
          { method: "POST", body: imgForm }
        );
        const imgData = await imgRes.json();
        if (!imgData.success) throw new Error("Rasm yuklanmadi");
        finalImageURL = imgData.data.url;
      }

      // Update Firestore — keep status as "pending"
      await updateDoc(doc(db, "ads", adId), {
        title: title.trim(),
        description: description.trim(),
        destinationURL: url.trim(),
        category,
        dailyBidCents: bidCents,
        durationDays: effectiveDays,
        imageURL: finalImageURL,
        status: "pending",
        moderationPassed: true,
        updatedAt: serverTimestamp(),
      });

      router.push(`/ads/${adId}/pending`);
    } catch (err: any) {
      setError("Xato: " + (err?.message || "Qayta urinib ko'ring"));
    } finally {
      setSubmitting(false);
    }
  };

  const spent = userProfile?.totalSpentCents || 0;
  const brand = userProfile?.displayName || firebaseUser?.displayName || "?";
  const initial = brand.charAt(0).toUpperCase();
  const totalUSD = (bidCents * (isCustomDur ? parseInt(customDays) || 0 : duration)) / 100;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6D5B8E" }}>Yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0E0B1A", color: "#EDE9FE", fontFamily: "system-ui,sans-serif" }}>
      <style>{`@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}*{box-sizing:border-box}`}</style>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 80, background: "rgba(14,11,26,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid #2D1F50" }}>
        <div style={{ padding: "11px 26px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
              <rect width="100" height="100" rx="24" fill="#7C3AED"/>
              <path d="M24 78L24 24L54 24Q74 24 74 45Q74 64 54 64L40 64L40 78Z" fill="none" stroke="#fff" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"/>
              <circle cx="74" cy="24" r="7" fill="#F59E0B"/>
            </svg>
            <Link href="/dashboard" style={{ fontFamily: "'Unbounded',sans-serif", fontSize: ".85rem", fontWeight: 700, color: "#EDE9FE", textDecoration: "none" }}>PRIMIO</Link>
            <span style={{ padding: "2px 9px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", fontSize: ".66rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#6D5B8E" }}>Tahrirlash</span>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ padding: "7px 13px", borderRadius: 10, background: "#160F2A", border: "1px solid #2D1F50", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700 }}>Jami sarflangan</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".86rem", fontWeight: 600, color: "#FCD34D" }}>${(spent / 100).toFixed(0)}</span>
            </div>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 11px 5px 5px", borderRadius: 100, background: "#160F2A", border: "1px solid #2D1F50", color: "#EDE9FE", textDecoration: "none" }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#7C3AED,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".7rem", fontWeight: 700, color: "#fff" }}>{initial}</span>
              <span style={{ fontSize: ".78rem", fontWeight: 600 }}>{brand}</span>
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 26px 60px", animation: "fade .35s ease both" }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#6D5B8E", fontSize: ".82rem", textDecoration: "none", marginBottom: 20 }}>← Dashboard</Link>

        <div style={{ fontSize: ".72rem", letterSpacing: ".15em", textTransform: "uppercase", color: "#A855F7", fontWeight: 700, marginBottom: 9 }}>REKLAMANI TAHRIRLASH</div>
        <h1 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.7rem", fontWeight: 700, letterSpacing: "-.03em", marginBottom: 6 }}>Reklamani tahrirlash</h1>
        <p style={{ fontSize: ".88rem", color: "#A78BFA", marginBottom: 24, lineHeight: 1.6 }}>O'zgartirilgan ma'lumotlar qayta AI tekshiruvidan o'tadi.</p>

        {error && (
          <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 12, background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.28)", color: "#F87171", fontSize: ".84rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 300px", gap: 16, alignItems: "start" }}>
          {/* LEFT — Form */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Title */}
            <div style={{ ...card, padding: 22 }}>
              <label style={fieldLabel}>Sarlavha</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} style={inp} placeholder="Kompaniya yoki mahsulot nomi" />
              <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>{title.length}/60</div>
            </div>

            {/* Image */}
            <div style={{ ...card, padding: 22 }}>
              <label style={fieldLabel}>Rasm</label>
              <div style={{ marginBottom: 12 }}>
                {(newImagePreview || existingImageURL) && (
                  <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <Image
                      src={newImagePreview || existingImageURL}
                      alt="preview"
                      width={80} height={60}
                      style={{ borderRadius: 10, objectFit: "cover", border: "1px solid #2D1F50" }}
                    />
                    {newImagePreview && (
                      <span style={{ fontSize: ".78rem", color: "#34D399" }}>✓ Yangi rasm tanlandi</span>
                    )}
                    {!newImagePreview && (
                      <span style={{ fontSize: ".78rem", color: "#6D5B8E" }}>Mavjud rasm · yangilash ixtiyoriy</span>
                    )}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "1px dashed #2D1F50", background: "#160F2A", color: "#A78BFA", fontSize: ".82rem", cursor: "pointer" }}
                >
                  {newImageFile ? "Boshqa rasm tanlash" : "Rasmni yangilash"}
                </button>
                <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>PNG, JPG, WebP — max 5 MB</div>
              </div>
            </div>

            {/* URL */}
            <div style={{ ...card, padding: 22 }}>
              <label style={fieldLabel}>Veb-sayt URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} style={{ ...inp, fontFamily: "'JetBrains Mono',monospace" }} placeholder="https://sizningsayt.uz" />
              <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>HTTPS bilan boshlanishi shart</div>
            </div>

            {/* Description */}
            <div style={{ ...card, padding: 22 }}>
              <label style={fieldLabel}>Qisqa tavsif (ixtiyoriy)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                placeholder="Kompaniya yoki mahsulot haqida..."
              />
              <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>{description.length}/200</div>
            </div>

            {/* Category */}
            <div style={{ ...card, padding: 22 }}>
              <label style={fieldLabel}>Toifa</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
                {CAT_KEYS.map((k) => {
                  const c = CATEGORIES[k];
                  const on = category === k;
                  return (
                    <button key={k} onClick={() => setCategory(k)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderRadius: 11, border: `1px solid ${on ? "#7C3AED" : "#2D1F50"}`, background: on ? "rgba(124,58,237,.12)" : "#160F2A", cursor: "pointer", textAlign: "left" }}>
                      <span style={{ fontSize: "1.1rem" }}>{c.emoji}</span>
                      <div>
                        <div style={{ fontSize: ".8rem", fontWeight: 600, color: on ? "#A855F7" : "#EDE9FE" }}>{c.label}</div>
                      </div>
                      {on && <div style={{ marginLeft: "auto", width: 14, height: 14, borderRadius: "50%", background: "#7C3AED" }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bid */}
            <div style={{ ...card, padding: 22 }}>
              <label style={fieldLabel}>Kunlik taklif (USD/kun)</label>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#6D5B8E", fontFamily: "'JetBrains Mono',monospace", fontSize: "1.1rem" }}>$</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={bidCents / 100}
                  onChange={(e) => setBidCents(Math.max(100, Math.round(parseFloat(e.target.value) * 100 || 100)))}
                  style={{ ...inp, width: 140, fontFamily: "'JetBrains Mono',monospace" }}
                />
                <span style={{ fontSize: ".8rem", color: "#6D5B8E" }}>/kun</span>
              </div>
              <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>Ko'proq to'lagan — yuqoriroq o'rin</div>
            </div>

            {/* Duration */}
            <div style={{ ...card, padding: 22 }}>
              <label style={fieldLabel}>Kampaniya davri</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: isCustomDur ? 10 : 0 }}>
                {DURATIONS.map((d) => {
                  const on = !isCustomDur && duration === d;
                  return (
                    <button key={d} onClick={() => { setIsCustomDur(false); setDuration(d); }} style={{ padding: "10px 0", borderRadius: 10, border: `1px solid ${on ? "#7C3AED" : "#2D1F50"}`, background: on ? "rgba(124,58,237,.12)" : "#160F2A", color: on ? "#A855F7" : "#EDE9FE", fontSize: ".88rem", fontWeight: on ? 700 : 500, cursor: "pointer" }}>
                      {d} kun
                    </button>
                  );
                })}
                <button onClick={() => setIsCustomDur(!isCustomDur)} style={{ padding: "10px 0", borderRadius: 10, border: `1px solid ${isCustomDur ? "#7C3AED" : "#2D1F50"}`, background: isCustomDur ? "rgba(124,58,237,.12)" : "#160F2A", color: isCustomDur ? "#A855F7" : "#EDE9FE", fontSize: ".88rem", fontWeight: isCustomDur ? 700 : 500, cursor: "pointer" }}>
                  O'zim belgilayman
                </button>
              </div>
              {isCustomDur && (
                <div style={{ marginTop: 4 }}>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    style={{ ...inp, width: 140, fontFamily: "'JetBrains Mono',monospace" }}
                    placeholder="Kunlar soni"
                  />
                  <div style={{ fontSize: ".74rem", color: "#6D5B8E", marginTop: 6 }}>1 dan 365 kungacha</div>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: "100%", padding: "16px 0", borderRadius: 14, border: "none", background: submitting ? "#4C1D95" : "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", fontSize: "1rem", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", boxShadow: submitting ? "none" : "0 4px 20px rgba(124,58,237,.35)" }}
            >
              {submitting ? "🤖 AI tekshiryapti..." : "Moderatsiyaga yuborish →"}
            </button>
          </div>

          {/* RIGHT — Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...card, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 14 }}>Narx hisobi</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: ".85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#A78BFA" }}>Kunlik taklif</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#FCD34D", fontWeight: 600 }}>${(bidCents / 100).toFixed(2)}/kun</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#A78BFA" }}>Davr</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", color: "#EDE9FE", fontWeight: 600 }}>
                    {isCustomDur ? (parseInt(customDays) || "–") : duration} kun
                  </span>
                </div>
                <div style={{ height: 1, background: "#2D1F50", margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#EDE9FE", fontWeight: 700 }}>Jami</span>
                  <span style={{ fontFamily: "'Unbounded',sans-serif", fontSize: "1.2rem", fontWeight: 700, color: "#34D399" }}>${totalUSD.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ background: "#160F2A", border: "1px solid #2D1F50", borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: ".68rem", letterSpacing: ".12em", textTransform: "uppercase", color: "#6D5B8E", fontWeight: 700, marginBottom: 12 }}>Eslatmalar</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: ".8rem", color: "#A78BFA", lineHeight: 1.55 }}>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#F59E0B" }}>•</span> O'zgartirilgan reklama qayta AI tekshiruvidan o'tadi</div>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>•</span> Tasdiqlangandan so'ng to'lov sahifasiga o'tasiz</div>
                <div style={{ display: "flex", gap: 8 }}><span style={{ color: "#34D399" }}>•</span> Rad etilgan reklama uchun hech qanday to'lov yo'q</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
