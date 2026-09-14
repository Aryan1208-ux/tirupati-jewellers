import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import LiveGoldRate from "@/components/LiveGoldRate";
import { CartProvider } from "@/context/CartContext";
import OfferPopup from "@/components/OfferPopup";
import OfferBanner from "@/components/OfferBanner";

export const metadata: Metadata = {
  title: "Tirupati Jewellers | Luxury Gold, Diamond & Bridal Jewellery",
  description: "Welcome to Tirupati Jewellers. Explore 100% BIS 916 Hallmarked Gold, IGI Certified Natural Diamonds, Royal Bridal Sets, and Custom Heirlooms. Trusted for over 35 years.",
  keywords: "Tirupati Jewellers, Tirupati Jewellery, Gold Jewellery, Diamond Choker, Polki Jewellery, Bridal Jewellery Set, 22K Gold, 24K Gold, Solitaire Ring, Temple Jewellery",
  authors: [{ name: "Tirupati Jewellers" }],
  openGraph: {
    title: "Tirupati Jewellers | Luxury Gold & Diamond Jewellery",
    description: "Discover handcrafted royal gold and certified diamond collections at Tirupati Jewellers.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col font-serif bg-cream text-charcoal selection:bg-gold selection:text-black">
        <CartProvider>
          <OfferBanner />
          <LiveGoldRate />
          <Header />
          <OfferPopup />
          <main className="flex-grow">
            {children}
          </main>
          <WhatsAppButton />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
