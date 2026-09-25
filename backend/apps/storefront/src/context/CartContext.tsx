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
            { fields: "+items,+promotions" }
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
          { fields: "+items,+promotions" }
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

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    // Check if already applied
    if (cart?.promotions?.some((p: any) => p.code?.toUpperCase() === cleanCode)) {
      throw new Error(`Coupon "${cleanCode}" is already applied.`);
    }

    try {
      setLoading(true);
      
      const previousCodes = (cart?.promotions?.map((p: any) => p.code) || []).filter(Boolean);

      // We explicitly use update to overwrite any existing manual promo codes.
      // This enforces the "one manual coupon per cart" rule on the frontend.
      let res = await (medusa.store.cart as any).update(existingCartId, {
        promo_codes: [cleanCode],
      });
      let resCart = res.cart;

      // Check if the promotion was actually accepted by Medusa
      const isNowApplied = resCart?.promotions?.some(
        (p: any) => p.code?.toUpperCase() === cleanCode
      );

      if (!isNowApplied) {
        // Rollback to previous codes if the new one was ineligible
        if (previousCodes.length > 0) {
          const rollbackRes = await (medusa.store.cart as any).update(existingCartId, {
            promo_codes: previousCodes,
          });
          // Note: we don't need to setCart here because we throw immediately, 
          // but we want the backend to be restored.
        }
        
        throw new Error(
          `Offer "${cleanCode}" is not eligible for your current cart. Please check the minimum purchase requirement.`
        );
      }

      setCart(resCart);
    } catch (error: any) {
      console.error("Error adding promotion:", error);
      let msg = error?.message || "Failed to apply coupon code.";
      if (msg.includes("does not exist") || msg.includes("not found")) {
        msg = `Coupon "${cleanCode}" is invalid or does not exist.`;
      }
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const removePromotion = async (code: string) => {
    const existingCartId = typeof window !== "undefined" ? localStorage.getItem("medusa_cart_id") : null;
    if (!existingCartId) return;

    const cleanCode = code.trim().toUpperCase();

    try {
      setLoading(true);
      let resCart: any = null;

      if (typeof (medusa.store.cart as any).removePromotions === "function") {
        const res = await (medusa.store.cart as any).removePromotions(existingCartId, {
          promo_codes: [cleanCode],
        });
        resCart = res.cart;
      } else {
        const currentCodes = cart?.promotions?.map((p: any) => p.code) || [];
        const newCodes = currentCodes.filter((c: string) => c.toUpperCase() !== cleanCode);
        const res = await (medusa.store.cart as any).update(existingCartId, {
          promo_codes: newCodes,
        });
        resCart = res.cart;
      }

      setCart(resCart);
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
