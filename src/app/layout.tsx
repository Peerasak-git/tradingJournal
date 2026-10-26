import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import PixelPet from "@/components/PixelPet";
import LockScreen from "@/components/LockScreen";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { AccountProvider } from "@/context/AccountContext";
import { ConfigProvider } from "@/context/ConfigContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CFD Trading Journal",
  description: "Advanced trading journal for CFD traders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AccountProvider>
                <ConfigProvider>
                  <Sidebar />
                  <div className="flex-1 lg:pl-64 min-h-screen">
                    {children}
                  </div>
                  <PixelPet />
                  <LockScreen />
                </ConfigProvider>
              </AccountProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
