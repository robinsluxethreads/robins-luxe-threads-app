import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Robins Luxe Threads",
  description:
    "Get in touch with Robins Luxe Threads. Reach us for product inquiries, order support, returns, or collaboration opportunities.",
  openGraph: {
    title: "Contact Us | Robins Luxe Threads",
    description:
      "Get in touch with Robins Luxe Threads for product inquiries, order support, and more.",
    url: "https://robinsluxethreads.vercel.app/contact",
  },
  twitter: {
    card: "summary",
    title: "Contact Us | Robins Luxe Threads",
    description:
      "Get in touch with Robins Luxe Threads for product inquiries, order support, and more.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
