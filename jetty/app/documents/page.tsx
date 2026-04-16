import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import DocumentList from "./DocumentList";
import styles from "./page.module.css";
import type { DocumentFormData } from "@/app/components/documents/DocumentForm";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: rawDocs, error } = await supabase
    .from("user_documents")
    .select("*")
    .order("created_at", { ascending: false });

  // Map to the expected TS format for the form
  const docs: DocumentFormData[] = (rawDocs || []).map(d => ({
    id: d.id,
    title: d.title,
    document_number: d.document_number || "",
    issue_date: d.issue_date || "",
    expiry_date: d.expiry_date || "",
    file_url: d.file_url,
    file_path: d.file_path,
  }));

  return (
    <AppShellServer>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Digital Vault</h1>
            <p className={styles.subtitle}>
              Secure storage for your maritime certifications, identity papers, and vessel clearances.
            </p>
          </div>
          {docs.length > 0 && (
            <Link href="/documents/new" className={styles.btnAdd}>
              <span className="msi msi-sm">add</span> Addition
            </Link>
          )}
        </div>

        <DocumentList initialDocs={docs} />
      </div>
    </AppShellServer>
  );
}
