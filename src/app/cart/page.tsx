"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const subtotal = getCartTotal();
  const shipping = subtotal >= 5000 ? 0 : 99;
  const tax = 0;
  const total = subtotal + shipping + tax;

  const handleCheckout = () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
        </svg>
        <h2 style={styles.emptyTitle}>Your cart is empty</h2>
        <p style={{ color: "#666", marginBottom: 24 }}>Looks like you haven&apos;t added anything yet.</p>
        <Link href="/shop" style={styles.continueBtn}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.pageTitle}>Shopping Cart</h1>

      <div style={styles.grid} className="cart-grid">
        {/* Cart Items */}
        <div style={styles.itemsSection}>
          {items.map((item) => (
            <div key={`${item.productId}-${item.size}`} style={styles.cartItem}>
              {/* Image / Emoji */}
              <div style={styles.itemImage}>
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 36 }}>{item.emoji || "👗"}</span>
                )}
              </div>

              {/* Details */}
              <div style={styles.itemDetails}>
                <h3 style={styles.itemName}>{item.name}</h3>
                <p style={styles.itemSize}>Size: {item.size}</p>
                <p style={styles.itemPrice}>{formatPrice(item.price)}</p>

                {/* Quantity Controls */}
                <div style={styles.qtyRow}>
                  <button
                    onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                    style={styles.qtyBtn}
                  >
                    -
                  </button>
                  <span style={styles.qtyValue}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                    style={styles.qtyBtn}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Item Total & Remove */}
              <div style={styles.itemEnd}>
                <p style={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</p>
                <button
                  onClick={() => removeFromCart(item.productId, item.size)}
                  style={styles.removeBtn}
                  title="Remove item"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <Link href="/shop" style={styles.continueLink}>
            &larr; Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div style={styles.summaryCard}>
          <h2 style={styles.summaryTitle}>Order Summary</h2>

          <div style={styles.summaryRow}>
            <span style={{ color: "#999" }}>Subtotal</span>
            <span style={{ color: "#ededed" }}>{formatPrice(subtotal)}</span>
          </div>

          <div style={styles.summaryRow}>
            <span style={{ color: "#999" }}>Shipping</span>
            <span style={{ color: shipping === 0 ? "#2ecc71" : "#ededed" }}>
              {shipping === 0 ? "FREE" : formatPrice(shipping)}
            </span>
          </div>

          {subtotal < 5000 && (
            <p style={{ color: "#c9a84c", fontSize: 12, margin: "4px 0 8px" }}>
              Add {formatPrice(5000 - subtotal)} more for free shipping
            </p>
          )}

          <div style={styles.summaryRow}>
            <span style={{ color: "#999" }}>Tax</span>
            <span style={{ color: "#ededed" }}>{formatPrice(tax)}</span>
          </div>

          <div style={styles.divider} />

          <div style={styles.summaryRow}>
            <span style={{ color: "#ededed", fontWeight: 700, fontSize: 16 }}>Total</span>
            <span style={{ color: "#c9a84c", fontWeight: 700, fontSize: 18 }}>
              {formatPrice(total)}
            </span>
          </div>

          <button onClick={handleCheckout} style={styles.checkoutBtn}>
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "100px 16px 60px",
  },
  pageTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    color: "#c9a84c",
    marginBottom: 32,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 24,
  },
  itemsSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  cartItem: {
    display: "flex",
    gap: 16,
    padding: 20,
    background: "#111",
    borderRadius: 12,
    border: "1px solid #222",
    alignItems: "flex-start",
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    background: "#1a1a1a",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  itemDetails: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 600,
    color: "#ededed",
    margin: 0,
    fontFamily: "'Playfair Display', serif",
  },
  itemSize: {
    fontSize: 13,
    color: "#888",
    margin: "4px 0",
  },
  itemPrice: {
    fontSize: 14,
    color: "#c9a84c",
    margin: 0,
  },
  qtyRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "1px solid #333",
    background: "#1a1a1a",
    color: "#ededed",
    fontSize: 16,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },
  qtyValue: {
    fontSize: 14,
    color: "#ededed",
    minWidth: 20,
    textAlign: "center" as const,
  },
  itemEnd: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 8,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 600,
    color: "#ededed",
    margin: 0,
  },
  removeBtn: {
    background: "transparent",
    border: "none",
    color: "#666",
    cursor: "pointer",
    padding: 4,
    transition: "color 0.2s",
  },
  continueLink: {
    color: "#c9a84c",
    fontSize: 14,
    textDecoration: "none",
    marginTop: 8,
    display: "inline-block",
  },
  summaryCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 12,
    padding: 24,
    alignSelf: "start",
  },
  summaryTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    color: "#ededed",
    margin: "0 0 20px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  divider: {
    height: 1,
    background: "#222",
    margin: "12px 0",
  },
  checkoutBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 16,
    letterSpacing: "0.5px",
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
  continueBtn: {
    padding: "14px 32px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  },
};

