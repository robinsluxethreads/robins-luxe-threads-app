"use client";

import { useState } from "react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "small" | "medium" | "large";
}

const SIZES = {
  small: 14,
  medium: 18,
  large: 24,
};

export default function StarRating({
  rating,
  maxRating = 5,
  onChange,
  readonly = true,
  size = "medium",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const px = SIZES[size];
  const displayRating = hoverRating || rating;

  return (
    <div
      style={{
        display: "inline-flex",
        gap: size === "small" ? 1 : 2,
        cursor: readonly ? "default" : "pointer",
      }}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const starIndex = i + 1;
        const filled = starIndex <= displayRating;

        return (
          <span
            key={i}
            onClick={() => {
              if (!readonly && onChange) onChange(starIndex);
            }}
            onMouseEnter={() => {
              if (!readonly) setHoverRating(starIndex);
            }}
            onMouseLeave={() => {
              if (!readonly) setHoverRating(0);
            }}
            style={{
              fontSize: px,
              color: filled ? "#c9a84c" : "#555",
              lineHeight: 1,
              transition: "color 0.15s",
              userSelect: "none",
            }}
          >
            {filled ? "\u2605" : "\u2606"}
          </span>
        );
      })}
    </div>
  );
}
