import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShipForm from "@/app/components/sailing/ShipForm";
import PageShell from "@/app/sailing-history/PageShell";

export default async function NewShipPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <PageShell>
      <ShipForm userId={user.id} />
    </PageShell>
  );
}
