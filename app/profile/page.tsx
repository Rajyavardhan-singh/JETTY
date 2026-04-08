import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("seafarer_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <AppShellServer>
      <ProfileClient profile={profile} user={user} />
    </AppShellServer>
  );
}
