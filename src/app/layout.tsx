import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <AuthProvider>
          <ApolloWrapper>
            <AdminModeProvider>
              <Header />
              <main style={{ flex: 1 }}>{children}</main>
              <AdminFloatingToolbar />
              <Footer />
              <Toaster position="bottom-right" />
            </AdminModeProvider>
          </ApolloWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
