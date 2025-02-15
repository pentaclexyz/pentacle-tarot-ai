import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PrivyProviderConfig from "@/app/providers/privyConfig";
import NavigationWrapper from "@/components/navigationWrapper";
import WagmiProvider from "@/lib/wagmi";

export const metadata: Metadata = {
  title: "Pentacle Tarot",
  description: "Your bff for inner reflection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
      <WagmiProvider>{children}</WagmiProvider>
      </body>
    </html>
  );
}
