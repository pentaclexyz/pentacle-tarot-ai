import type { Metadata } from "next";
import "./globals.css";
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
