import React from "react";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
  }>;
}

async function getProducts() {
  try {
    const res = await fetch("http://localhost:9000/store/products?limit=100", {
      next: { revalidate: 10 },
      headers: {
        "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const activeCategory = params.category?.toLowerCase() || "all";
  const searchQuery = params.search?.toLowerCase() || "";

  const allProducts = await getProducts();

  // Filter products based on category and search query
  const filteredProducts = allProducts.filter((product: any) => {
    const title = product.title?.toLowerCase() || "";
    const description = product.description?.toLowerCase() || "";
    const handle = product.handle?.toLowerCase() || "";

    const matchesSearch =
      !searchQuery ||
      title.includes(searchQuery) ||
      description.includes(searchQuery) ||
      handle.includes(searchQuery);

    let matchesCategory = true;
    if (activeCategory !== "all") {
      if (activeCategory === "rings") {
        matchesCategory = title.includes("ring") || handle.includes("t-shirt");
      } else if (activeCategory === "necklaces") {
        matchesCategory = title.includes("necklace") || handle.includes("sweatshirt");
      } else if (activeCategory === "earrings") {
        matchesCategory = title.includes("earring") || handle.includes("sweatpants");
      } else if (activeCategory === "bracelets") {
        matchesCategory = title.includes("bracelet") || handle.includes("shorts");
      }
    }

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { label: "All Masterpieces", value: "all" },
    { label: "Solitaire Rings", value: "rings" },
    { label: "Chokers & Necklaces", value: "necklaces" },
    { label: "Temple & Diamond Earrings", value: "earrings" },
    { label: "Bracelets & Kadas", value: "bracelets" },
  ];

  return (
    <div className="bg-cream min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Editorial Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="font-sans text-[11px] tracking-[0.35em] uppercase text-gold-dark font-bold mb-3">
            TIRUPATI HAUTE JOAILLERIE CATALOGUE
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-normal text-charcoal mb-4">
            High Jewellery Catalogue
          </h1>
          <div className="w-20 h-[1px] bg-gold mx-auto mb-4" />
          <p className="font-serif text-base text-charcoal/75 leading-relaxed">
            Discover our curated treasury of handcrafted gold, natural diamond, and precious gemstone jewellery.
          </p>
        </div>

        {/* Luxury Category Filter Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 font-sans text-xs uppercase tracking-[0.18em]">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <Link
                key={cat.value}
                href={cat.value === "all" ? "/shop" : `/shop?category=${cat.value}`}
                className={`px-6 py-3 border transition-all duration-300 font-semibold ${
                  isActive
                    ? "bg-[#0a0a0a] text-gold-light border-gold shadow-lg"
                    : "bg-white text-charcoal border-cream-dark hover:border-gold hover:text-gold-dark"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Search status */}
        {searchQuery && (
          <div className="mb-8 text-center text-xs font-sans text-charcoal-light">
            Showing results for query: <span className="font-semibold text-charcoal">"{searchQuery}"</span>
            <Link href="/shop" className="ml-3 text-gold font-bold hover:underline">
              Clear Filter
            </Link>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white border border-cream-dark max-w-xl mx-auto p-8 shadow-sm">
            <h3 className="font-display text-2xl text-charcoal mb-2">No Jewellery Found</h3>
            <p className="font-serif text-sm text-charcoal/75 mb-6">
              We could not find items matching your criteria. Explore our full high jewellery collection.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-[#0a0a0a] text-gold px-8 py-3 text-xs uppercase tracking-widest font-sans font-bold hover:bg-gold hover:text-black transition-colors"
            >
              View All Masterpieces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
