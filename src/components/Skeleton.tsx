export function ProductCardSkeleton() {
  return (
    <div className="product-card">
      <div className="skeleton" style={{ aspectRatio: "3/4" }} />
      <div className="p-4 space-y-2">
        <div className="skeleton" style={{ height: 12, width: 64 }} />
        <div className="skeleton" style={{ height: 16, width: "100%" }} />
        <div className="skeleton" style={{ height: 16, width: 80 }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageBannerSkeleton() {
  return (
    <div className="page-banner">
      <div
        className="skeleton"
        style={{ height: 48, width: 300, margin: "0 auto", borderRadius: 8 }}
      />
      <div
        className="skeleton"
        style={{ height: 3, width: 60, margin: "1rem auto", borderRadius: 2 }}
      />
      <div
        className="skeleton"
        style={{ height: 20, width: 250, margin: "0 auto", borderRadius: 8 }}
      />
    </div>
  );
}

export function TextSkeleton({
  width = "100%",
  height = 16,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 4 }}
    />
  );
}

export function ProductDetailSkeleton() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "100px 16px 60px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>
        <div className="skeleton" style={{ aspectRatio: "1/1", borderRadius: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="skeleton" style={{ height: 14, width: 100 }} />
          <div className="skeleton" style={{ height: 32, width: "80%" }} />
          <div className="skeleton" style={{ height: 24, width: 120 }} />
          <div className="skeleton" style={{ height: 60, width: "100%" }} />
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton" style={{ height: 40, width: 56, borderRadius: 8 }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 48, width: "100%", borderRadius: 8 }} />
        </div>
      </div>
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div
      className="skeleton"
      style={{
        borderRadius: 16,
        minHeight: 180,
      }}
    />
  );
}

export function CategoryGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  );
}
