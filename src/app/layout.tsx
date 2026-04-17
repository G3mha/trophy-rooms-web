import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import type { ComponentProps, ReactNode } from "react";
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { AdminModeProvider } from "@/contexts/AdminModeContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminFloatingToolbar } from "@/components/AdminFloatingToolbar";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkProviderProps = clerkPublishableKey
  ? {
      publishableKey: clerkPublishableKey,
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
    }
  : {
      signInUrl: "/sign-in",
      signUpUrl: "/sign-up",
      disableKeyless: true,
      __internal_bypassMissingPublishableKey: true,
    };

export const metadata: Metadata = {
  title: "Trophy Rooms - Cross-Platform Achievement Tracker",
  description: "Track achievements and trophies across retro classics and modern platforms",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider {...(clerkProviderProps as ComponentProps<typeof ClerkProvider>)}>
      <html lang="en" className={cn("font-sans", geist.variable)}>
        <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <ApolloWrapper>
            <AdminModeProvider>
              <Header />
              <main style={{ flex: 1 }}>{children}</main>
              <AdminFloatingToolbar />
              <Footer />
              <Toaster position="bottom-right" />
            </AdminModeProvider>
          </ApolloWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
