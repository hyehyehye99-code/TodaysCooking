import type { ReactNode } from "react";
import styles from "./DialogActions.module.css";

// Accepts both plain buttons and Server Action forms without changing
// their submit, pending, disabled, or destructive-confirmation behavior.
export function DialogActions({ children }: { children: ReactNode }) {
  return <div className={styles.actions}>{children}</div>;
}
