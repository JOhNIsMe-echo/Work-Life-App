import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <section className={styles.empty}>
      <span className={styles.icon} aria-hidden="true">
        <Icon size={22} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}
