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
import { Geist, Anton, Yellowtail } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});
const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const yellowtail = Yellowtail({ weight: "400", subsets: ["latin"], variable: "--font-script" });

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
    <html lang="en" className={cn("font-sans", geist.variable, anton.variable, yellowtail.variable)}>
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
