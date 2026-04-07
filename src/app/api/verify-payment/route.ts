import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { sanitize, rateLimit } from "@/lib/validation";

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
    const { allowed } = rateLimit(`verify-payment:${ip}`, 10, 3600000);
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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.warn("Payment verification attempt with missing fields", { ip });
      return NextResponse.json(
        { error: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("Invalid payment signature attempt", {
        ip,
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Payment verified - log success
    console.info("Payment verified successfully", {
      razorpay_order_id,
      razorpay_payment_id,
      customer_email: orderData?.customer?.email,
    });

    // Save order to Supabase
    const orderNumber = generateOrderNumber();
    const shippingAddress = orderData.shipping_address;
    const fullAddress = `${sanitize(shippingAddress.address)}, ${sanitize(shippingAddress.city)}, ${sanitize(shippingAddress.state)} - ${sanitize(shippingAddress.pincode)}`;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: orderData.customer.id,
        customer_name: sanitize(orderData.customer.name),
        customer_email: sanitize(orderData.customer.email).toLowerCase(),
        customer_phone: sanitize(orderData.customer.phone),
        shipping_address: fullAddress,
        items: orderData.items,
        subtotal: orderData.subtotal,
        shipping: orderData.shipping,
        tax: 0,
        total: orderData.total,
        payment_method: "online",
        payment_status: "paid",
        payment_id: razorpay_payment_id,
        order_status: "confirmed",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Order save error after verified payment:", {
        error: error.message,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { error: "Failed to save order" },
        { status: 500 }
      );
    }

    console.info("Order created successfully", {
      order_number: orderNumber,
      order_id: data.id,
      payment_id: razorpay_payment_id,
    });

    return NextResponse.json({
      success: true,
      order_id: data.id,
      order_number: orderNumber,
    });
  } catch (error) {
    console.error("Verify payment error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
