import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import TrackingClient from "./TrackingClient";

export default async function TrackingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <AppShellServer>
      <TrackingClient />
    </AppShellServer>
  );
}
