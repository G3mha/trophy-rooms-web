import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./FormAlert.module.css";

interface FormAlertProps {
  message: string;
  className?: string;
}

export function FormAlert({ message, className }: FormAlertProps) {
  return (
    <div className={cn(styles.container, className)} role="alert">
      <AlertCircle size={16} className={styles.icon} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
