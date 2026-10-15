import Link from "next/link";
import Image from "next/image";
import { cloudinaryOptimized, cloudinarySrcSet } from "@/lib/cloudinary-url";

/** Carte de catégorie, partagée entre la page Catégories et l'accueil. */
export function CategoryCard({
  slug,
  name,
  imageUrl,
  count,
}: {
  slug: string;
  name: string;
  imageUrl: string | null;
  count: number;
}) {
  return (
    <Link
      href={`/catalogue/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
    >
      <div className="relative aspect-square bg-white sm:aspect-[4/3]">
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-5">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- images de médiathèque externes
            <img
              src={cloudinaryOptimized(imageUrl, 500)}
              srcSet={cloudinarySrcSet(imageUrl, [300, 500, 800])}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 46vw"
              alt=""
              className="max-h-full max-w-full rounded-md object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Image
              src="/logo.png"
              alt=""
              width={200}
              height={200}
              className="max-h-full max-w-full rounded-md object-contain"
            />
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col border-t border-border p-3 sm:p-5">
        <p className="font-display text-base leading-tight font-bold sm:text-lg">{name}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          {count} produit{count > 1 ? "s" : ""}
        </p>
        <span className="mt-auto inline-flex min-h-11 items-center gap-1 pt-2 text-sm font-medium text-primary">
          Voir les produits
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
