import { supabase } from "./supabase";

const BUCKET = "product-images";
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function getFileExtension(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "jpg";
}

function generateFileName(file: File): string {
  const ext = getFileExtension(file);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `product-${timestamp}-${random}.${ext}`;
}

async function compressImage(file: File): Promise<File> {
  // Only compress if > 1MB
  if (file.size <= 1024 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    img.onload = () => {
      // Scale down to max 1200px width/height
      let { width, height } = img;
      const maxDim = 1200;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file);
          }
        },
        file.type,
        0.8
      );
    };

    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPG, PNG, and WebP are allowed.");
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  // Compress if needed
  const processedFile = await compressImage(file);
  const fileName = generateFileName(processedFile);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, processedFile, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error("Upload failed: " + error.message);
  }

  return getPublicUrl(fileName);
}

export async function deleteProductImage(url: string): Promise<void> {
  // Extract file path from public URL
  const parts = url.split(`/storage/v1/object/public/${BUCKET}/`);
  if (parts.length < 2) return;

  const filePath = parts[1];
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

  if (error) {
    console.error("Delete failed:", error.message);
  }
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
