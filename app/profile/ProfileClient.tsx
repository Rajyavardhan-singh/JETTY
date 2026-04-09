"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

import {
  RANK_OPTIONS,
  getPrefixFromRank,
  getDepartmentFromRank,
  type Department,
} from "@/lib/rankData";

// --- Types --------------------------------------------------------------------

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  rank: string | null;
  date_of_birth: string | null;
  indos_number: string | null;
  cdc_number: string | null;
  passport_number: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  linkedin_url: string | null;
  personal_website: string | null;
  portfolio_url: string | null;
}

interface Props {
  profile: Profile | null;
  user: User;
  initialEditing?: boolean;
}

const PLACEHOLDER_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBbnjKkDbfJzcxQ0E7Ze36FMaVLJA14AEZ8Zu-ma1Ue6N5SsP2v4lARonaqHZj4L8MjhsQ9zwPDU1wOcOW01Z67oI-1eURax_xCpSMzUrzluOqQh_-8o1N6yaZzOKCTTsnNrY4KMK6-jgWo0iGb2Eh_30gRrEPn0U96XCp3DOxM0sWytMBQw7wxi_02agAj6Tm8fPie0UBI81DaqUSOy1jVaNVCx5rnCahZ79gYhjwUndaXZz1dGHgeu92Kp9NXgFt7L9e-68TeBg_g";

// --- Component ----------------------------------------------------------------

