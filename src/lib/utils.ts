// ==========================================
// TypeScript Types
// ==========================================

export interface Product {
  id: number;
  name: string;
  price: number;
  old_price: number | null;
  category: string;
  description: string;
  sizes: string[];
  badge: string | null;
  emoji: string | null;
  images: string[];
  is_active: boolean;
  stock_quantity?: number;
  low_stock_threshold?: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  emoji: string;
  gradient: string;
}

export interface Subscriber {
  id: number;
  email: string;
  created_at: string;
}

export interface Message {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface SiteConfig {
  id: number;
  key: string;
  value: string;
}

// ==========================================
// Helpers
// ==========================================

/**
 * Format price in INR with Indian comma system
 * e.g. 150000 -> "1,50,000"
 */
export function formatPrice(amount: number): string {
  const formatted = amount.toLocaleString('en-IN');
  return `\u20B9${formatted}`;
}

/**
 * Default WhatsApp number
 */
export const DEFAULT_WHATSAPP = '919025256341';

/**
 * Generate WhatsApp link with pre-filled message
 */
export function getWhatsAppLink(product: Product, whatsappNumber?: string): string {
  const phone = whatsappNumber || DEFAULT_WHATSAPP;
  const message = encodeURIComponent(
    `Hi! I'm interested in purchasing:\n\n` +
    `*${product.name}*\n` +
    `Price: ${formatPrice(product.price)}\n` +
    `Category: ${product.category}\n\n` +
    `Could you please share more details?`
  );
  return `https://wa.me/${phone}?text=${message}`;
}

/**
 * Generate mailto link for product enquiry
 */
export function getEmailLink(product: Product): string {
  const subject = encodeURIComponent(`Enquiry about ${product.name}`);
  const body = encodeURIComponent(
    `Hi,\n\nI'm interested in the following product:\n\n` +
    `Product: ${product.name}\n` +
    `Price: ${formatPrice(product.price)}\n` +
    `Category: ${product.category}\n\n` +
    `Please share more details.\n\nThank you!`
  );
  return `mailto:robinsluxethreads@gmail.com?subject=${subject}&body=${body}`;
}
