import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShellServer from "@/app/components/AppShellServer";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("seafarer_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const params = await searchParams;
  const initialEditing = params.edit === "true";

  return (
    <AppShellServer>
      <ProfileClient profile={profile} user={user} initialEditing={initialEditing} />
    </AppShellServer>
  );
}
