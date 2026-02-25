import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Practice Fleet Dashboard",
  description: "Fleet analytics and gamification demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body className="flex h-screen min-h-screen overflow-hidden antialiased font-sans">
        <Sidebar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Header />
          <div className="flex-1 overflow-auto bg-white text-primary">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
