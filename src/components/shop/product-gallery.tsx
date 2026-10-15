"use client";

import { useRef, useState } from "react";
import { cloudinaryOptimized, cloudinarySrcSet } from "@/lib/cloudinary-url";

type GalleryImage = { url: string; altText: string | null; isVideo?: boolean };

export function ProductGallery({
  images,
  productName,
}: {
  images: GalleryImage[];
  productName: string;
}) {
  const [selected, setSelected] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const current = images[selected];

  function handleScroll() {
    const el = sliderRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index !== selected && index >= 0 && index < images.length) setSelected(index);
  }

  function goTo(index: number) {
    setSelected(index);
    const el = sliderRef.current;
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  }

  return (
    // min-w-0 : nécessaire dans une grille CSS — sans ça, un élément de
    // grille garde par défaut la largeur intrinsèque de son contenu (ici, le
    // bandeau de vignettes) au lieu de se limiter à la colonne disponible,
    // ce qui pousse toute la page en débordement horizontal sur mobile dès
    // qu'il y a assez de vignettes (constaté : queue carbone, 6 vignettes).
    <div className="flex min-w-0 flex-col gap-3">
      {/* Mobile : défilement horizontal par accrochage + pastilles */}
      <div className="sm:hidden">
        <div
          ref={sliderRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-lg border border-border bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.length === 0 && (
            <div className="flex aspect-square w-full shrink-0 items-center justify-center text-6xl">🎱</div>
          )}
          {images.map((img, index) => (
            <div key={img.url + index} className="aspect-square w-full shrink-0 snap-center">
              {img.isVideo ? (
                <video src={img.url} controls playsInline preload="metadata" className="h-full w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- images de médiathèque externes
                <img
                  src={cloudinaryOptimized(img.url, 800)}
                  srcSet={cloudinarySrcSet(img.url, [480, 800, 1200])}
                  sizes="100vw"
                  alt={img.altText ?? productName}
                  className="h-full w-full object-contain"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              )}
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1" role="tablist" aria-label="Photos du produit">
            {images.map((img, index) => (
              <button
                key={img.url + index}
                type="button"
                role="tab"
                aria-selected={index === selected}
                aria-label={`Photo ${index + 1}`}
                onClick={() => goTo(index)}
                className="flex h-8 w-6 items-center justify-center"
              >
                <span
                  className={`h-2.5 rounded-full transition-all ${
                    index === selected ? "w-5 bg-primary" : "w-2.5 bg-border"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tablette / bureau : image principale + vignettes */}
      <div className="hidden aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted sm:block">
        {current ? (
          current.isVideo ? (
            <video
              key={current.url}
              src={current.url}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- images de médiathèque externes (URL manuelle ou Cloudinary)
            <img
              src={cloudinaryOptimized(current.url, 800)}
              alt={current.altText ?? productName}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">🎱</div>
        )}
      </div>

      {images.length > 1 && (
        <div className="hidden gap-2 overflow-x-auto sm:flex">
          {images.map((img, index) => (
            <button
              key={img.url + index}
              type="button"
              onClick={() => setSelected(index)}
              className={`flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded border ${
                index === selected ? "border-primary" : "border-border"
              } ${img.isVideo ? "bg-ink text-ink-foreground" : ""}`}
            >
              {img.isVideo ? (
                <span aria-hidden="true">▶</span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- miniatures de la même source que l'image principale
                <img src={cloudinaryOptimized(img.url, 96)} alt="" className="h-full w-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
