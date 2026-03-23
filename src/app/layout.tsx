import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "CER 2 - Sistema de Gestão de Reabilitação",
  description: "Sistema especializado em gestão de prontuários, filas de espera e absenteísmo para o Centro Especializado em Reabilitação.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${nunitoSans.variable} antialiased`}>
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
