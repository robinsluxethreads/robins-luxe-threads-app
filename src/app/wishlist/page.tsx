"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/utils";
import Toast from "@/components/Toast";
import { trackEvent } from "@/lib/analytics";

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const { items: wishlistIds, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (wishlistIds.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistIds]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .in("id", wishlistIds);
    setProducts(data || []);
    setLoading(false);
  };

  const handleRemove = (productId: number) => {
    removeFromWishlist(productId);
    setToast({ show: true, message: "Removed from wishlist", isError: false });
  };

  const handleMoveToCart = (product: Product) => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: product.sizes?.[0] || "One Size",
      emoji: product.emoji,
      image: product.images?.[0] || null,
    });
    removeFromWishlist(product.id);
    trackEvent("add_to_cart", "ecommerce", product.name, product.price);
    setToast({ show: true, message: "Moved to cart!", isError: false });
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ color: "#999", marginTop: 16 }}>Loading wishlist...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#444"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
        <h2 style={styles.emptyTitle}>Your wishlist is empty</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>
          Save items you love and come back to them later.
        </p>
        <Link href="/shop" style={styles.browseBtn}>
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>My Wishlist</h1>
      <p style={{ color: "#888", marginBottom: 32, fontSize: 14 }}>
        {products.length} item{products.length !== 1 ? "s" : ""} saved
      </p>

      <div style={styles.grid}>
        {products.map((product) => (
          <div key={product.id} style={styles.card}>
            <Link href={`/product/${product.id}`} style={{ textDecoration: "none" }}>
              <div style={styles.imageWrapper}>
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      height: "100%",
                      fontSize: 48,
                      background: "#111",
                    }}
                  >
                    {product.emoji || "---"}
                  </div>
                )}
              </div>
            </Link>
            <div style={styles.cardBody}>
              <p style={styles.category}>{product.category}</p>
              <h3 style={styles.productName}>{product.name}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={styles.price}>{formatPrice(product.price)}</span>
                {product.old_price && (
                  <span style={styles.oldPrice}>{formatPrice(product.old_price)}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleMoveToCart(product)}
                  style={styles.moveToCartBtn}
                >
                  Move to Cart
                </button>
                <button
                  onClick={() => handleRemove(product.id)}
                  style={styles.removeBtn}
                  title="Remove from wishlist"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        isError={toast.isError}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "100px 16px 60px",
  },
  pageTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    color: "#c9a84c",
    marginBottom: 4,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 24,
  },
  card: {
    background: "#1a1a1a",
    borderRadius: 12,
    border: "1px solid #2a2a2a",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  imageWrapper: {
    aspectRatio: "3/4",
    overflow: "hidden",
    background: "#111",
  },
  cardBody: {
    padding: 16,
  },
  category: {
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "1.5px",
    color: "#c9a84c",
    margin: "0 0 4px",
  },
  productName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#ededed",
    margin: "0 0 8px",
    fontFamily: "'Poppins', sans-serif",
  },
  price: {
    fontSize: 16,
    fontWeight: 700,
    color: "#c9a84c",
  },
  oldPrice: {
    fontSize: 13,
    textDecoration: "line-through",
    color: "#666",
  },
  moveToCartBtn: {
    flex: 1,
    padding: "10px 16px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  removeBtn: {
    padding: "10px 12px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#888",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: 20,
  },
  emptyTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    color: "#ededed",
    margin: "16px 0 8px",
  },
  browseBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  },
  loadingContainer: {
    minHeight: "calc(100vh - 64px)",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "3px solid #222",
    borderTop: "3px solid #c9a84c",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};
