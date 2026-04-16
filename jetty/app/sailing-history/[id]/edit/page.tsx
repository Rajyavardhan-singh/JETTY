import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShipForm from "@/app/components/sailing/ShipForm";
import PageShell from "@/app/sailing-history/PageShell";

export default async function EditShipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ship } = await supabase
    .from("sailing_history")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!ship) notFound();

  // Normalise every field so ShipForm never receives null as a controlled input value
  const initialData = {
    id: ship.id,
    vessel_name:         ship.vessel_name        ?? "",
    imo_number:          ship.imo_number          ?? "",
    port_of_registry:    ship.port_of_registry    ?? "",
    vessel_type:         ship.vessel_type         ?? "",
    rank_onboard:        ship.rank_onboard        ?? "",
    company:             ship.company             ?? "",
    // salary_amount is numeric in DB — convert to string for the <input type="number">
    salary_amount:       ship.salary_amount != null ? String(ship.salary_amount) : "",
    salary_currency:     (ship.salary_currency ?? "USD") as "USD" | "EUR" | "INR",
    sign_on_date:        ship.sign_on_date        ?? "",
    sign_off_date:       ship.sign_off_date       ?? "",
    main_engine_type:    ship.main_engine_type    ?? "",
    main_engine_details: ship.main_engine_details ?? "",
    aux_engine_type:     ship.aux_engine_type     ?? "",
    aux_engine_details:  ship.aux_engine_details  ?? "",
    aux_boiler_type:     ship.aux_boiler_type     ?? "",
    aux_boiler_details:  ship.aux_boiler_details  ?? "",
    personnel:           Array.isArray(ship.personnel)     ? ship.personnel     : [],
    documents:           Array.isArray(ship.documents)     ? ship.documents     : [],
    vessel_image_url:    ship.vessel_image_url    ?? "",
    notes:               ship.notes               ?? "",
  };

  return (
    <PageShell>
      <ShipForm userId={user.id} initialData={initialData} />
    </PageShell>
  );
}
