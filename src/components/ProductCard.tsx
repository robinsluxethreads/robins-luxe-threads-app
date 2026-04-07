"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StarRating from "./StarRating";
import Toast from "./Toast";
import { trackEvent } from "@/lib/analytics";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    fetchRating();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const fetchRating = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", product.id);
    if (data && data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      setAvgRating(avg);
      setReviewCount(data.length);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setToast({ show: true, message: "Login to save to wishlist", isError: true });
      return;
    }

    if (wishlisted) {
      removeFromWishlist(product.id);
      setToast({ show: true, message: "Removed from wishlist", isError: false });
    } else {
      addToWishlist(product.id);
      trackEvent("add_to_wishlist", "ecommerce", product.name, product.price);
      setToast({ show: true, message: "Added to wishlist", isError: false });
    }
  };

  const badgeClass = product.badge
    ? product.badge.toLowerCase() === "new"
      ? "badge-new"
      : product.badge.toLowerCase() === "sale"
        ? "badge-sale"
        : product.badge.toLowerCase() === "hot"
          ? "badge-hot"
          : "badge-new"
    : "";

  const imageUrl =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : null;

  return (
    <>
      <Link href={`/product/${product.id}`} className="block">
        <div className="product-card" style={{ position: "relative" }}>
          {/* Image */}
          <div className="image-wrapper" style={{ position: "relative" }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                loading="lazy"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-[#111] text-6xl">
                {product.emoji || "---"}
              </div>
            )}
            {product.badge && (
              <span className={`badge ${badgeClass}`}>{product.badge}</span>
            )}
            {(product.stock_quantity ?? 100) === 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  background: "#e74c3c",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 6,
                  zIndex: 2,
                  letterSpacing: "0.3px",
                }}
              >
                Out of Stock
              </span>
            )}

            {/* Wishlist Heart */}
            <button
              onClick={handleWishlistToggle}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: "50%",
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
                transition: "transform 0.2s",
              }}
              title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={wishlisted ? "#c9a84c" : "none"}
                stroke={wishlisted ? "#c9a84c" : "#fff"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </button>
          </div>

          {/* Info */}
          <div className="p-4">
            <p
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: "#c9a84c" }}
            >
              {product.category}
            </p>
            <h3
              className="text-sm font-medium text-white mb-2 line-clamp-2"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              {product.name}
            </h3>

            {/* Rating */}
            {reviewCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <StarRating rating={Math.round(avgRating)} size="small" />
                <span style={{ fontSize: 11, color: "#888" }}>({reviewCount})</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-base font-bold" style={{ color: "#c9a84c" }}>
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span
                  className="text-sm line-through"
                  style={{ color: "#666" }}
                >
                  {formatPrice(product.old_price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <Toast
        message={toast.message}
        show={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        isError={toast.isError}
      />
    </>
  );
}
