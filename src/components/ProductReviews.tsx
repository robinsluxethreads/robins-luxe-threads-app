"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import StarRating from "./StarRating";
import Toast from "./Toast";

interface Review {
  id: number;
  user_id: string;
  product_id: number;
  rating: number;
  title: string;
  comment: string;
  user_name: string;
  created_at: string;
}

interface ProductReviewsProps {
  productId: number;
}

type SortOption = "recent" | "highest" | "lowest";

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", isError: false });

  // Form state
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formComment, setFormComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    setReviews(data || []);
    setLoading(false);
  }, [productId]);

  const checkPurchaseAndExisting = useCallback(async () => {
    if (!user) return;

    // Check if user already reviewed
    const { data: existing } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      setExistingReview(existing as Review);
      setFormRating(existing.rating);
      setFormTitle(existing.title);
      setFormComment(existing.comment);
    }

    // Check if user purchased this product
    const { data: orders } = await supabase
      .from("orders")
      .select("items")
      .eq("customer_email", user.email);

    if (orders) {
      const purchased = orders.some((order) => {
        const items = Array.isArray(order.items) ? order.items : [];
        return items.some(
          (item: { productId: number }) => item.productId === productId
        );
      });
      setHasPurchased(purchased);
    }
  }, [user, productId]);

  useEffect(() => {
    fetchReviews();
    checkPurchaseAndExisting();
  }, [fetchReviews, checkPurchaseAndExisting]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!formTitle.trim() || !formComment.trim()) {
      setToast({ show: true, message: "Please fill in all fields", isError: true });
      return;
    }

    setSubmitting(true);

    const userName =
      user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

    const reviewData = {
      user_id: user.id,
      product_id: productId,
      rating: formRating,
      title: formTitle.trim(),
      comment: formComment.trim(),
      user_name: userName,
    };

    let error;
    if (existingReview) {
      const result = await supabase
        .from("reviews")
        .update(reviewData)
        .eq("id", existingReview.id);
      error = result.error;
    } else {
      const result = await supabase.from("reviews").insert(reviewData);
      error = result.error;
    }

    if (error) {
      setToast({ show: true, message: "Failed to submit review", isError: true });
    } else {
      setToast({
        show: true,
        message: existingReview ? "Review updated!" : "Review submitted!",
        isError: false,
      });
      setShowForm(false);
      fetchReviews();
      checkPurchaseAndExisting();
    }

    setSubmitting(false);
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Stats
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent:
      reviews.length > 0
        ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
        : 0,
  }));

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Customer Reviews</h2>

      {/* Summary */}
      {reviews.length > 0 && (
        <div style={styles.summary}>
          <div style={styles.avgSection}>
            <span style={styles.avgNumber}>{avgRating.toFixed(1)}</span>
            <StarRating rating={Math.round(avgRating)} size="large" />
            <span style={styles.totalReviews}>
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={styles.breakdown}>
            {ratingCounts.map((rc) => (
              <div key={rc.star} style={styles.breakdownRow}>
                <span style={styles.breakdownLabel}>{rc.star} star</span>
                <div style={styles.breakdownBarBg}>
                  <div
                    style={{
                      ...styles.breakdownBarFill,
                      width: `${rc.percent}%`,
                    }}
                  />
                </div>
                <span style={styles.breakdownCount}>{rc.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Write a Review */}
      {user && hasPurchased && (
        <button
          onClick={() => setShowForm(!showForm)}
          style={styles.writeBtn}
        >
          {existingReview ? "Edit Review" : "Write a Review"}
        </button>
      )}

      {/* Review Form */}
      {showForm && user && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {existingReview ? "Edit Your Review" : "Write a Review"}
          </h3>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.formLabel}>Rating</label>
            <StarRating
              rating={formRating}
              onChange={setFormRating}
              readonly={false}
              size="large"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.formLabel}>Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Summarize your experience"
              style={styles.input}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={styles.formLabel}>Comment</label>
            <textarea
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              placeholder="Tell others what you think about this product"
              style={styles.textarea}
              rows={4}
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                ...styles.submitBtn,
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "Submitting..." : existingReview ? "Update Review" : "Submit Review"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              style={styles.cancelBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sort */}
      {reviews.length > 1 && (
        <div style={styles.sortRow}>
          <span style={{ color: "#888", fontSize: 13 }}>Sort by:</span>
          {(
            [
              { key: "recent", label: "Most Recent" },
              { key: "highest", label: "Highest Rating" },
              { key: "lowest", label: "Lowest Rating" },
            ] as { key: SortOption; label: string }[]
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                ...styles.sortBtn,
                color: sortBy === opt.key ? "#c9a84c" : "#888",
                borderColor: sortBy === opt.key ? "#c9a84c" : "#333",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Review List */}
      {loading ? (
        <p style={{ color: "#888", textAlign: "center", padding: 24 }}>
          Loading reviews...
        </p>
      ) : reviews.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", padding: 24 }}>
          No reviews yet. Be the first to review this product!
        </p>
      ) : (
        <div style={styles.reviewList}>
          {sortedReviews.map((review) => (
            <div key={review.id} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <div>
                  <StarRating rating={review.rating} size="small" />
                  <h4 style={styles.reviewTitle}>{review.title}</h4>
                </div>
                <span style={styles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p style={styles.reviewComment}>{review.comment}</p>
              <p style={styles.reviewAuthor}>
                By {review.user_name}
                {user && review.user_id === user.id && (
                  <span style={{ color: "#c9a84c", marginLeft: 8 }}>(You)</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      <Toast
        message={toast.message}
        show={toast.show}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        isError={toast.isError}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    marginTop: 48,
    paddingTop: 32,
    borderTop: "1px solid #222",
  },
  heading: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 24,
    color: "#ededed",
    marginBottom: 24,
  },
  summary: {
    display: "flex",
    gap: 40,
    flexWrap: "wrap" as const,
    marginBottom: 24,
    padding: 24,
    background: "#111",
    borderRadius: 12,
    border: "1px solid #222",
  },
  avgSection: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
    minWidth: 100,
  },
  avgNumber: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 48,
    fontWeight: 700,
    color: "#c9a84c",
    lineHeight: 1,
  },
  totalReviews: {
    fontSize: 13,
    color: "#888",
  },
  breakdown: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
    minWidth: 200,
  },
  breakdownRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  breakdownLabel: {
    fontSize: 13,
    color: "#888",
    minWidth: 48,
  },
  breakdownBarBg: {
    flex: 1,
    height: 8,
    background: "#222",
    borderRadius: 4,
    overflow: "hidden",
  },
  breakdownBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #c9a84c, #d4b96a)",
    borderRadius: 4,
    transition: "width 0.4s ease",
  },
  breakdownCount: {
    fontSize: 13,
    color: "#888",
    minWidth: 20,
    textAlign: "right" as const,
  },
  writeBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid #c9a84c",
    color: "#c9a84c",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 24,
  },
  formCard: {
    padding: 24,
    background: "#111",
    borderRadius: 12,
    border: "1px solid #222",
    marginBottom: 24,
  },
  formTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    color: "#ededed",
    margin: "0 0 20px",
  },
  formLabel: {
    display: "block",
    fontSize: 13,
    color: "#bbb",
    fontWeight: 500,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  textarea: {
    width: "100%",
    padding: "12px 14px",
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    fontSize: 15,
    outline: "none",
    resize: "vertical" as const,
    boxSizing: "border-box" as const,
    fontFamily: "'Poppins', sans-serif",
  },
  submitBtn: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #c9a84c, #b8942e)",
    color: "#0a0a0a",
    border: "none",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "12px 24px",
    background: "transparent",
    border: "1px solid #333",
    color: "#888",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
  },
  sortRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap" as const,
  },
  sortBtn: {
    padding: "6px 14px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: 6,
    fontSize: 12,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  reviewList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
  },
  reviewCard: {
    padding: 20,
    background: "#111",
    borderRadius: 12,
    border: "1px solid #222",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#ededed",
    margin: "6px 0 0",
  },
  reviewDate: {
    fontSize: 12,
    color: "#666",
  },
  reviewComment: {
    fontSize: 14,
    color: "#999",
    lineHeight: 1.6,
    margin: "0 0 8px",
  },
  reviewAuthor: {
    fontSize: 12,
    color: "#666",
    margin: 0,
  },
};
