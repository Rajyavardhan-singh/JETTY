import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import CurrencyClient from "./CurrencyClient";

export default async function CurrencyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <AppShellServer>
      <CurrencyClient />
    </AppShellServer>
  );
}
