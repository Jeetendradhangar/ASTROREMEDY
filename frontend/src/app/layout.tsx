import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative, EB_Garamond } from "next/font/google";
import "./globals.css";
import Hydration from "../components/Hydration";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const cinzelDecorative = Cinzel_Decorative({
  variable: "--font-cinzel-decorative",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AstroRemedy — Celestial Guidance & Genuine Remedies",
  description: "Connect with certified Vedic astrologers for voice consultations and order customized Rudraksh remedies.",
  keywords: ["astrology", "horoscope", "rudraksh", "remedy", "birth chart", "kundli", "vedic astrology"],
};

import ToastContainer from "../components/ToastContainer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${cinzelDecorative.variable} ${ebGaramond.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <div className="noise-overlay"></div>
        <div className="constellation-layer"></div>
        <ToastContainer />
        <Hydration>
          <div className="flex flex-col flex-1 min-h-screen">
            {children}
          </div>
        </Hydration>
      </body>
    </html>
  );
}

