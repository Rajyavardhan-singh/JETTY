import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import DocumentForm from "@/app/components/documents/DocumentForm";

export default async function NewDocumentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShellServer>
      <DocumentForm />
    </AppShellServer>
  );
}
