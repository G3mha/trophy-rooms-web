import { SignIn } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function SignInPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.logo}>🏆</span>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to Trophy Rooms</p>
        </div>
        <SignIn
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: styles.clerkRoot,
              card: styles.clerkCard,
              headerTitle: styles.clerkHeaderTitle,
              headerSubtitle: styles.clerkHeaderSubtitle,
              socialButtonsBlockButton: styles.clerkSocialButton,
              formButtonPrimary: styles.clerkPrimaryButton,
              formFieldInput: styles.clerkInput,
              footerActionLink: styles.clerkLink,
            },
            variables: {
              colorPrimary: "#E60012",
              colorBackground: "#2D2D2D",
              colorText: "#FFFFFF",
              colorTextSecondary: "#A0A0A0",
              colorInputBackground: "#1A1A1A",
              colorInputText: "#FFFFFF",
              borderRadius: "12px",
            },
          }}
        />
      </div>
    </div>
  );
}
