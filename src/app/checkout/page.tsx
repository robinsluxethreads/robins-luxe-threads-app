"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { isValidPhone, isValidPincode, isValidName } from "@/lib/validation";
import ProtectedRoute from "@/components/ProtectedRoute";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface ShippingForm {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface FieldErrors {
  [key: string]: string;
}

function CheckoutContent() {
  const router = useRouter();
  const { items, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ShippingForm>({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const subtotal = getCartTotal();
  const shipping = subtotal >= 5000 ? 0 : 99;
  const total = subtotal + shipping;

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (!isValidName(value)) return "Enter a valid name (min 2 chars, no numbers)";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!isValidPhone(value)) return "Enter a valid 10-digit phone number";
        return "";
      case "address":
        if (!value.trim()) return "Address is required";
        if (value.trim().length < 10) return "Address must be at least 10 characters";
        return "";
      case "city":
        if (!value.trim()) return "City is required";
        return "";
      case "state":
        if (!value.trim()) return "State is required";
        return "";
      case "pincode":
        if (!value.trim()) return "Pincode is required";
        if (!isValidPincode(value)) return "Enter a valid 6-digit pincode";
        return "";
      default:
        return "";
    }
  }, []);

  const handleBlur = (name: string, value: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
  };

  const allFieldsValid =
    isValidName(form.fullName) &&
    isValidPhone(form.phone) &&
    form.address.trim().length >= 10 &&
    form.city.trim().length > 0 &&
    form.state.trim().length > 0 &&
    isValidPincode(form.pincode);

  // Pre-fill from profile
  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("full_name, phone, address, city, state, pincode")
      .eq("id", user.id)
      .single();
    if (data) {
      setForm({
        fullName: data.full_name || user.user_metadata?.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pincode: data.pincode || "",
      });
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items.length, router]);

  const updateField = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Pincode auto-fill
  const handlePincodeChange = async (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    updateField("pincode", digits);

    if (digits.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${digits}`);
        const data = await res.json();
        if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setForm((prev) => ({
            ...prev,
            city: po.District || prev.city,
            state: po.State || prev.state,
          }));
        }
      } catch {
        // Silently fail
      }
    }
  };

  const handlePlaceOrder = async () => {
    // Validate all
    const fields: (keyof ShippingForm)[] = ["fullName", "phone", "address", "city", "state", "pincode"];
    const newErrors: FieldErrors = {};
    const newTouched: Record<string, boolean> = {};
    fields.forEach((f) => {
      newTouched[f] = true;
      const err = validateField(f, form[f]);
      if (err) newErrors[f] = err;
    });
    setTouched(newTouched);
    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;
    if (items.length === 0) return;

    setPlacing(true);
    setError("");

    const orderData = {
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        size: i.size,
        quantity: i.quantity,
        emoji: i.emoji,
        image: i.image,
      })),
      shipping_address: {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
      },
      customer: {
        id: user?.id,
        name: form.fullName,
        email: user?.email || "",
        phone: form.phone,
      },
      subtotal,
      shipping,
      total,
    };

    try {
      if (paymentMethod === "cod") {
        const res = await fetch("/api/place-cod-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to place order");
        clearCart();
        router.push(`/order/${data.order_id}`);
      } else {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create payment order");

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: "Robins Luxe Threads",
          description: "Order Payment",
          order_id: data.razorpay_order_id,
          prefill: {
            name: form.fullName,
            email: user?.email || "",
            contact: form.phone,
          },
          theme: {
            color: "#c9a84c",
          },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              const verifyRes = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
              clearCart();
              router.push(`/order/${verifyData.order_id}`);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Payment verification failed");
              setPlacing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setPlacing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }

    setPlacing(false);
  };

  if (items.length === 0) return null;

  const getInputStyle = (name: string): React.CSSProperties => {
    if (!touched[name]) return styles.input;
    if (fieldErrors[name]) return { ...styles.input, borderColor: "#e74c3c" };
    return { ...styles.input, borderColor: "#2ecc71" };
  };

  return (
    <div style={styles.container}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <h1 style={styles.pageTitle}>Checkout</h1>

      <div style={styles.grid} className="checkout-grid">
        {/* Shipping Form */}
        <div>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Shipping Address</h2>

            <div style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  onBlur={() => handleBlur("fullName", form.fullName)}
                  placeholder="Your full name"
                  style={getInputStyle("fullName")}
                />
                {touched.fullName && fieldErrors.fullName && (
                  <span style={styles.fieldError}>{fieldErrors.fullName}</span>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onBlur={() => handleBlur("phone", form.phone)}
                  placeholder="10-digit mobile number"
                  style={getInputStyle("phone")}
                  maxLength={10}
                />
                {touched.phone && fieldErrors.phone && (
                  <span style={styles.fieldError}>{fieldErrors.phone}</span>
                )}
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  onBlur={() => handleBlur("address", form.address)}
                  placeholder="Street address, apartment, etc."
                  style={getInputStyle("address")}
                />
                {touched.address && fieldErrors.address && (
                  <span style={styles.fieldError}>{fieldErrors.address}</span>
                )}
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    onBlur={() => handleBlur("city", form.city)}
                    placeholder="City"
                    style={getInputStyle("city")}
                  />
                  {touched.city && fieldErrors.city && (
                    <span style={styles.fieldError}>{fieldErrors.city}</span>
                  )}
                </div>
                <div style={{ ...styles.field, flex: 1 }}>
                  <label style={styles.label}>State *</label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    onBlur={() => handleBlur("state", form.state)}
                    placeholder="State"
                    style={getInputStyle("state")}
                  />
                  {touched.state && fieldErrors.state && (
                    <span style={styles.fieldError}>{fieldErrors.state}</span>
                  )}
                </div>
                <div style={{ ...styles.field, flex: 0.7 }}>
                  <label style={styles.label}>Pincode *</label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    onBlur={() => handleBlur("pincode", form.pincode)}
                    placeholder="110001"
                    style={getInputStyle("pincode")}
                    maxLength={6}
                  />
                  {touched.pincode && fieldErrors.pincode && (
                    <span style={styles.fieldError}>{fieldErrors.pincode}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Payment Method</h2>

            <label
              style={{
                ...styles.paymentOption,
                borderColor: paymentMethod === "online" ? "#c9a84c" : "#222",
                background: paymentMethod === "online" ? "rgba(201,168,76,0.08)" : "#111",
              }}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "online"}
                onChange={() => setPaymentMethod("online")}
                style={{ accentColor: "#c9a84c" }}
              />
              <div>
                <p style={{ color: "#ededed", fontWeight: 600, margin: 0 }}>
                  Pay Online (UPI, Cards, Net Banking)
                </p>
                <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>
                  Secure payment via Razorpay
                </p>
              </div>
            </label>

            <label
              style={{
                ...styles.paymentOption,
                borderColor: paymentMethod === "cod" ? "#c9a84c" : "#222",
                background: paymentMethod === "cod" ? "rgba(201,168,76,0.08)" : "#111",
              }}
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
                style={{ accentColor: "#c9a84c" }}
              />
              <div>
                <p style={{ color: "#ededed", fontWeight: 600, margin: 0 }}>
                  Cash on Delivery
                </p>
                <p style={{ color: "#888", fontSize: 13, margin: "4px 0 0" }}>
                  Pay when you receive the order
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Order Summary */}
        <div style={styles.summaryCard}>
          <h2 style={styles.sectionTitle}>Order Summary</h2>

          <div style={styles.itemsList}>
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}`} style={styles.summaryItem}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#ededed", fontSize: 14, margin: 0 }}>{item.name}</p>
                  <p style={{ color: "#888", fontSize: 12, margin: "2px 0 0" }}>
                    Size: {item.size} x {item.quantity}
                  </p>
                </div>
                <p style={{ color: "#ededed", fontSize: 14, margin: 0, fontWeight: 500 }}>
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div style={styles.divider} />

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
          <div style={styles.divider} />
          <div style={styles.summaryRow}>
            <span style={{ color: "#ededed", fontWeight: 700, fontSize: 16 }}>Total</span>
            <span style={{ color: "#c9a84c", fontWeight: 700, fontSize: 18 }}>
              {formatPrice(total)}
            </span>
          </div>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, margin: "12px 0 0" }}>{error}</p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={placing || !allFieldsValid}
            style={{
              ...styles.placeOrderBtn,
              opacity: placing || !allFieldsValid ? 0.6 : 1,
              cursor: placing || !allFieldsValid ? "not-allowed" : "pointer",
            }}
          >
            {placing
              ? "Processing..."
              : paymentMethod === "online"
                ? `Pay ${formatPrice(total)}`
                : "Place Order (COD)"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
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
  section: {
    background: "#111",
    borderRadius: 12,
    border: "1px solid #222",
    padding: "24px",
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    color: "#ededed",
    margin: "0 0 20px",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  row: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  field: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    color: "#bbb",
    fontWeight: 500,
  },
  input: {
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s",
  },
  fieldError: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 2,
  },
  paymentOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 10,
    border: "1px solid #222",
    cursor: "pointer",
    marginBottom: 12,
    transition: "all 0.2s",
  },
  summaryCard: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: 12,
    padding: 24,
    alignSelf: "start",
    position: "sticky" as const,
    top: 100,
  },
  itemsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  summaryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    fontSize: 14,
  },
  divider: {
    height: 1,
    background: "#222",
    margin: "12px 0",
  },
  placeOrderBtn: {
    width: "100%",
    padding: "16px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 10,
    fontSize: 16,
    fontWeight: 700,
    marginTop: 16,
    letterSpacing: "0.5px",
  },
};
