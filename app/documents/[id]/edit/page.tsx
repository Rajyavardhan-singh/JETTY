import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import DocumentForm from "@/app/components/documents/DocumentForm";

interface EditDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDocumentPage({ params }: EditDocumentPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: doc } = await supabase
    .from("user_documents")
    .select("*")
    .eq("id", id)
    .single();

  if (!doc || doc.user_id !== user.id) {
    redirect("/documents");
  }

  const initialData = {
    id: doc.id,
    title: doc.title,
    document_number: doc.document_number || "",
    issue_date: doc.issue_date || "",
    expiry_date: doc.expiry_date || "",
    file_url: doc.file_url,
    file_path: doc.file_path,
  };

  return (
    <AppShellServer>
      <DocumentForm initialData={initialData} />
    </AppShellServer>
  );
}
