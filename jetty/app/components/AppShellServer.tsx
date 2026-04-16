/**
 * AppShellServer — Server Component
 * Fetches auth session + minimal profile data, then renders the client AppShell.
 * Import this on every page that needs the shared nav/app-bar.
 */
import { createClient } from "@/lib/supabase/server";
import AppShell from "./AppShell";

export default async function AppShellServer({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("seafarer_profiles")
      .select("avatar_url, full_name, rank")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  return (
    <AppShell
      user={user ? { id: user.id, email: user.email } : null}
      profile={profile}
    >
      {children}
    </AppShell>
  );
}
