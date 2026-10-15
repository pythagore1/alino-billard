import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { cloudinaryOptimized, cloudinarySrcSet } from "@/lib/cloudinary-url";
import { AVAILABILITY_BADGE_CLASS, AVAILABILITY_LABELS, isOrderable } from "@/lib/availability";
import { QuickAddButton } from "@/components/shop/quick-add-button";
import type { Availability } from "@/generated/prisma/enums";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  availability: Availability;
  images: { media: { url: string; altText: string | null } }[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0]?.media;
  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md">
      <Link href={`/produit/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square overflow-hidden bg-white">
          <div className="absolute inset-0 flex items-center justify-center p-2">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element -- images de médiathèque externes (URL manuelle ou Cloudinary)
              <img
                src={cloudinaryOptimized(image.url, 400)}
                srcSet={cloudinarySrcSet(image.url, [240, 400, 640])}
                sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 33vw, 46vw"
                alt={image.altText ?? product.name}
                className="max-h-full max-w-full rounded-md object-contain transition-transform group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Image
                src="/logo.png"
                alt=""
                width={160}
                height={160}
                className="max-h-full max-w-full rounded-md object-contain"
              />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-4">
          <p className="line-clamp-2 min-h-[2.75em] text-sm leading-snug font-medium sm:text-base">{product.name}</p>

          {product.availability !== "AVAILABLE" && (
            <span
              className={`flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs ${AVAILABILITY_BADGE_CLASS[product.availability]}`}
            >
              <span aria-hidden>●</span>
              {AVAILABILITY_LABELS[product.availability]}
            </span>
          )}

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2">
            <span className="font-semibold text-primary">{formatPrice(product.price)}</span>
            {isOnSale && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {isOrderable(product.availability) && (
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <QuickAddButton productId={product.id} />
        </div>
      )}
    </div>
  );
}
