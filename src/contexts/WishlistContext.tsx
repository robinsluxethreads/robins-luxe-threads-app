"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface WishlistContextType {
  items: number[];
  addToWishlist: (productId: number) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  getWishlistCount: () => number;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = "rlt-wishlist";

function loadLocalWishlist(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalWishlist(items: number[]) {
  try {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage full or unavailable
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load wishlist based on auth state
  useEffect(() => {
    if (user) {
      // Logged in: load from Supabase and sync localStorage
      syncWishlist();
    } else {
      // Not logged in: load from localStorage
      setItems(loadLocalWishlist());
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const syncWishlist = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get items from localStorage that may have been added while logged out
      const localItems = loadLocalWishlist();

      // Get existing DB wishlist
      const { data: dbItems } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id);

      const dbProductIds = (dbItems || []).map((w) => w.product_id);

      // Merge: add local items that aren't already in DB
      const toInsert = localItems.filter((id) => !dbProductIds.includes(id));
      if (toInsert.length > 0) {
        await supabase.from("wishlist").insert(
          toInsert.map((product_id) => ({
            user_id: user.id,
            product_id,
          }))
        );
      }

      // Clear localStorage after sync
      localStorage.removeItem(WISHLIST_STORAGE_KEY);

      // Set merged list
      const merged = [...new Set([...dbProductIds, ...localItems])];
      setItems(merged);
    } catch (err) {
      console.error("Wishlist sync error:", err);
      setItems(loadLocalWishlist());
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = useCallback(
    async (productId: number) => {
      setItems((prev) => {
        if (prev.includes(productId)) return prev;
        const updated = [...prev, productId];
        if (!user) saveLocalWishlist(updated);
        return updated;
      });

      if (user) {
        await supabase.from("wishlist").upsert(
          { user_id: user.id, product_id: productId },
          { onConflict: "user_id,product_id" }
        );
      }
    },
    [user]
  );

  const removeFromWishlist = useCallback(
    async (productId: number) => {
      setItems((prev) => {
        const updated = prev.filter((id) => id !== productId);
        if (!user) saveLocalWishlist(updated);
        return updated;
      });

      if (user) {
        await supabase
          .from("wishlist")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
      }
    },
    [user]
  );

  const isInWishlist = useCallback(
    (productId: number) => items.includes(productId),
    [items]
  );

  const getWishlistCount = useCallback(() => items.length, [items]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getWishlistCount,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
