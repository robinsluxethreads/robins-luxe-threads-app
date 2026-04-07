"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Product, Category } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";

const PAGE_SIZE = 20;

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: Infinity },
  { label: "Under \u20B91,000", min: 0, max: 999 },
  { label: "\u20B91,000 - \u20B93,000", min: 1000, max: 3000 },
  { label: "\u20B93,000 - \u20B95,000", min: 3000, max: 5000 },
  { label: "\u20B95,000 - \u20B910,000", min: 5000, max: 10000 },
  { label: "Above \u20B910,000", min: 10000, max: Infinity },
];

const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A - Z" },
];

export default function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );
  const [priceRange, setPriceRange] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(0);

  // Mobile filter toggle
  const [showFilters, setShowFilters] = useState(false);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, emoji, gradient")
        .order("name");
      if (data) setCategories(data as Category[]);
    }
    loadCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(
    async (pageNum: number, append = false) => {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      let query = supabase
        .from("products")
        .select("id, name, price, old_price, category, emoji, images, badge, is_active, sizes, description", { count: "exact" })
        .eq("is_active", true);

      // Search filter
      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      // Category filter
      if (selectedCategories.length > 0) {
        const catNames = categories
          .filter((c) => selectedCategories.includes(c.slug))
          .map((c) => c.name);
        if (catNames.length > 0) {
          query = query.in("category", catNames);
        }
      }

      // Price filter
      const range = PRICE_RANGES[priceRange];
      if (range.min > 0) {
        query = query.gte("price", range.min);
      }
      if (range.max !== Infinity) {
        query = query.lte("price", range.max);
      }

      // Size filter
      if (selectedSizes.length > 0) {
        query = query.overlaps("sizes", selectedSizes);
      }

      // Sort
      switch (sortBy) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "name-asc":
          query = query.order("name", { ascending: true });
          break;
        default:
          query = query.order("id", { ascending: false });
      }

      // Pagination
      const from = pageNum * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count } = await query;

      if (data) {
        if (append) {
          setProducts((prev) => [...prev, ...(data as Product[])]);
        } else {
          setProducts(data as Product[]);
        }
      }
      if (count !== null) setTotalCount(count);

      setLoading(false);
      setLoadingMore(false);
    },
    [search, selectedCategories, priceRange, selectedSizes, sortBy, categories]
  );

  // Reset and fetch on filter change
  useEffect(() => {
    setPage(0);
    fetchProducts(0);
  }, [fetchProducts]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const hasMore = products.length < totalCount;

  return (
    <>
      {/* Banner */}
      <div className="page-banner">
        <h1 className="gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
          Our Collection
        </h1>
        <div className="divider" />
        <p style={{ color: "#888" }}>
          Discover {totalCount} exquisite pieces curated just for you
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Mobile filter toggle */}
        <div className="lg:hidden mb-4">
          <button
            className="btn-outline-gold w-full"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`w-full lg:w-64 flex-shrink-0 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div
              className="sticky top-20 p-5 rounded-xl"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              {/* Search */}
              <div className="filter-section">
                <h3>Search</h3>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products..."
                  className="input-dark"
                />
              </div>

              {/* Categories */}
              <div className="filter-section">
                <h3>Category</h3>
                {categories.map((cat) => (
                  <label key={cat.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                    />
                    {cat.emoji} {cat.name}
                  </label>
                ))}
              </div>

              {/* Price Range */}
              <div className="filter-section">
                <h3>Price Range</h3>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(Number(e.target.value))}
                  className="input-dark"
                >
                  {PRICE_RANGES.map((r, i) => (
                    <option key={i} value={i}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sizes */}
              <div className="filter-section">
                <h3>Size</h3>
                <div className="grid grid-cols-2 gap-1">
                  {ALL_SIZES.map((size) => (
                    <label key={size} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Sort bar */}
            <div
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 p-4 rounded-xl"
              style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
            >
              <p className="text-sm" style={{ color: "#888" }}>
                Showing {products.length} of {totalCount} products
              </p>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-dark"
                style={{ width: "auto", minWidth: "180px" }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="product-card">
                    <div className="skeleton" style={{ aspectRatio: "3/4" }} />
                    <div className="p-4 space-y-2">
                      <div className="skeleton h-3 w-16" />
                      <div className="skeleton h-4 w-full" />
                      <div className="skeleton h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">🔍</p>
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  No products found
                </h3>
                <p style={{ color: "#888" }}>
                  Try adjusting your filters to find what you&apos;re looking for.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-10">
                    <button
                      onClick={loadMore}
                      className="btn-outline-gold"
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
