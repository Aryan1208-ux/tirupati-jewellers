"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { medusa } from "@/lib/medusa";

interface CartContextType {
  cart: any;
  loading: boolean;
  cartCount: number;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateLineItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  addPromotion: (code: string) => Promise<void>;
  removePromotion: (code: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getCartCount = (cartObj: any) => {
    if (!cartObj || !cartObj.items) return 0;
    return cartObj.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  };

  const initializeCart = async () => {
    try {
      setLoading(true);
      let existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;

      if (existingCartId) {
        try {
          const { cart: retrievedCart } = await medusa.store.cart.retrieve(
            existingCartId,
            { fields: "+items" }
          );
          setCart(retrievedCart);
          setLoading(false);
          return;
        } catch (e) {
          console.warn("Could not retrieve existing cart, creating a new one", e);
          localStorage.removeItem("medusa_cart_id");
        }
      }

      // Create a new cart with INR region if available
      const { regions } = await (medusa.store.region as any).list();
      const inrRegion = regions?.find((r: any) => r.currency_code === 'inr');
      
      const { cart: newCart } = await (medusa.store.cart as any).create(inrRegion ? { region_id: inrRegion.id } : {});
      if (typeof window !== "undefined") {
        localStorage.setItem("medusa_cart_id", newCart.id);
      }
      setCart(newCart);
    } catch (error) {
      console.error("Error initializing cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    let existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    if (existingCartId) {
      try {
        const { cart: retrievedCart } = await medusa.store.cart.retrieve(
          existingCartId,
          { fields: "+items" }
        );
        setCart(retrievedCart);
      } catch (error) {
        console.error("Error refreshing cart:", error);
      }
    }
  };

  const addToCart = async (variantId: string, quantity = 1) => {
    let existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    
    // Ensure cart exists
    if (!existingCartId) {
      await initializeCart();
      existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    }

    if (!existingCartId) return;

    try {
      setLoading(true);
      const { cart: updatedCart } = await medusa.store.cart.createLineItem(
        existingCartId,
        { variant_id: variantId, quantity }
      );
      setCart(updatedCart);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateLineItem = async (lineItemId: string, quantity: number) => {
    const existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    if (!existingCartId) return;

    try {
      setLoading(true);
      const { cart: updatedCart } = await medusa.store.cart.updateLineItem(
        existingCartId,
        lineItemId,
        { quantity }
      );
      setCart(updatedCart);
    } catch (error) {
      console.error("Error updating item quantity:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (lineItemId: string) => {
    const existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    if (!existingCartId) return;

    try {
      setLoading(true);
      await (medusa.store.cart as any).deleteLineItem(
        existingCartId,
        lineItemId
      );
      await refreshCart();
    } catch (error) {
      console.error("Error removing item from cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addPromotion = async (code: string) => {
    const existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    if (!existingCartId) return;

    try {
      setLoading(true);
      await (medusa.store.cart as any).update(existingCartId, {
        promo_codes: [code]
      });
      await refreshCart();
    } catch (error) {
      console.error("Error adding promotion:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removePromotion = async (code: string) => {
    const existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    if (!existingCartId) return;

    try {
      setLoading(true);
      // In v2, you can also just pass the remaining promo codes or use a specific remove method if available
      // The SDK uses update with promo_codes for setting/adding, but we can reset or use medusa.store.cart.removePromotions if available
      try {
        if (typeof (medusa.store.cart as any).removePromotions === "function") {
          await (medusa.store.cart as any).removePromotions(existingCartId, { promo_codes: [code] });
        } else {
          // fallback to clear promotions if there's only one, or filter
          const currentCodes = cart?.promotions?.map((p: any) => p.code) || [];
          const newCodes = currentCodes.filter((c: string) => c !== code);
          await (medusa.store.cart as any).update(existingCartId, { promo_codes: newCodes });
        }
      } catch (e) {
        console.warn("Could not remove promotion via first method", e);
      }
      
      await refreshCart();
    } catch (error) {
      console.error("Error removing promotion:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeCart();
  }, []);

  const cartCount = getCartCount(cart);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        cartCount,
        addToCart,
        updateLineItem,
        removeItem,
        refreshCart,
        addPromotion,
        removePromotion,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
