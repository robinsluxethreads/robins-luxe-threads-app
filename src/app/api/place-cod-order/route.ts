import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  sanitize,
  isValidPhone,
  isValidPincode,
  isValidName,
  isValidEmail,
  rateLimit,
} from "@/lib/validation";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
  return `RLT-${date}-${seq}`;
}

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = rateLimit(`place-cod:${ip}`, 10, 3600000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const text = await request.text();
    if (text.length > 51200) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = JSON.parse(text);
    const { items, shipping_address, customer } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    if (items.length > 50) {
      return NextResponse.json({ error: "Too many items in order" }, { status: 400 });
    }

    // Validate shipping address
    const address = sanitize(shipping_address?.address || "");
    const city = sanitize(shipping_address?.city || "");
    const state = sanitize(shipping_address?.state || "");
    const pincode = sanitize(shipping_address?.pincode || "");
    const customerName = sanitize(customer?.name || "");
    const customerEmail = sanitize(customer?.email || "");
    const customerPhone = sanitize(customer?.phone || "");

    if (!address || address.length < 5) {
      return NextResponse.json({ error: "Valid address is required" }, { status: 400 });
    }
    if (!city) {
      return NextResponse.json({ error: "City is required" }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ error: "State is required" }, { status: 400 });
    }
    if (!isValidPincode(pincode)) {
      return NextResponse.json({ error: "Valid 6-digit pincode is required" }, { status: 400 });
    }
    if (!isValidName(customerName)) {
      return NextResponse.json({ error: "Valid name is required" }, { status: 400 });
    }
    if (!isValidEmail(customerEmail)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!isValidPhone(customerPhone)) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }

    // Validate items exist in DB and recalculate prices server-side
    const productIds = items.map((item: { productId: number }) => item.productId);
    const { data: dbProducts, error: dbError } = await supabase
      .from("products")
      .select("id, price, name, is_active")
      .in("id", productIds);

    if (dbError || !dbProducts) {
      return NextResponse.json(
        { error: "Failed to validate products" },
        { status: 500 }
      );
    }

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json(
          { error: `Product not found: ${item.name || item.productId}` },
          { status: 400 }
        );
      }
      if (!dbProduct.is_active) {
        return NextResponse.json(
          { error: `Product is no longer available: ${dbProduct.name}` },
          { status: 400 }
        );
      }
    }

    // Recalculate total server-side
    let serverSubtotal = 0;
    for (const item of items) {
      const dbProduct = productMap.get(item.productId)!;
      const qty = Math.max(1, Math.min(item.quantity || 1, 99));
      serverSubtotal += dbProduct.price * qty;
    }

    const serverShipping = serverSubtotal >= 5000 ? 0 : 99;
    const serverTotal = serverSubtotal + serverShipping;

    const orderNumber = generateOrderNumber();
    const fullAddress = `${address}, ${city}, ${state} - ${pincode}`;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        customer_name: customerName,
        customer_email: customerEmail.toLowerCase(),
        customer_phone: customerPhone,
        shipping_address: fullAddress,
        items,
        subtotal: serverSubtotal,
        shipping: serverShipping,
        tax: 0,
        total: serverTotal,
        payment_method: "cod",
        payment_status: "pending",
        payment_id: null,
        order_status: "confirmed",
      })
      .select("id")
      .single();

    if (error) {
      console.error("COD order save error:", error.message);
      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: data.id,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error("Place COD order error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