export default function ProfileClient({ profile, user, initialEditing = false }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(initialEditing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [form, setForm] = useState<Profile>({
    id: user.id,
    email: user.email ?? "",
    full_name: profile?.full_name ?? "",
    rank: profile?.rank ?? "",
    date_of_birth: profile?.date_of_birth ?? "",
    indos_number: profile?.indos_number ?? "",
    cdc_number: profile?.cdc_number ?? "",
    passport_number: profile?.passport_number ?? "",
    phone: profile?.phone ?? "",
    address: profile?.address ?? "",
    avatar_url: profile?.avatar_url ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    personal_website: profile?.personal_website ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
  });

  // Track selected department separately so rank list updates instantly
  const [department, setDepartment] = useState<Department | "">(
    getDepartmentFromRank(profile?.rank ?? null)
  );

  function handleChange(field: keyof Profile, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDepartmentChange(dept: Department | "") {
    setDepartment(dept);
    setForm((prev) => ({ ...prev, rank: "" })); // reset rank when dept changes
  }

  // -- Avatar upload ----------------------------------------------------------
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setSaveMsg(`Error: Image must be under ${MAX_MB} MB.`);
      return;
    }

    setUploading(true);
    setSaveMsg(null);
    const supabase = createClient();

    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setSaveMsg("Error uploading image: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data.publicUrl + `?t=${Date.now()}`; // bust cache

    // Persist immediately to DB
    await supabase
      .from("seafarer_profiles")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    setForm((prev) => ({ ...prev, avatar_url: publicUrl }));
    setUploading(false);
    setSaveMsg("Profile picture updated!");
    router.refresh();
  }

  // -- Save profile -----------------------------------------------------------
  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("seafarer_profiles")
      .update({
        full_name: form.full_name,
        rank: form.rank,
        date_of_birth: form.date_of_birth || null,
        indos_number: form.indos_number,
        cdc_number: form.cdc_number,
        passport_number: form.passport_number,
        phone: form.phone,
        address: form.address,
        linkedin_url: form.linkedin_url,
        personal_website: form.personal_website,
        portfolio_url: form.portfolio_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setSaveMsg("Error saving: " + error.message);
    } else {
      setSaveMsg("Profile saved!");
      setIsEditing(false);
      router.refresh();
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  // -- Derived display values -------------------------------------------------
  const prefix = getPrefixFromRank(form.rank || null);
  const displayName = form.full_name || user.email?.split("@")[0] || "Seafarer";
  const avatarSrc = form.avatar_url || PLACEHOLDER_AVATAR;

  // -- Render -----------------------------------------------------------------
  return (
    <div className={styles.profilePage}>
      <div className={styles.contentArea}>
        {/* Feedback banner */}
        {saveMsg && (
          <div
            style={{
              padding: "0.75rem 1rem",
              marginBottom: "1.5rem",
              borderRadius: "0.5rem",
              background: saveMsg.startsWith("Error") ? "rgba(255,75,75,0.12)" : "rgba(91,219,194,0.12)",
              color: saveMsg.startsWith("Error") ? "#ffb4ab" : "var(--secondary)",
              border: `1px solid ${saveMsg.startsWith("Error") ? "rgba(255,75,75,0.3)" : "rgba(91,219,194,0.3)"}`,
              fontSize: "0.875rem",
            }}
          >
            {saveMsg}
          </div>
        )}

        {/* Hero Section */}
        <section className={styles.heroSection}>
          {/* Avatar with upload overlay */}
          <div className={styles.heroAvatarWrapper}>
            <Image
              className={styles.heroAvatar}
              src={avatarSrc}
              alt={displayName}
              width={224}
              height={224}
              unoptimized
            />
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
            {/* Camera overlay badge — bottom-right corner of avatar */}
            <button
              className={styles.cameraBadge}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change profile picture"
              type="button"
              aria-label="Change profile picture"
            >
              {uploading ? (
                <span className="msi" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.125rem)" }}>hourglass_top</span>
              ) : (
                <span className="msi" style={{ fontSize: "clamp(0.875rem, 2.5vw, 1.125rem)" }}>photo_camera</span>
              )}
            </button>
          </div>

          <div className={styles.heroInfo}>
            <div>
              {prefix && <span className={styles.rankTitle}>{prefix}</span>}
              <h2 className={styles.hugeTitle}>{displayName}</h2>
              <p className={styles.roleText}>
                <span className="msi msi-sm" style={{ color: "var(--secondary)", verticalAlign: "middle" }}>anchor</span> {form.rank || "Seafarer"}
              </p>
              <p style={{ fontSize: "0.8125rem", color: "var(--on-surface-variant)", marginTop: "0.5rem" }}>
                {form.email}
              </p>
            </div>
            {/* Show Edit Profile button only when not editing (Save/Cancel are in floating bar) */}
            {!isEditing && (
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                  <span className="msi msi-sm">edit</span> Edit Profile
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Bento Grid */}
        <div className={styles.bentoGrid}>
          {/* Identity Card */}
          <div className={`${styles.card} ${styles.cardSpan2}`}>
            <h3 className={styles.cardTitle}><span className="msi msi-sm" style={{ color: "var(--primary)" }}>badge</span> Identity</h3>
            <div className={styles.gridData}>

              {/* Full Name */}
              <div className={styles.dataItem}>
                <p className={styles.dataLabel}>Full Name</p>
                {isEditing ? (
                  <input
                    className={styles.editInput}
                    value={form.full_name || ""}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Enter full name"
                  />
                ) : (
                  <p className={styles.dataValue}>{form.full_name || <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.875rem" }}>Not set</span>}</p>
                )}
              </div>

              {/* Department + Rank (cascading selects) */}
              <div className={styles.dataItem}>
                <p className={styles.dataLabel}>Department & Rank</p>
                {isEditing ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {/* Department select */}
                    <select
                      className={styles.editSelect}
                      value={department}
                      onChange={(e) => handleDepartmentChange(e.target.value as Department | "")}
                    >
                      <option value="">— Select Department —</option>
                      <option value="Deck">Deck</option>
                      <option value="Engine">Engine</option>
                      <option value="Electrical">Electrical</option>
                    </select>
                    {/* Rank select — only shown when dept is chosen */}
                    {department && (
                      <select
                        className={styles.editSelect}
                        value={form.rank || ""}
                        onChange={(e) => handleChange("rank", e.target.value)}
                      >
                        <option value="">— Select Rank —</option>
                        {RANK_OPTIONS[department].map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    )}
                    {/* Auto-derived prefix preview */}
                    {form.rank && (
                      <p style={{ fontSize: "0.6875rem", color: "var(--secondary)", marginLeft: "0.25rem" }}>
                        Display prefix: <strong>{getPrefixFromRank(form.rank) || "None"}</strong>
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    {department && <p style={{ fontSize: "0.75rem", color: "var(--on-surface-variant)", marginBottom: "0.25rem" }}>{department}</p>}
                    <p className={styles.dataValue}>
                      {form.rank || <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.875rem" }}>Not set</span>}
                    </p>
                  </div>
                )}
              </div>

              {/* Date of Birth */}
              <div className={styles.dataItem}>
                <p className={styles.dataLabel}>Date of Birth</p>
                {isEditing ? (
                  <input
                    className={styles.editInput}
                    type="date"
                    value={form.date_of_birth || ""}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                  />
                ) : (
                  <p className={styles.dataValue}>
                    {form.date_of_birth
                      ? new Date(form.date_of_birth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                      : <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.875rem" }}>Not set</span>
                    }
                  </p>
                )}
              </div>

              {/* Indos Number */}
              <div className={styles.dataItem}>
                <p className={styles.dataLabel}>Indos Number</p>
                {isEditing ? (
                  <input className={styles.editInput} value={form.indos_number || ""} onChange={(e) => handleChange("indos_number", e.target.value)} placeholder="e.g. 24EM..." />
                ) : (
                  <p className={styles.dataValue}>{form.indos_number || <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.875rem" }}>Not set</span>}</p>
                )}
              </div>

              {/* CDC Number */}
              <div className={styles.dataItem}>
                <p className={styles.dataLabel}>Indian CDC Number</p>
                {isEditing ? (
                  <input className={styles.editInput} value={form.cdc_number || ""} onChange={(e) => handleChange("cdc_number", e.target.value)} placeholder="e.g. MUM-1029384" />
                ) : (
                  <p className={styles.dataValue}>{form.cdc_number || <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.875rem" }}>Not set</span>}</p>
                )}
              </div>

              {/* Passport Number */}
              <div className={styles.dataItem}>
                <p className={styles.dataLabel}>Passport Number</p>
                {isEditing ? (
                  <input className={styles.editInput} value={form.passport_number || ""} onChange={(e) => handleChange("passport_number", e.target.value)} placeholder="e.g. Z44920192" />
                ) : (
                  <p className={styles.dataValue}>{form.passport_number || <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.875rem" }}>Not set</span>}</p>
                )}
              </div>

            </div>
          </div>

          {/* Connectivity Card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><span className="msi msi-sm" style={{ color: "var(--primary)" }}>wifi</span> Connectivity</h3>
            <div className={styles.contactList}>
              {[
                { iconName: "phone", label: "Contact Number", field: "phone" as keyof Profile },
                { iconName: "mail", label: "Email", field: "email" as keyof Profile },
                { iconName: "location_on", label: "Address", field: "address" as keyof Profile },
              ].map(({ iconName, label, field }) => (
                <div className={styles.contactItem} key={field}>
                  <div className={styles.contactIconBox}>
                    <span className="msi msi-sm" style={{ color: "var(--on-primary-container)" }}>{iconName}</span>
                  </div>
                  <div className={styles.contactInfo}>
                    <p className={styles.dataLabel}>{label}</p>
                    {isEditing && field !== "email" ? (
                      <input
                        className={styles.editInput}
                        value={(form[field] as string) || ""}
                        onChange={(e) => handleChange(field, e.target.value)}
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    ) : (
                      <p className={styles.contactValue} style={{ whiteSpace: field === "address" ? "normal" : "nowrap" }}>
                        {(form[field] as string) || <span style={{ color: "var(--on-surface-variant)", fontStyle: "italic", fontSize: "0.8125rem" }}>Not set</span>}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Links Section */}
        <section className={styles.card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
            <h3 className={styles.cardTitle} style={{ margin: 0 }}><span className="msi msi-sm" style={{ color: "var(--primary)" }}>link</span> Self-Related Links</h3>
          </div>
          <div className={styles.linksWrapper}>
            {[
              { iconName: "link", iconColor: "rgb(96,165,250)", bg: "rgba(59,130,246,0.15)", label: "LinkedIn", field: "linkedin_url" as keyof Profile },
              { iconName: "language", iconColor: "rgb(52,211,153)", bg: "rgba(16,185,129,0.15)", label: "Personal Website", field: "personal_website" as keyof Profile },
              { iconName: "folder_open", iconColor: "rgb(251,146,60)", bg: "rgba(251,146,60,0.15)", label: "Portfolio", field: "portfolio_url" as keyof Profile },
            ].map(({ iconName, iconColor, bg, label, field }) => (
              <div key={field} className={styles.linkCard}>
                <div className={styles.linkInfo}>
                  <div className={styles.linkIcon} style={{ backgroundColor: bg, color: iconColor }}>
                    <span className="msi msi-md" style={{ color: iconColor }}>{iconName}</span>
                  </div>
                  <div>
                    <p className={styles.linkTitle}>{label}</p>
                    {isEditing ? (
                      <input
                        className={styles.editInput}
                        value={(form[field] as string) || ""}
                        onChange={(e) => handleChange(field, e.target.value)}
                        placeholder="https://..."
                        style={{ marginTop: "0.25rem" }}
                      />
                    ) : (
                      <p className={styles.linkSub}>{(form[field] as string) || "Not set"}</p>
                    )}
                  </div>
                </div>
                {!isEditing && form[field] && (
                  <a href={form[field] as string} target="_blank" rel="noopener noreferrer" style={{ color: "var(--on-surface-variant)" }}>↗</a>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Spacer so floating bar doesn't obscure content */}
        {isEditing && <div style={{ height: "5rem" }} />}
      </div>

      {/* Floating Save / Cancel bar — only visible while editing */}
      {isEditing && (
        <div className={styles.floatingEditBar}>
          <button
            type="button"
            className={styles.floatCancelBtn}
            onClick={() => { setIsEditing(false); setSaveMsg(null); }}
          >
            <span className="msi msi-sm">close</span> Cancel
          </button>
          <button
            type="button"
            className={styles.floatSaveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            <span className="msi msi-sm">save</span>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      )}
    </div>
  );
}
