import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clínica Colinas | Tu Salud, Nuestra Prioridad",
  description: "Clínica Colinas ofrece atención médica integral con tecnología de vanguardia y especialistas dedicados.",
};

import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen`}
      >
        <AuthProvider>
          {/* Global Background Layer */}
          <div className="fixed inset-0 -z-50 h-full w-full bg-slate-50/50 dark:bg-zinc-950">
            <div className="absolute top-0 left-0 right-0 h-[500px] w-full bg-gradient-to-b from-[#a1db4b]/10 to-transparent blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-[#a1db4b]/30 blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
              <div className="absolute -right-[10%] top-[10%] h-[600px] w-[600px] rounded-full bg-teal-400/20 blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />
              <div className="absolute left-[20%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-emerald-300/20 blur-[100px] animate-pulse" style={{ animationDuration: '5s' }} />
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_100%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.2),transparent_100%)]" />
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIi8+PC9zdmc+')] pointer-events-none" />
          </div>

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
