import React from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import AboutUs from "@/components/AboutUs";

// Fetch products from Medusa Backend (SSR)
async function getFeaturedProducts() {
  try {
    const res = await fetch("http://localhost:9000/store/products?limit=4", {
      next: { revalidate: 10 },
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <div className="bg-cream text-charcoal">
      
      {/* 1. CINEMATIC LUXURY HERO BANNER */}
      <section className="relative min-h-[90vh] bg-[#070707] text-white flex items-center overflow-hidden">
        
        {/* Background Image with Dark Vignette Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/image/luxury/hero.jpg"
            alt="Tirupati Jewellers Royal Bridal Jewellery"
            className="w-full h-full object-cover object-center lg:object-right opacity-45 scale-100"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070707] via-[#070707]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-transparent to-[#070707]/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="max-w-2xl">
            
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-gold/50 bg-[#0a0a0a]/70 backdrop-blur-sm mb-6">
              <span className="text-gold text-xs">👑</span>
              <span className="font-sans text-[10px] sm:text-xs tracking-[0.3em] uppercase text-gold-light font-bold">
                TIRUPATI JEWELLERS • ESTD 1997
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] mb-6 text-white tracking-wide">
              Timeless Elegance, <br />
              <span className="italic font-serif text-gold-light">Royal Splendour.</span>
            </h1>

            {/* Subhead */}
            <p className="font-serif text-base sm:text-lg text-white/80 font-light leading-relaxed mb-10 max-w-xl">
              Welcome to <strong>Tirupati Jewellers</strong>. Discover handcrafted 100% BIS 916 hallmarked 22K/24K gold, certified solitaires, and heirloom bridal jewellery crafted to shine through generations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:gap-6">
              <Link
                href="/shop"
                className="bg-gold hover:bg-gold-light text-[#070707] px-9 py-4 font-sans text-xs tracking-[0.25em] uppercase font-bold text-center transition-all duration-300 shadow-2xl hover:shadow-gold/20"
              >
                Explore High Jewellery
              </Link>
              <a
                href="#video-shopping"
                className="border border-gold/60 bg-gold/10 hover:bg-gold hover:text-black text-gold-light px-8 py-4 font-sans text-xs tracking-[0.22em] uppercase font-bold text-center transition-all duration-300 backdrop-blur-sm"
              >
                📹 Book Video Call Trial
              </a>
            </div>

          </div>
        </div>

      </section>


      {/* 2. PRESTIGE HERITAGE STATS BANNER */}
      <section className="bg-[#0f0f0f] border-y border-gold/20 py-10 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          
          <div className="p-4 border-r border-white/5 last:border-none">
            <p className="font-display text-3xl sm:text-4xl text-gold-light font-bold mb-1">35+</p>
            <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-white/60">Years of Trusted Legacy</p>
          </div>

          <div className="p-4 border-r border-white/5 last:border-none">
            <p className="font-display text-3xl sm:text-4xl text-gold-light font-bold mb-1">100%</p>
            <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-white/60">BIS 916 Hallmarked Gold</p>
          </div>

          <div className="p-4 border-r border-white/5 last:border-none">
            <p className="font-display text-3xl sm:text-4xl text-gold-light font-bold mb-1">50,000+</p>
            <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-white/60">Delighted Families</p>
          </div>

          <div className="p-4">
            <p className="font-display text-3xl sm:text-4xl text-gold-light font-bold mb-1">18</p>
            <p className="font-sans text-[11px] uppercase tracking-[0.25em] text-white/60">Master Craftsmen</p>
          </div>

        </div>
      </section>

      {/* ABOUT US SECTION */}
      <AboutUs />

      {/* 3. CURATED HAUTE COLLECTIONS */}
      <section id="collections" className="py-28 px-4 sm:px-6 lg:px-8 bg-cream">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-dark font-bold mb-3">
              TIRUPATI JEWELLERS EXCLUSIVE SUITES
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-charcoal mb-4">
              Iconic Collections
            </h2>
            <div className="w-20 h-[1px] bg-gold mx-auto mb-4" />
            <p className="font-serif text-base text-charcoal/75 leading-relaxed">
              Explore our masterfully set jewellery suites, sculpted for grand celebrations and eternal moments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* RINGS */}
            <Link href="/shop?category=rings" className="luxury-card group p-5 block">
              <div className="img-zoom-container relative aspect-square bg-[#0a0a0a] mb-6 overflow-hidden">
                <img src="/image/luxury/rings.jpg" alt="Tirupati Jewellers Rings Collection" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-sans text-[10px] text-gold font-bold tracking-[0.2em] uppercase">01 • Solitaire & Polki</span>
                  <h3 className="font-serif text-2xl font-normal text-charcoal mt-1 group-hover:text-gold-dark transition-colors">Rings</h3>
                  <p className="font-sans text-[11px] text-charcoal-light mt-1">Brilliant cut & royal settings</p>
                </div>
                <span className="text-gold text-lg group-hover:translate-x-1.5 transition-transform duration-300">→</span>
              </div>
            </Link>

            {/* NECKLACES */}
            <Link href="/shop?category=necklaces" className="luxury-card group p-5 block">
              <div className="img-zoom-container relative aspect-square bg-[#0a0a0a] mb-6 overflow-hidden">
                <img src="/image/luxury/necklaces.jpg" alt="Tirupati Jewellers Necklaces Collection" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-sans text-[10px] text-gold font-bold tracking-[0.2em] uppercase">02 • Chokers & Haars</span>
                  <h3 className="font-serif text-2xl font-normal text-charcoal mt-1 group-hover:text-gold-dark transition-colors">Necklaces</h3>
                  <p className="font-sans text-[11px] text-charcoal-light mt-1">Regal temple & bridal neckpieces</p>
                </div>
                <span className="text-gold text-lg group-hover:translate-x-1.5 transition-transform duration-300">→</span>
              </div>
            </Link>

            {/* EARRINGS */}
            <Link href="/shop?category=earrings" className="luxury-card group p-5 block">
              <div className="img-zoom-container relative aspect-square bg-[#0a0a0a] mb-6 overflow-hidden">
                <img src="/image/luxury/earrings.jpg" alt="Tirupati Jewellers Earrings Collection" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-sans text-[10px] text-gold font-bold tracking-[0.2em] uppercase">03 • Chandbalis & Jhumkas</span>
                  <h3 className="font-serif text-2xl font-normal text-charcoal mt-1 group-hover:text-gold-dark transition-colors">Earrings</h3>
                  <p className="font-sans text-[11px] text-charcoal-light mt-1">Intricate drops & diamond studs</p>
                </div>
                <span className="text-gold text-lg group-hover:translate-x-1.5 transition-transform duration-300">→</span>
              </div>
            </Link>

            {/* BRACELETS */}
            <Link href="/shop?category=bracelets" className="luxury-card group p-5 block">
              <div className="img-zoom-container relative aspect-square bg-[#0a0a0a] mb-6 overflow-hidden">
                <img src="/image/luxury/bracelets.jpg" alt="Tirupati Jewellers Bracelets Collection" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <span className="font-sans text-[10px] text-gold font-bold tracking-[0.2em] uppercase">04 • Kadas & Tennis Cuffs</span>
                  <h3 className="font-serif text-2xl font-normal text-charcoal mt-1 group-hover:text-gold-dark transition-colors">Bracelets</h3>
                  <p className="font-sans text-[11px] text-charcoal-light mt-1">Solid gold filigree & diamond bangles</p>
                </div>
                <span className="text-gold text-lg group-hover:translate-x-1.5 transition-transform duration-300">→</span>
              </div>
            </Link>

          </div>

        </div>
      </section>


      {/* 4. GRAND ROYAL BRIDAL SHOWCASE */}
      <section id="bridal" className="relative py-28 bg-[#0a0a0a] text-white overflow-hidden border-y border-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 relative">
            <div className="relative border border-gold/40 p-3 bg-[#111111]/80 backdrop-blur-md">
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src="/image/luxury/bridal.jpg"
                  alt="Tirupati Jewellers Royal Bridal Collection"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
            {/* Floating Gold Plaque */}
            <div className="absolute -bottom-6 -right-6 bg-gold-gradient-bg text-[#070707] p-6 shadow-2xl hidden sm:block border border-gold/50">
              <p className="font-display font-bold text-sm tracking-wider uppercase">Tirupati Jewellers</p>
              <p className="font-serif text-xs italic font-semibold">Grand Bridal Trousseau</p>
            </div>
          </div>

          <div className="lg:col-span-6 lg:pl-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-gold text-sm">✦</span>
              <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-light font-bold">
                THE BRIDAL TROUSSEAU
              </span>
            </div>
            
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-white mb-6 leading-tight">
              Tirupati Royal <br />
              <span className="italic font-serif text-gold-light">Bridal Collection</span>
            </h2>

            <p className="font-serif text-base sm:text-lg text-white/80 mb-6 leading-relaxed font-light">
              Crafted for the majestic Indian bride. At <strong>Tirupati Jewellers</strong>, we combine heritage Kundan, uncut Polki diamonds, Zambian emeralds, and 22K hallmarked gold into showstopping bridal heirlooms.
            </p>

            <p className="font-serif text-sm text-white/65 mb-10 leading-relaxed">
              Every bridal set comes with lifetime buyback guarantee, laser certificate of authenticity, and private video styling sessions with our senior jewellery directress.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop?category=necklaces"
                className="bg-gold hover:bg-gold-light text-[#070707] px-8 py-4 font-sans text-xs tracking-[0.2em] uppercase font-bold transition-colors shadow-lg"
              >
                View Bridal Suites
              </Link>
              <a
                href="https://wa.me/919431002445?text=Hello%20Tirupati%20Jewellers!%20I%20would%20like%20to%20schedule%20a%20bridal%20consultation."
                target="_blank"
                rel="noopener noreferrer"
                className="border border-white/30 hover:border-gold text-white hover:text-gold-light px-8 py-4 font-sans text-xs tracking-[0.2em] uppercase font-semibold transition-colors"
              >
                Schedule Bridal Trial
              </a>
            </div>
          </div>

        </div>
      </section>


      {/* 5. LIVE VIDEO CALL SHOPPING (CUSTOMER ATTRACTION TRIGGER) */}
      <section id="video-shopping" className="py-28 px-4 sm:px-6 lg:px-8 bg-[#111111] text-white border-b border-gold/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-gold text-xs">📹</span>
              <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-light font-bold">
                EXPERIENCE FROM ANYWHERE IN THE WORLD
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-normal text-white mb-6 leading-tight">
              Live Video Showroom <br />
              <span className="italic font-serif text-gold-light">& Personal Styling</span>
            </h2>

            <p className="font-serif text-base sm:text-lg text-white/80 mb-6 leading-relaxed font-light">
              Can't visit our showroom in person? Experience Tirupati Jewellers from the comfort of your home with our dedicated 1-on-1 High Definition video shopping service.
            </p>

            <div className="space-y-4 mb-8 font-sans text-xs text-white/80">
              <div className="flex items-center gap-3">
                <span className="text-gold font-bold">✓</span>
                <span>See exact sparkle, stone weight, and hallmarking in 4K resolution</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold font-bold">✓</span>
                <span>Personal stylist demonstrates styling options on mannequin/hand</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold font-bold">✓</span>
                <span>Complimentary insured doorstep delivery with live parcel tracking</span>
              </div>
            </div>

            <a
              href="https://wa.me/919431002445?text=Hello%20Tirupati%20Jewellers!%20I%20would%20like%20to%20book%20a%20Live%20Video%20Call%20Shopping%20Session."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-gold hover:bg-gold-light text-[#070707] px-8 py-4 font-sans text-xs tracking-[0.2em] uppercase font-bold transition-all duration-300 shadow-xl"
            >
              <span>📹</span> Request Video Call Session
            </a>
          </div>

          <div className="relative">
            <div className="border border-gold/40 p-3 bg-[#181818] shadow-2xl">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src="/image/luxury/video_shopping.jpg"
                  alt="Tirupati Jewellers Video Shopping Experience"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* 6. SWARNA NIDHI GOLD SAVINGS PLAN */}
      <section id="savings-plan" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#121212] via-[#1a1710] to-[#121212] text-white border-b border-gold/30">
        <div className="max-w-7xl mx-auto text-center">
          
          <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-light font-bold mb-3">
            SMART GOLD ACCUMULATION
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-normal text-white mb-6">
            Tirupati Swarna Nidhi Gold Scheme
          </h2>
          <p className="font-serif text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-12 font-light">
            Plan for future weddings and festivals smartly. Pay 11 monthly installments and get a bonus contribution from Tirupati Jewellers on your 12th month to buy 100% hallmarked gold jewellery!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-left mb-12">
            
            <div className="p-8 border border-gold/30 bg-[#070707]/60">
              <span className="font-display text-2xl text-gold font-bold mb-2 block">Step 01</span>
              <h4 className="font-sans text-xs uppercase tracking-wider font-bold mb-2">Choose Monthly Amount</h4>
              <p className="font-serif text-sm text-white/70">Start with flexible monthly installments starting from ₹2,000 to ₹50,000.</p>
            </div>

            <div className="p-8 border border-gold/30 bg-[#070707]/60">
              <span className="font-display text-2xl text-gold font-bold mb-2 block">Step 02</span>
              <h4 className="font-sans text-xs uppercase tracking-wider font-bold mb-2">Tirupati Special Bonus</h4>
              <p className="font-serif text-sm text-white/70">Enjoy zero making-charge discounts and special gold rate lock protection.</p>
            </div>

            <div className="p-8 border border-gold/30 bg-[#070707]/60">
              <span className="font-display text-2xl text-gold font-bold mb-2 block">Step 03</span>
              <h4 className="font-sans text-xs uppercase tracking-wider font-bold mb-2">Redeem in Fine Jewellery</h4>
              <p className="font-serif text-sm text-white/70">Redeem across any gold or diamond jewellery item in our collection.</p>
            </div>

          </div>

          <a
            href="https://wa.me/919431002445?text=Hello%20Tirupati%20Jewellers!%20I%20want%20to%20enroll%20in%20the%20Swarna%20Nidhi%20Gold%20Savings%20Plan."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gold hover:bg-gold-light text-[#070707] px-9 py-4 font-sans text-xs tracking-[0.25em] uppercase font-bold transition-colors shadow-2xl"
          >
            Enroll in Swarna Nidhi Scheme
          </a>

        </div>
      </section>


      {/* 7. FEATURED PIECES (DYNAMIC MEDUSA PRODUCTS) */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-cream">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-dark font-bold mb-3">
                TIRUPATI SIGNATURE CREATIONS
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-normal text-charcoal">
                Featured Masterpieces
              </h2>
            </div>
            <Link
              href="/shop"
              className="font-sans text-xs tracking-[0.2em] uppercase font-bold text-gold-dark hover:text-black flex items-center gap-2 transition-colors self-start md:self-auto"
            >
              Explore Complete Catalogue <span>→</span>
            </Link>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16 bg-white border border-cream-dark">
              <p className="font-serif text-lg text-charcoal-light">Loading Tirupati Jewellers Catalogue...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>
      </section>


      {/* 8. ATELIER CRAFTSMANSHIP NARRATIVE */}
      <section id="craftsmanship" className="py-28 px-4 sm:px-6 lg:px-8 bg-white border-t border-cream-dark">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Atelier Photo */}
          <div className="relative">
            <div className="border border-cream-dark p-3 bg-cream">
              <div className="aspect-[4/3] overflow-hidden bg-black">
                <img
                  src="/image/luxury/craftsmanship.jpg"
                  alt="Tirupati Jewellers Master Goldsmith setting diamond"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-gold text-xs">✦</span>
              <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-dark font-bold">
                THE TIRUPATI ATELIER
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-normal text-charcoal mb-6 leading-tight">
              Sculpted by Hand, <br />
              <span className="italic font-serif text-gold-dark">Perfected by Masters.</span>
            </h2>

            <p className="font-serif text-base text-charcoal/80 mb-6 leading-relaxed">
              At <strong>Tirupati Jewellers</strong>, each creation begins with 100% certified conflict-free diamonds and pure 24K bullion. Our master artisans dedicate upwards of 120 hours of microscopic precision to handset every single facet.
            </p>

            <p className="font-serif text-base text-charcoal/80 mb-8 leading-relaxed">
              From hand-carved floral filigree to proprietary comfort-fit prong settings, our jewelry is engineered to feel as extraordinary on the skin as it looks under the lights.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-cream-dark font-sans text-xs text-charcoal">
              <div>
                <p className="font-bold text-sm text-gold-dark mb-1">01. Diamond Grading</p>
                <p className="text-charcoal-light">Individually certified VVS1 clarity & exceptional cuts.</p>
              </div>
              <div>
                <p className="font-bold text-sm text-gold-dark mb-1">02. 24K Purity Standard</p>
                <p className="text-charcoal-light">BIS Hallmarked with laser verified micro-engravings.</p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* 9. BESPOKE SALON & VIP CONCIERGE */}
      <section id="bespoke" className="py-28 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a] text-white border-t border-gold/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div>
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-gold text-xs">👑</span>
              <span className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-light font-bold">
                TIRUPATI PRIVATE LOUNGE
              </span>
            </div>

            <h2 className="font-display text-3xl sm:text-5xl font-normal text-white mb-6 leading-tight">
              Bespoke Jewellery Salon
            </h2>

            <p className="font-serif text-base sm:text-lg text-white/80 mb-6 leading-relaxed font-light">
              Dreaming of a one-of-a-kind engagement ring or a customized family heirloom? Reserve a private session at our flagship salon.
            </p>

            <p className="font-serif text-sm text-white/60 mb-8 leading-relaxed">
              Our lead designers will hand-sketch your concept, curate certified stones directly from the cutting houses, and cast a 3D wax prototype for your personal trial.
            </p>

            <div className="pt-4 mt-2">
              <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/50 font-bold mb-3">
                Direct Salon Line
              </p>
              <a
                href="tel:+919431002445"
                className="group inline-flex items-center gap-5"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-gold/40 bg-gold/5 group-hover:bg-gold transition-colors duration-500 shadow-[0_0_15px_rgba(212,175,55,0.1)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                  <span className="text-gold group-hover:text-[#070707] transition-colors text-lg">✦</span>
                </div>
                <div>
                  <span className="block font-display text-2xl sm:text-3xl text-gold-light group-hover:text-white transition-colors duration-500 tracking-wider">
                    +91 94310 02445
                  </span>
                  <span className="block font-serif text-xs sm:text-sm italic text-white/60 mt-0.5">Available 10 AM - 8 PM IST</span>
                </div>
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="border border-gold/30 p-3 bg-[#141414]">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src="/image/luxury/consultation.jpg"
                  alt="Tirupati Jewellers VIP Consultation Salon"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* 10. PATRON REVIEWS */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-cream">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-20">
            <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-dark font-bold mb-3">
              WORDS OF APPRECIATION
            </p>
            <h2 className="font-display text-3xl sm:text-5xl font-normal text-charcoal mb-4">
              Cherished By Our Patrons
            </h2>
            <div className="w-20 h-[1px] bg-gold mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white border border-cream-dark p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-gold text-base mb-4 tracking-widest">★★★★★</div>
                <p className="font-serif text-lg text-charcoal/90 italic mb-6 leading-relaxed">
                  "The royal bridal choker and earrings for my wedding were breathtaking. The polki diamonds caught every glimmer of light on stage. Tirupati Jewellers is truly unmatched."
                </p>
              </div>
              <div>
                <p className="font-sans text-xs font-bold text-charcoal uppercase tracking-wider">Ananya Singhania</p>
                <p className="font-sans text-[10px] text-charcoal-light uppercase tracking-widest">Bespoke Bridal Suite</p>
              </div>
            </div>

            <div className="bg-white border border-cream-dark p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-gold text-base mb-4 tracking-widest">★★★★★</div>
                <p className="font-serif text-lg text-charcoal/90 italic mb-6 leading-relaxed">
                  "Ordered a custom solitaire engagement ring through video call shopping. The precision, certified stone grading, and service made the experience extraordinary. She said yes immediately!"
                </p>
              </div>
              <div>
                <p className="font-sans text-xs font-bold text-charcoal uppercase tracking-wider">Devendra Verma</p>
                <p className="font-sans text-[10px] text-charcoal-light uppercase tracking-widest">Custom Solitaire Ring</p>
              </div>
            </div>

            <div className="bg-white border border-cream-dark p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-gold text-base mb-4 tracking-widest">★★★★★</div>
                <p className="font-serif text-lg text-charcoal/90 italic mb-6 leading-relaxed">
                  "Three generations of our family have trusted Tirupati Jewellers for our gold and diamond heirlooms. Their hallmarking purity and timeless aesthetic are second to none."
                </p>
              </div>
              <div>
                <p className="font-sans text-xs font-bold text-charcoal uppercase tracking-wider">Meenakshi Kashyap</p>
                <p className="font-sans text-[10px] text-charcoal-light uppercase tracking-widest">Heritage Temple Collection</p>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* 11. VIP NEWSLETTER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#070707] text-white border-t border-gold/30">
        <div className="max-w-4xl mx-auto text-center border border-gold/40 p-10 sm:p-16 bg-[#111111]/90 backdrop-blur-sm">
          <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-light font-bold mb-3">
            TIRUPATI PRIVILEGE CLUB
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-normal text-white mb-4">
            Join the Tirupati Jewellers Circle
          </h2>
          <p className="font-serif text-base text-white/70 max-w-xl mx-auto mb-8 font-light">
            Receive private invitations to confidential high-jewellery exhibitions, festival gold rate offers, and seasonal curated lookbooks.
          </p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email address..."
              required
              className="flex-1 bg-[#181818] border border-white/20 px-5 py-3.5 text-white font-sans text-xs focus:outline-none focus:border-gold"
            />
            <button
              type="submit"
              className="bg-gold hover:bg-gold-light text-[#070707] px-8 py-3.5 font-sans text-xs tracking-[0.2em] uppercase font-bold transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
