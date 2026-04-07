"use client";

import { useState, useRef, useCallback } from "react";
import { uploadProductImage, deleteProductImage } from "@/lib/imageUpload";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function ImageUpload({ images, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setUploading(true);
      const newUrls: string[] = [];
      let completed = 0;

      for (const file of fileArray) {
        try {
          setUploadProgress(`Uploading ${completed + 1} of ${fileArray.length}...`);
          const url = await uploadProductImage(file);
          newUrls.push(url);
          completed++;
        } catch (err) {
          alert(`Failed to upload ${file.name}: ${(err as Error).message}`);
        }
      }

      if (newUrls.length > 0) {
        onChange([...images, ...newUrls]);
      }

      setUploading(false);
      setUploadProgress("");

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [images, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = async (idx: number) => {
    const url = images[idx];
    try {
      await deleteProductImage(url);
    } catch {
      // Continue even if storage delete fails
    }
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {/* Drop zone */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: `2px dashed ${dragOver ? "#d4b96a" : "#c9a84c"}`,
          borderRadius: 10,
          padding: "1.5rem",
          textAlign: "center",
          cursor: uploading ? "default" : "pointer",
          background: dragOver ? "rgba(201, 168, 76, 0.08)" : "#1a1a1a",
          transition: "all 0.2s",
          marginBottom: images.length > 0 ? 12 : 0,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
        />

        {uploading ? (
          <div>
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #2a2a2a",
                borderTopColor: "#c9a84c",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 8px",
              }}
            />
            <p style={{ color: "#c9a84c", fontSize: "0.8rem", margin: 0 }}>
              {uploadProgress}
            </p>
          </div>
        ) : (
          <>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto 8px", display: "block" }}
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ color: "#aaa", fontSize: "0.8rem", margin: "0 0 4px" }}>
              Drag & drop images here or click to browse
            </p>
            <p style={{ color: "#666", fontSize: "0.7rem", margin: 0 }}>
              JPG, PNG, WebP - Max 5MB each
            </p>
          </>
        )}
      </div>

      {/* Preview thumbnails */}
      {images.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {images.map((url, idx) => (
            <div
              key={idx}
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #2a2a2a",
                flexShrink: 0,
              }}
            >
              <img
                src={url}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(idx);
                }}
                style={{
                  position: "absolute",
                  top: 3,
                  right: 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.65rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
