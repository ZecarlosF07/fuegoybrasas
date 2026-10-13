"use client";

import Image from "next/image";
import { useState } from "react";

import { productImageUrl } from "../services/presentation";
import type { ProductImageProps } from "../types/catalog";
import { getPublicEnvironment } from "@/lib/env/public";

export function ProductImage({ item, large = false }: ProductImageProps) {
  const [failedPath, setFailedPath] = useState<string | null>(null);
  const url = productImageUrl(item, getPublicEnvironment().NEXT_PUBLIC_SUPABASE_URL);
  const showImage = url && failedPath !== item.imagePath;
  return (
    <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-card bg-brand-bg">
      {showImage ? (
        <Image src={url} alt={`${item.name}${item.portionLabel ? `, ${item.portionLabel}` : ""}`} fill
          sizes={large ? "(max-width: 767px) 100vw, 50vw" : "(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"}
          className="object-contain" onError={() => setFailedPath(item.imagePath)} />
      ) : (
        <div className="flex flex-col items-center gap-3 px-4 text-brand-muted">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8">
            <path d="M4 3v5a3 3 0 0 0 6 0V3M7 3v18M20 3c-4 1-5 5-5 9h5M20 3v18" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm">Foto próximamente</span>
        </div>
      )}
    </div>
  );
}
