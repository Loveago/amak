import "./globals.css";
import { Space_Grotesk, Manrope } from "next/font/google";
import { getSessionUser } from "../lib/session";
import SiteHeader from "../components/site-header";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

export const metadata = {
  title: "AmaBaKinaata Enterprise",
  description: "Ultra-modern mobile data bundle platform for Ghana."
};

export default function RootLayout({ children }) {
  const user = getSessionUser();
  const dashboardHref = user?.role === "ADMIN" ? "/admin/dashboard" : "/agent/dashboard";
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="bg-sand text-ink antialiased">
        <div className="page-glow" aria-hidden />
        <div className="page-noise" aria-hidden />
        <SiteHeader user={user} dashboardHref={dashboardHref} />
        {children}
      </body>
    </html>
  );
}
