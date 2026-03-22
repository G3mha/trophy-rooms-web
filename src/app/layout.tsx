import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" className={cn("font-sans", geist.variable)}>
        <body style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
          <ApolloWrapper>
            <Header />
            <main style={{ flex: 1 }}>{children}</main>
            <Footer />
          </ApolloWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
