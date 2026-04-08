"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RANK_OPTIONS } from "@/lib/rankData";
import styles from "./ShipForm.module.css";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PersonnelEntry { role: string; name: string }
export interface DocumentEntry {
  title: string;
  url: string;
  kind: "link" | "pdf";
  size_label?: string;   // e.g. "2.4 MB" — only for PDFs
}

export interface ShipData {
  id?: string;
  vessel_name: string;
  imo_number: string;
  port_of_registry: string;
  vessel_type: string;
  rank_onboard: string;
  company: string;
  salary_amount: string;
  salary_currency: "USD" | "EUR" | "INR";
  sign_on_date: string;
  sign_off_date: string;
  main_engine_type: string;
  main_engine_details: string;
  aux_engine_type: string;
  aux_engine_details: string;
  aux_boiler_type: string;
  aux_boiler_details: string;
  personnel: PersonnelEntry[];
  documents: DocumentEntry[];
  vessel_image_url: string;
  notes: string;
}

const EMPTY: ShipData = {
  vessel_name: "", imo_number: "", port_of_registry: "", vessel_type: "",
  rank_onboard: "", company: "",
  salary_amount: "", salary_currency: "USD",
  sign_on_date: "", sign_off_date: "",
  main_engine_type: "", main_engine_details: "",
  aux_engine_type: "", aux_engine_details: "",
  aux_boiler_type: "", aux_boiler_details: "",
  personnel: [], documents: [],
  vessel_image_url: "", notes: "",
};

const VESSEL_TYPES = [
  "Bulk Carrier", "Oil Tanker", "Chemical Tanker", "Gas Carrier (LNG/LPG)",
  "Container Ship", "General Cargo", "Ro-Ro", "Passenger / Cruise",
  "FPSO", "Offshore / OSV", "Dredger", "Research Vessel", "Other",
];

const ALL_RANKS = Object.values(RANK_OPTIONS).flat();
const CURRENCIES = ["USD", "EUR", "INR"] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId: string;
  initialData?: ShipData;
}

