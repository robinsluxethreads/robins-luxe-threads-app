import Link from "next/link";
import type { Product } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
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
    <Link href={`/product/${product.id}`} className="block">
      <div className="product-card">
        {/* Image */}
        <div className="image-wrapper">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-[#111] text-6xl">
              {product.emoji || "👗"}
            </div>
          )}
          {product.badge && (
            <span className={`badge ${badgeClass}`}>{product.badge}</span>
          )}
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
  );
}
