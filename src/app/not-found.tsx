import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "8rem",
          fontWeight: 700,
          background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          margin: 0,
        }}
      >
        404
      </h1>

      <div
        style={{
          width: 60,
          height: 3,
          background: "#c9a84c",
          borderRadius: 2,
          margin: "24px auto",
        }}
      />

      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          color: "#ededed",
          marginBottom: 12,
        }}
      >
        Page Not Found
      </h2>

      <p
        style={{
          color: "#888",
          fontSize: 16,
          maxWidth: 400,
          marginBottom: 32,
          lineHeight: 1.6,
        }}
      >
        The page you are looking for might have been moved, renamed, or doesn&apos;t
        exist.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            padding: "14px 32px",
            background: "linear-gradient(135deg, #c9a84c, #b8942e)",
            color: "#0a0a0a",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
        >
          Return to Home
        </Link>
        <Link
          href="/shop"
          style={{
            padding: "14px 32px",
            background: "transparent",
            color: "#c9a84c",
            border: "2px solid #c9a84c",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          Browse Collection
        </Link>
      </div>
    </div>
  );
}
