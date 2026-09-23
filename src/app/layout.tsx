import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import ShellWrapper from "@/components/ShellWrapper";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ruum Ruum Admin — by MoviliaX",
  description: "Consola moderna de operación para Ruum Ruum",
};

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AuthProvider>
          <ShellWrapper>{children}</ShellWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
