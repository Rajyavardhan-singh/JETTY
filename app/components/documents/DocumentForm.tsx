"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import styles from "./DocumentForm.module.css";

export type DocumentFormData = {
  id?: string;
  title: string;
  document_number: string;
  issue_date: string;
  expiry_date: string;
  file_url?: string;
  file_path?: string;
};

interface DocumentFormProps {
  initialData?: DocumentFormData;
}

export default function DocumentForm({ initialData }: DocumentFormProps) {
  const isEditing = !!initialData?.id;
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState<DocumentFormData>(
    initialData || {
      title: "",
      document_number: "",
      issue_date: "",
      expiry_date: "",
    }
  );

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof DocumentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB");
        return;
      }
      setFile(selected);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) throw new Error("Authentication failed. Please log in.");

      if (!form.title.trim()) {
        throw new Error("Document title is required.");
      }

      let finalFileUrl = form.file_url;
      let finalFilePath = form.file_path;

      // Unchanged code path for uploading the file
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("user-documents")
          .upload(filePath, file);

        if (uploadError) throw new Error("Failed to upload document file: " + uploadError.message);

        const { data: publicUrlData } = supabase.storage
          .from("user-documents")
          .getPublicUrl(filePath);

        finalFileUrl = publicUrlData.publicUrl;
        finalFilePath = filePath;
      } else if (!isEditing) {
        throw new Error("Please upload a document file to proceed (Max 10MB).");
      }

      const payload = {
        user_id: user.id,
        title: form.title,
        document_number: form.document_number || null,
        issue_date: form.issue_date || null,
        expiry_date: form.expiry_date || null,
        file_url: finalFileUrl,
        file_path: finalFilePath,
        updated_at: new Date().toISOString(),
      };

      if (isEditing) {
        const { error: updateErr } = await supabase
          .from("user_documents")
          .update(payload)
          .eq("id", initialData!.id)
          .eq("user_id", user.id); // Extra safety wrapper
        if (updateErr) throw new Error(updateErr.message);
      } else {
        const { error: insertErr } = await supabase
          .from("user_documents")
          .insert([payload]);
        if (insertErr) throw new Error(insertErr.message);
      }

      router.push("/documents");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{isEditing ? "Edit Document" : "Register Document"}</h1>
          <p className={styles.subtitle}>
            Manage your critical certifications, passports, and operational documents.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Basic Details</h2>
          <div className={styles.grid}>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Document Title *</label>
              <input
                type="text"
                className={styles.input}
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Indian Passport, COC Class II"
                required
              />
            </div>
            <div className={styles.fieldFull}>
              <label className={styles.label}>Document Number</label>
              <input
                type="text"
                className={styles.input}
                value={form.document_number}
                onChange={(e) => handleChange("document_number", e.target.value)}
                placeholder="e.g., L8374921"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date of Issue</label>
              <input
                type="date"
                className={styles.input}
                value={form.issue_date}
                onChange={(e) => handleChange("issue_date", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Date of Expiry</label>
              <input
                type="date"
                className={styles.input}
                value={form.expiry_date}
                onChange={(e) => handleChange("expiry_date", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>File Upload</h2>
          {file ? (
            <div className={styles.fileChosen}>
              <div className={styles.fileChosenIcon}>
                <span className="msi" style={{ fontSize: "2rem", color: "var(--primary)" }}>description</span>
              </div>
              <div className={styles.fileChosenMain}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <button type="button" onClick={() => setFile(null)} className={styles.clearFileBtn}>
                Remove
              </button>
            </div>
          ) : (
            <div className={styles.uploadArea}>
              <input
                type="file"
                className={styles.hiddenInput}
                accept=".pdf, .png, .jpg, .jpeg"
                onChange={handleFileChange}
              />
              <div className={styles.uploadIcon}>
                <span className="msi" style={{ fontSize: "2.5rem", color: "var(--outline)" }}>cloud_upload</span>
              </div>
              <div className={styles.uploadTitle}>Drag and drop file here</div>
              <div className={styles.uploadSub}>or select files from your device</div>
              <div className={styles.uploadSub} style={{ marginTop: "0.5rem" }}>
                PDF, JPG, PNG (Max 10MB)
              </div>
              {isEditing && form.file_url && (
                <div style={{ marginTop: "1rem", color: "var(--primary)", fontSize: "0.875rem" }}>
                  A file is already uploaded. Uploading a new file will replace it.
                </div>
              )}
            </div>
          )}
        </section>

        <div className={styles.actions}>
          <Link href="/documents" className={styles.btnCancel}>
            Cancel
          </Link>
          <button type="submit" disabled={loading} className={styles.btnSave}>
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Register Document"}
          </button>
        </div>
      </form>
    </div>
  );
}
