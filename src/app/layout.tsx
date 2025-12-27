import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ApolloWrapper } from "@/lib/apollo-wrapper";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trophy Rooms - Nintendo Switch Achievement Tracker",
  description: "Track your Nintendo Switch game achievements and trophies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ApolloWrapper>
            <Header />
            <main>{children}</main>
          </ApolloWrapper>
        </body>
      </html>
    </ClerkProvider>
  );
}
