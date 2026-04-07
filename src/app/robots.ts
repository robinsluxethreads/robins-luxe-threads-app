export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: "https://robinsluxethreads.vercel.app/sitemap.xml",
  };
}
