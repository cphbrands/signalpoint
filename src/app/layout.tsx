import { UserProvider } from "@/context/firebase-context";
import { ThemeProvider } from "@/context/theme-provider";
import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import TelegramFloat from "@/components/TelegramFloat"; // ⬅️ tilføjet import
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});
const bebas = Bebas_Neue({
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Signal Point — Professional Campaign Management Platform",
  description:
    "Signal Point lets you create and manage SMS campaigns with ease. Upload phone numbers, compose messages, and organize campaigns from an intuitive dashboard. Secure admin panel for exporting numbers and verifying payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bebas.variable} ${dmSans.variable} font-dm antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <UserProvider>{children}</UserProvider>
        </ThemeProvider>

        {/* ⬇️ Flydende Telegram-knap vises på alle sider */}
        <TelegramFloat />
      </body>
    </html>
  );
}