export default function ShipForm({ userId, initialData }: Props) {
  const router = useRouter();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!initialData?.id;

  const [form, setForm] = useState<ShipData>(initialData ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.vessel_image_url ?? "");

  // Personnel state
  const [newPersonRole, setNewPersonRole] = useState("");
  const [newPersonName, setNewPersonName] = useState("");

  // New document (link) state
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  // New document (PDF) title input — file input handles the rest
  const [newPdfTitle, setNewPdfTitle] = useState("");

  // Computed days on board
  const daysOnBoard = (() => {
    if (!form.sign_on_date || !form.sign_off_date) return null;
    const diff = new Date(form.sign_off_date).getTime() - new Date(form.sign_on_date).getTime();
    return Math.max(0, Math.round(diff / 86_400_000));
  })();

  function set<K extends keyof ShipData>(field: K, value: ShipData[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  // ── Vessel image upload ─────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB"); return; }

    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("vessel-images").upload(path, file, { upsert: true });
    if (upErr) { setError("Upload failed: " + upErr.message); setUploading(false); return; }

    const { data } = supabase.storage.from("vessel-images").getPublicUrl(path);
    const url = data.publicUrl + `?t=${Date.now()}`;
    setForm(prev => ({ ...prev, vessel_image_url: url }));
    setPreviewUrl(url);
    setUploading(false);
  }

  // ── PDF document upload ─────────────────────────────────────────────────
  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!newPdfTitle.trim()) { setError("Please enter a title for the document before uploading."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Document must be under 10 MB"); return; }

    setUploadingDoc(true);
    setError(null);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${userId}/${Date.now()}_${safeName}`;

    const { error: upErr } = await supabase.storage.from("vessel-docs").upload(path, file, { upsert: false });
    if (upErr) { setError("Upload failed: " + upErr.message); setUploadingDoc(false); return; }

    const { data } = supabase.storage.from("vessel-docs").getPublicUrl(path);
    const newDoc: DocumentEntry = {
      title: newPdfTitle.trim(),
      url: data.publicUrl,
      kind: "pdf",
      size_label: formatFileSize(file.size),
    };
    setForm(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
    setNewPdfTitle("");
    // Reset file input
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    setUploadingDoc(false);
  }

  // ── Personnel helpers ─────────────────────────────────────────────────────
  function addPersonnel() {
    if (!newPersonRole.trim() || !newPersonName.trim()) return;
    setForm(prev => ({
      ...prev,
      personnel: [...prev.personnel, { role: newPersonRole.trim(), name: newPersonName.trim() }],
    }));
    setNewPersonRole(""); setNewPersonName("");
  }
  function removePersonnel(idx: number) {
    setForm(prev => ({ ...prev, personnel: prev.personnel.filter((_, i) => i !== idx) }));
  }

  // ── Document link helpers ─────────────────────────────────────────────────
  function addLink() {
    if (!newDocTitle.trim() || !newDocUrl.trim()) return;
    const newDoc: DocumentEntry = { title: newDocTitle.trim(), url: newDocUrl.trim(), kind: "link" };
    setForm(prev => ({ ...prev, documents: [...prev.documents, newDoc] }));
    setNewDocTitle(""); setNewDocUrl("");
  }
  function removeDocument(idx: number) {
    setForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }));
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vessel_name.trim()) { setError("Vessel name is required."); return; }
    if (!form.rank_onboard) { setError("Rank onboard is required."); return; }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = form;
    const payload = {
      ...rest,
      sign_on_date: form.sign_on_date || null,
      sign_off_date: form.sign_off_date || null,
      salary_amount: form.salary_amount ? parseFloat(form.salary_amount) : null,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    let newId = form.id;
    if (isEdit) {
      const { error: err } = await supabase.from("sailing_history").update(payload).eq("id", form.id!);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { data, error: err } = await supabase
        .from("sailing_history")
        .insert(payload)
        .select("id")
        .single();
      if (err) { setError(err.message); setSaving(false); return; }
      newId = data.id;
    }

    router.push(`/sailing-history/${newId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Header */}
      <div className={styles.formHeader}>
        <div>
          <span className={styles.breadcrumb}>Registry</span>
          <h2 className={styles.pageTitle}>{isEdit ? "Edit Vessel Entry" : "Add New Vessel"}</h2>
          <p className={styles.pageSubtitle}>Enter vessel specifications and your service details.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" onClick={() => router.back()} className={styles.cancelBtn}>Cancel</button>
          <button type="submit" className={styles.saveBtn} disabled={saving || uploading || uploadingDoc}>
            💾 {saving ? "Saving..." : isEdit ? "Update Ship" : "Save Ship"}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.formGrid}>
        {/* LEFT: Photo + Dates */}
        <div className={styles.leftCol}>
          {/* Photo Upload */}
          <div className={styles.card}>
            <div
              className={styles.photoUploadArea}
              onClick={() => imageInputRef.current?.click()}
              style={{ cursor: "pointer" }}
            >
              {previewUrl ? (
                <Image src={previewUrl} alt="Vessel" fill style={{ objectFit: "cover", borderRadius: "0.5rem" }} unoptimized />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <span className={styles.photoIcon}>
                    <span className="msi msi-lg" style={{ color: "var(--on-surface-variant)" }}>directions_boat</span>
                  </span>
                  <p className={styles.photoLabel}>{uploading ? "Uploading..." : "Upload Vessel Photo"}</p>
                  <p className={styles.photoHint}>JPG or PNG · Max 5 MB</p>
                </div>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />
            </div>
            <div className={styles.photoMeta}>
              <span>Status: {isEdit ? "Update" : "New"}</span>
              <span>{form.imo_number ? `IMO ${form.imo_number}` : "IMO: —"}</span>
            </div>
          </div>

          {/* Sailing Period */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ color: "var(--primary)" }}>📅 Sailing Period</h3>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Sign-on Date</label>
              <input className={styles.input} type="date" value={form.sign_on_date} onChange={e => set("sign_on_date", e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Sign-off Date</label>
              <input className={styles.input} type="date" value={form.sign_off_date} onChange={e => set("sign_off_date", e.target.value)} />
            </div>
            {daysOnBoard !== null && (
              <div className={styles.daysBox}>
                <span className={styles.daysLabel}>Days on Board</span>
                <span className={styles.daysValue}>{daysOnBoard}</span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: All details */}
        <div className={styles.rightCol}>
          {/* Basic Info */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ color: "var(--primary)" }}>ℹ Basic Information</h3>
            <div className={styles.twoColGrid}>
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Ship&apos;s Name *</label>
                <input className={styles.input} placeholder="e.g. MV PACIFIC STAR" value={form.vessel_name} onChange={e => set("vessel_name", e.target.value)} required />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>IMO Number</label>
                <input className={styles.input} placeholder="9 digits" value={form.imo_number} onChange={e => set("imo_number", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Port of Registry</label>
                <input className={styles.input} placeholder="Panama, Singapore..." value={form.port_of_registry} onChange={e => set("port_of_registry", e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Vessel Type</label>
                <select className={styles.input} value={form.vessel_type} onChange={e => set("vessel_type", e.target.value)}>
                  <option value="">— Select Type —</option>
                  {VESSEL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Rank Sailed *</label>
                <select className={styles.input} value={form.rank_onboard} onChange={e => set("rank_onboard", e.target.value)} required>
                  <option value="">— Select Rank —</option>
                  {ALL_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Company</label>
                <input className={styles.input} placeholder="Ship Management Co." value={form.company} onChange={e => set("company", e.target.value)} />
              </div>

              {/* Salary — full width */}
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Basic Monthly Salary</label>
                <div className={styles.salaryRow}>
                  <select
                    className={styles.currencySelect}
                    value={form.salary_currency}
                    onChange={e => set("salary_currency", e.target.value as "USD" | "EUR" | "INR")}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    className={styles.input}
                    style={{ flex: 1 }}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 3500.00"
                    value={form.salary_amount}
                    onChange={e => set("salary_amount", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personnel Sailed With */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ color: "var(--secondary)" }}>👥 Personnel Sailed With</h3>
            {form.personnel.map((p, i) => (
              <div key={i} className={styles.tagRow}>
                <span className={styles.tagRole}>{p.role}</span>
                <span className={styles.tagName}>{p.name}</span>
                <button type="button" onClick={() => removePersonnel(i)} className={styles.removeBtn}>✕</button>
              </div>
            ))}
            <div className={styles.addPersonRow}>
              <input className={styles.input} placeholder="Role (e.g. Captain)" value={newPersonRole} onChange={e => setNewPersonRole(e.target.value)} />
              <input className={styles.input} placeholder="Name" value={newPersonName} onChange={e => setNewPersonName(e.target.value)} />
              <button type="button" onClick={addPersonnel} className={styles.addBtn}>+ Add</button>
            </div>
          </div>

          {/* Ship Particulars */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ color: "var(--tertiary)" }}>⚙ Ship Particulars</h3>
            {[
              { label: "Main Engine", typeField: "main_engine_type" as keyof ShipData, detailField: "main_engine_details" as keyof ShipData, typePh: "e.g. MAN B&W 6S60MC-C", detailPh: "e.g. 15,000 kW @ 105 RPM" },
              { label: "Auxiliary Engine", typeField: "aux_engine_type" as keyof ShipData, detailField: "aux_engine_details" as keyof ShipData, typePh: "e.g. Yanmar 6EY18ALW", detailPh: "e.g. 3 x 800 kWe" },
              { label: "Auxiliary Boiler", typeField: "aux_boiler_type" as keyof ShipData, detailField: "aux_boiler_details" as keyof ShipData, typePh: "e.g. Alfa Laval Mission OL", detailPh: "e.g. 25,000 kg/h" },
            ].map(({ label, typeField, detailField, typePh, detailPh }) => (
              <div key={label} className={styles.particularBlock}>
                <p className={styles.particularLabel}>
                  <span className={styles.dot}></span> {label}
                </p>
                <div className={styles.twoColGrid}>
                  <input className={styles.input} placeholder={typePh} value={form[typeField] as string} onChange={e => set(typeField, e.target.value as never)} />
                  <input className={styles.input} placeholder={detailPh} value={form[detailField] as string} onChange={e => set(detailField, e.target.value as never)} />
                </div>
              </div>
            ))}
          </div>

          {/* Documentations */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle} style={{ color: "var(--primary)" }}>
              <span className="msi msi-sm" style={{ verticalAlign: "middle", marginRight: "6px" }}>folder</span> Documentations
              <span className={styles.cardSubtitle}> — Contract, Ship Particulars, Appraisals</span>
            </h3>

            {/* Existing docs list */}
            {form.documents.map((d, i) => (
              <div key={i} className={styles.tagRow}>
                <span className={styles.docKindBadge} data-kind={d.kind}>
                  {d.kind === "pdf" ? <><span className="msi msi-sm" style={{ verticalAlign: "middle", marginRight: "4px" }}>description</span> PDF</> : <><span className="msi msi-sm" style={{ verticalAlign: "middle", marginRight: "4px" }}>link</span> Link</>}
                </span>
                <span className={styles.tagRole} style={{ minWidth: "auto" }}>{d.title}</span>
                {d.size_label && <span className={styles.sizeLabel}>{d.size_label}</span>}
                <a href={d.url} target="_blank" rel="noopener noreferrer" className={styles.tagName} style={{ color: "var(--primary)", textDecoration: "underline", flex: 1 }}>
                  {d.kind === "pdf" ? "View" : d.url}
                </a>
                <button type="button" onClick={() => removeDocument(i)} className={styles.removeBtn}>✕</button>
              </div>
            ))}

            {/* Add link */}
            <p className={styles.docSectionLabel}>Add External Link</p>
            <div className={styles.addPersonRow}>
              <input className={styles.input} placeholder="Title (e.g. Company Portal)" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} />
              <input className={styles.input} placeholder="https://..." value={newDocUrl} onChange={e => setNewDocUrl(e.target.value)} />
              <button type="button" onClick={addLink} className={styles.addBtn}>+ Add</button>
            </div>

            {/* Upload PDF */}
            <p className={styles.docSectionLabel} style={{ marginTop: "1rem" }}>Upload PDF Document</p>
            <div className={styles.pdfUploadRow}>
              <input
                className={styles.input}
                style={{ flex: 1 }}
                placeholder="Document title (e.g. Ship Particulars)"
                value={newPdfTitle}
                onChange={e => setNewPdfTitle(e.target.value)}
              />
              <button
                type="button"
                className={styles.pdfUploadBtn}
                onClick={() => pdfInputRef.current?.click()}
                disabled={uploadingDoc}
              >
                {uploadingDoc ? "Uploading..." : "📤 Upload PDF"}
              </button>
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf"
                style={{ display: "none" }}
                onChange={handlePdfUpload}
              />
            </div>
            <p className={styles.photoHint} style={{ marginTop: "0.375rem" }}>PDF · Max 10 MB</p>
          </div>

          {/* Notes */}
          <div className={styles.card}>
            <label className={styles.label}>📝 Additional Notes</label>
            <textarea className={styles.textarea} rows={4} placeholder="Record specific vessel quirks, major overhauls, or unique operational procedures..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
      </div>
    </form>
  );
}
