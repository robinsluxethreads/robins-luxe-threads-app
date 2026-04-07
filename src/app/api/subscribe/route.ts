import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sanitize, isValidEmail, rateLimit } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 per hour per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = rateLimit(`subscribe:${ip}`, 5, 3600000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Body size check
    const text = await request.text();
    if (text.length > 1024) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = JSON.parse(text);
    const email = sanitize(body.email || "");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("subscribers")
      .insert({ email: email.toLowerCase().trim() });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You're already subscribed!" },
          { status: 409 }
        );
      }
      console.error("Subscribe error:", error.message);
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Successfully subscribed!" });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
