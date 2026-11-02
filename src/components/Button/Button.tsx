import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "quiet";
  size?: "sm" | "md";
  children: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
    >
      {children}
    </button>
  );
}
