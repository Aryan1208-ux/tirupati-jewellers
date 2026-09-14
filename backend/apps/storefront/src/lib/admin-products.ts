export interface JewelleryProduct {
  id: string;
  title: string;
  handle: string;
  category: "rings" | "necklaces" | "earrings" | "bracelets" | "bridal";
  purity: string;
  goldWeight?: string;
  diamondWeight?: string;
  price: number;
  badge: "BESTSELLER" | "ROYAL BRIDAL" | "NEW" | "EXCLUSIVE" | "HERITAGE TEMPLE";
  imageUrl: string;
  description: string;
  inStock: boolean;
  createdAt: string;
}

export const initialJewelleryProducts: JewelleryProduct[] = [
  {
    id: "tj-prod-001",
    title: "Tirupati Empress Solitaire Diamond Ring",
    handle: "empress-solitaire-diamond-ring",
    category: "rings",
    purity: "24K Gold • 99.9% Pure",
    goldWeight: "6.8g",
    diamondWeight: "1.50ct VVS1-EF",
    price: 185000,
    badge: "BESTSELLER",
    imageUrl: "/image/luxury/prod_ring.jpg",
    description: "An opulent handcrafted 24K gold ring crowned with a brilliant round solitaire diamond in a six-prong platinum crown.",
    inStock: true,
    createdAt: "2026-08-20T10:00:00Z"
  },
  {
    id: "tj-prod-002",
    title: "Tirupati Royal Emerald & Polki Diamond Choker",
    handle: "royal-emerald-polki-diamond-choker",
    category: "necklaces",
    purity: "22K BIS 916 Hallmarked",
    goldWeight: "54.2g",
    diamondWeight: "4.80ct Uncut Polki",
    price: 345000,
    badge: "ROYAL BRIDAL",
    imageUrl: "/image/luxury/prod_choker.jpg",
    description: "Royal Mughal-inspired choker necklace featuring natural Zambian emeralds, uncut polki diamonds, and south sea pearl droplets.",
    inStock: true,
    createdAt: "2026-08-20T10:05:00Z"
  },
  {
    id: "tj-prod-003",
    title: "Tirupati Imperial Ruby & Temple Gold Jhumkas",
    handle: "imperial-ruby-temple-gold-jhumkas",
    category: "earrings",
    purity: "22K BIS 916 Hallmarked",
    goldWeight: "28.6g",
    diamondWeight: "0.95ct Natural Diamonds",
    price: 142000,
    badge: "HERITAGE TEMPLE",
    imageUrl: "/image/luxury/prod_earrings.jpg",
    description: "Intricate South Indian temple gold jhumkas adorned with Burma rubies, floral filigree, and cascading gold bell droplets.",
    inStock: true,
    createdAt: "2026-08-20T10:10:00Z"
  },
  {
    id: "tj-prod-004",
    title: "Tirupati Eternal Diamond Tennis Bracelet Cuff",
    handle: "eternal-diamond-tennis-bracelet-cuff",
    category: "bracelets",
    purity: "18K Solid Gold",
    goldWeight: "19.4g",
    diamondWeight: "3.20ct Round Cut VVS",
    price: 215000,
    badge: "EXCLUSIVE",
    imageUrl: "/image/luxury/prod_bracelet.jpg",
    description: "A continuous river of brilliant round cut diamonds set in a secure four-prong 18K yellow gold luxury tennis bracelet cuff.",
    inStock: true,
    createdAt: "2026-08-20T10:15:00Z"
  },
  {
    id: "tj-prod-005",
    title: "Tirupati Grand Heritage Bridal Trousseau Set",
    handle: "grand-heritage-bridal-trousseau-set",
    category: "bridal",
    purity: "22K BIS 916 Hallmarked",
    goldWeight: "118.5g",
    diamondWeight: "8.50ct Heritage Polki",
    price: 680000,
    badge: "ROYAL BRIDAL",
    imageUrl: "/image/luxury/bridal.jpg",
    description: "The complete royal bridal set containing the layered choker, matching chandbalis, maang tikka, and solid gold kadas.",
    inStock: true,
    createdAt: "2026-08-20T10:20:00Z"
  },
  {
    id: "tj-prod-006",
    title: "Tirupati Majestic Navratna Gold Necklace",
    handle: "majestic-navratna-gold-necklace",
    category: "necklaces",
    purity: "22K BIS 916 Hallmarked",
    goldWeight: "42.3g",
    diamondWeight: "1.20ct Mixed Gemstones",
    price: 265000,
    badge: "EXCLUSIVE",
    imageUrl: "/image/luxury/necklaces.jpg",
    description: "A spectacular Navratna necklace featuring nine auspicious gemstones handset in pure 22K gold, balancing astrological harmony with royal elegance.",
    inStock: true,
    createdAt: "2026-08-21T10:00:00Z"
  },
  {
    id: "tj-prod-007",
    title: "Tirupati Rose Gold Solitaire Danglers",
    handle: "rose-gold-solitaire-danglers",
    category: "earrings",
    purity: "18K Rose Gold",
    goldWeight: "12.5g",
    diamondWeight: "2.15ct VVS-EF",
    price: 185000,
    badge: "NEW",
    imageUrl: "/image/luxury/earrings.jpg",
    description: "Contemporary 18K rose gold danglers featuring brilliant round solitaires that catch the light effortlessly from every angle.",
    inStock: true,
    createdAt: "2026-08-21T10:15:00Z"
  },
  {
    id: "tj-prod-008",
    title: "Tirupati Vintage Emerald Cut Diamond Ring",
    handle: "vintage-emerald-cut-diamond-ring",
    category: "rings",
    purity: "Platinum & 18K Gold",
    goldWeight: "8.2g",
    diamondWeight: "3.00ct Emerald Cut",
    price: 495000,
    badge: "BESTSELLER",
    imageUrl: "/image/luxury/rings.jpg",
    description: "A breathtaking 3-carat emerald-cut diamond set in a platinum halo with an 18K gold band, offering a perfect blend of vintage charm and modern luxury.",
    inStock: true,
    createdAt: "2026-08-21T10:30:00Z"
  }
];

