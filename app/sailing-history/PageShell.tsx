import AppShellServer from "@/app/components/AppShellServer";
import styles from "./PageShell.module.css";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShellServer>
      <div className={styles.shell}>{children}</div>
    </AppShellServer>
  );
}
