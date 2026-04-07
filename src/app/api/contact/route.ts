import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sanitize, isValidEmail, isValidName, rateLimit } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Rate limit: 5 per hour per IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = rateLimit(`contact:${ip}`, 5, 3600000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Body size check
    const text = await request.text();
    if (text.length > 10240) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }

    const body = JSON.parse(text);

    // Honeypot check - if filled, it's a bot
    if (body.website) {
      // Silently succeed to not tip off bots
      return NextResponse.json({ message: "Message sent successfully!" });
    }

    const first_name = sanitize(body.first_name || "");
    const last_name = sanitize(body.last_name || "");
    const email = sanitize(body.email || "");
    const subject = sanitize(body.subject || "");
    const message = sanitize(body.message || "");

    // Validation
    if (!first_name || !last_name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidName(first_name)) {
      return NextResponse.json(
        { error: "Please enter a valid first name" },
        { status: 400 }
      );
    }

    if (!isValidName(last_name)) {
      return NextResponse.json(
        { error: "Please enter a valid last name" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("messages").insert({
      first_name,
      last_name,
      email: email.toLowerCase(),
      subject,
      message,
    });

    if (error) {
      console.error("Contact form error:", error.message);
      return NextResponse.json(
        { error: "Failed to send message. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Message sent successfully!" });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
