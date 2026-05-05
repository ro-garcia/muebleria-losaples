import type { Metadata } from "next";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Los Alpes",
  description: "Mueblería moderna",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-screen flex flex-col bg-white text-black">
        {/* NAVBAR GLOBAL */}
        <Navbar />

        {/* CONTENIDO */}
        <main className="flex-1 mt-[80px]">{children}</main>

        {/* FOOTER GLOBAL */}
        <Footer />
      </body>
    </html>
  );
}