const STORAGE_KEY = "tirupati_jewellers_admin_products";

export function getStoredJewelleryProducts(): JewelleryProduct[] {
  if (typeof window === "undefined") return initialJewelleryProducts;
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialJewelleryProducts));
    return initialJewelleryProducts;
  }
  try {
    const parsed = JSON.parse(data);
    let currentProducts = Array.isArray(parsed) && parsed.length > 0 ? parsed : initialJewelleryProducts;
    
    // Merge any new hardcoded products that might have been added to initialJewelleryProducts
    // but are missing from localStorage (based on ID)
    let needsUpdate = false;
    initialJewelleryProducts.forEach(initialProd => {
      if (!currentProducts.find((p: JewelleryProduct) => p.id === initialProd.id)) {
        currentProducts.push(initialProd);
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProducts));
    }

    return currentProducts;
  } catch (e) {
    return initialJewelleryProducts;
  }
}

export function saveJewelleryProducts(products: JewelleryProduct[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function addJewelleryProduct(product: Omit<JewelleryProduct, "id" | "handle" | "createdAt">): JewelleryProduct {
  const products = getStoredJewelleryProducts();
  const slug = product.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const newProduct: JewelleryProduct = {
    ...product,
    id: "tj-prod-" + Date.now(),
    handle: slug + "-" + Math.floor(100 + Math.random() * 900),
    createdAt: new Date().toISOString()
  };
  const updated = [newProduct, ...products];
  saveJewelleryProducts(updated);
  return newProduct;
}

export function deleteJewelleryProduct(id: string): boolean {
  const products = getStoredJewelleryProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  saveJewelleryProducts(filtered);
  return true;
}
