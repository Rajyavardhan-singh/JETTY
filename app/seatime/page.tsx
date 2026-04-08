import AppShellServer from "@/app/components/AppShellServer";
import SeaTimeClient from "./SeaTimeClient";

export default function SeaTimeCalculatorPage() {
  return (
    <AppShellServer>
      <SeaTimeClient />
    </AppShellServer>
  );
}
