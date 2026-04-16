"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import type { DocumentFormData } from "@/app/components/documents/DocumentForm";

export default function DocumentList({ initialDocs }: { initialDocs: DocumentFormData[] }) {
  const [docs, setDocs] = useState(initialDocs);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch {
      alert("Failed to copy link.");
    }
    setActiveMenuId(null);
  };

  const handleSend = async (doc: DocumentFormData) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doc.title,
          text: `Check out my document: ${doc.title}`,
          url: doc.file_url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      if (doc.file_url) {
        handleCopyLink(doc.file_url);
      }
    }
    setActiveMenuId(null);
  };

  const handleDelete = async (id: string, filePath: string | undefined) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setActiveMenuId(null);

    setDocs((prev) => prev.filter((d) => d.id !== id));

    try {
      // 1. Delete from storage if filePath exists
      if (filePath) {
        await supabase.storage.from("user-documents").remove([filePath]);
      }
      // 2. Delete from database
      await supabase.from("user_documents").delete().eq("id", id);
      router.refresh();
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Failed to delete document.");
      // Rollback optimistic update
      setDocs(initialDocs); 
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (docs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <span className="msi" style={{ fontSize: "3rem", color: "var(--outline)", fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48" }}>folder_off</span>
        </div>
        <h2 className={styles.emptyTitle}>Digital Vault Empty</h2>
        <p className={styles.emptySub}>
          Register your certificates, passports, and operational documents to maintain them natively with Jetty.
        </p>
        <Link href="/documents/new" className={styles.btnAdd}>
          <span className="msi msi-sm">add</span> Upload Document
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {docs.map((doc) => (
        <div key={doc.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>{doc.title}</h3>
              <p className={styles.cardSubtitle}>
                {doc.document_number ? `#${doc.document_number}` : "No Doc No."}
              </p>
            </div>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Issued</span>
              <span className={styles.metaValue}>{formatDate(doc.issue_date)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Expiring</span>
              <span className={styles.metaValue}>{formatDate(doc.expiry_date)}</span>
            </div>
          </div>

          <div className={styles.cardFooter}>
            {doc.file_url && (
              <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                <span className="msi msi-sm">open_in_new</span> View PDF
              </a>
            )}
          </div>

          {/* 3-Dot Menu */}
          <div className={styles.menuContainer} ref={activeMenuId === doc.id ? menuRef : null}>
            <button className={styles.menuBtn} onClick={(e) => toggleMenu(doc.id!, e)}>
              <span className="msi msi-md">more_vert</span>
            </button>
            {activeMenuId === doc.id && (
              <div className={styles.dropdown}>
                {doc.file_url && (
                  <>
                    <button className={styles.dropdownBtn} onClick={() => handleSend(doc)}>
                      <span className="msi msi-sm">share</span> Send File
                    </button>
                    <button className={styles.dropdownBtn} onClick={() => handleCopyLink(doc.file_url!)}>
                      <span className="msi msi-sm">link</span> Copy Link
                    </button>
                  </>
                )}
                <button 
                  className={styles.dropdownBtn} 
                  onClick={() => router.push(`/documents/${doc.id}/edit`)}
                >
                  <span className="msi msi-sm">edit</span> Edit
                </button>
                <button 
                  className={`${styles.dropdownBtn} ${styles.dropdownDelete}`} 
                  onClick={() => handleDelete(doc.id!, doc.file_path)}
                >
                  <span className="msi msi-sm">delete_outline</span> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
