"use client";

import { useState, useCallback } from "react";
import type { Product } from "@/lib/utils";
import { formatPrice, getWhatsAppLink, getEmailLink } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import ProductCard from "./ProductCard";
import Toast from "./Toast";

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      setToast({ show: true, message: "Please select a size first", isError: true });
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      size: selectedSize || "One Size",
      emoji: product.emoji,
      image: product.images?.[0] || null,
    });
    setToast({ show: true, message: "Added to cart!", isError: false });
  };

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const currentImage = images[selectedImage] || null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setToast({ show: true, message: "Link copied to clipboard!", isError: false });
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(`Check out ${product.name} at Robins Luxe Threads!`);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="fade-in">
            <div
              className="rounded-xl overflow-hidden mb-4"
              style={{
                background: "#111",
                aspectRatio: "3/4",
                border: "1px solid #2a2a2a",
              }}
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-8xl">
                  {product.emoji || "👗"}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all"
                    style={{
                      border: selectedImage === i ? "2px solid #c9a84c" : "1px solid #2a2a2a",
                      opacity: selectedImage === i ? 1 : 0.6,
                    }}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="fade-in" style={{ animationDelay: "0.2s" }}>
            <p
              className="text-sm uppercase tracking-wider mb-2"
              style={{ color: "#c9a84c" }}
            >
              {product.category}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold mb-4 text-white"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-2xl font-bold" style={{ color: "#c9a84c" }}>
                {formatPrice(product.price)}
              </span>
              {product.old_price && (
                <span className="text-lg line-through" style={{ color: "#666" }}>
                  {formatPrice(product.old_price)}
                </span>
              )}
              {product.old_price && (
                <span
                  className="text-sm px-2 py-0.5 rounded"
                  style={{ background: "#ef444420", color: "#ef4444" }}
                >
                  {Math.round(((product.old_price - product.price) / product.old_price) * 100)}% OFF
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mb-8 leading-relaxed" style={{ color: "#999", fontSize: "0.95rem" }}>
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#ccc" }}>
                  Select Size
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? "selected" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              style={{
                width: "100%",
                padding: "16px",
                background: "linear-gradient(135deg, #c9a84c, #b8942e)",
                color: "#0a0a0a",
                border: "none",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 12,
                letterSpacing: "0.5px",
                transition: "opacity 0.2s",
              }}
            >
              Add to Cart
            </button>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <a
                href={getWhatsAppLink(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp flex-1 text-center"
              >
                Order via WhatsApp
              </a>
              <a
                href={getEmailLink(product)}
                className="btn-outline-gold flex-1 text-center"
              >
                Enquire via Email
              </a>
            </div>

            {/* Share */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold mb-3" style={{ color: "#ccc" }}>
                Share
              </h3>
              <div className="flex gap-4">
                <a
                  href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn"
                  title="Share on WhatsApp"
                >
                  WA
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn"
                  title="Share on Facebook"
                >
                  FB
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="share-btn"
                  title="Share on X"
                >
                  X
                </a>
                <button onClick={handleCopyLink} className="share-btn" title="Copy Link">
                  🔗
                </button>
              </div>
            </div>

            {/* SKU */}
            <p className="text-xs" style={{ color: "#555" }}>
              SKU: RLT-{String(product.id).padStart(5, "0")}
            </p>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-20">
            <div className="section-heading">
              <h2>You May Also Like</h2>
              <div className="divider" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      <Toast
        message={toast.message}
        show={toast.show}
        onClose={closeToast}
        isError={toast.isError}
      />
    </>
  );
}
