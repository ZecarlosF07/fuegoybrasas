import type { Metadata } from "next";
import localFont from "next/font/local";

import { CartProvider } from "@/features/cart/components/cart-provider";
import { getPublicEnvironment } from "@/lib/env/public";
import { getSiteEnvironment } from "@/lib/env/server";

import "./globals.css";

const brandFont = localFont({
  src: "./fonts/fraunces-latin-variable.woff2",
  weight: "600 700",
  variable: "--font-fraunces",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});
const uiFont = localFont({
  src: "./fonts/manrope-latin-variable.woff2",
  weight: "400 700",
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

getPublicEnvironment();
export const metadata: Metadata = {
  metadataBase: new URL(getSiteEnvironment().APP_SITE_URL),
  title: "Fuego y Brasas",
  description: "Fuego y Brasas. Sabor que une, momentos que quedan.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${brandFont.variable} ${uiFont.variable} min-h-full scroll-pb-[calc(9rem+env(safe-area-inset-bottom))] antialiased`}>
      <body className="min-h-dvh bg-brand-bg font-ui text-base leading-6 text-brand-ink">
        <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-10 focus:m-4 focus:rounded-button focus:bg-brand-surface focus:p-4 focus:outline-2 focus:outline-offset-2 focus:outline-brand-action">
          Saltar al contenido
        </a>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
