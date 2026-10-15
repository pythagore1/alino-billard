import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProductBySlug,
  getSimilarProducts,
  getActiveProductSlugs,
} from "@/lib/catalog-queries";
import { getSiteSettings } from "@/lib/site-settings";
import { formatPrice } from "@/lib/format";
import { AVAILABILITY_BADGE_CLASS, AVAILABILITY_LABELS, isOrderable } from "@/lib/availability";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ProductCard } from "@/components/shop/product-card";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";

// Pages des produits existants pré-générées à la compilation (servies depuis le
// CDN) ; un produit ajouté ensuite est généré à la première visite puis mis en
// cache. Toute modification faite dans l'admin les régénère.
export async function generateStaticParams() {
  const slugs = await getActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.metaTitle || product.name,
    description: product.metaDescription || product.shortDescription || undefined,
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? undefined,
      images: product.images[0] ? [product.images[0].media.url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [similarProducts, settings] = await Promise.all([
    getSimilarProducts(product.id, product.categoryId),
    getSiteSettings(),
  ]);

  const isOnSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const orderable = isOrderable(product.availability);

  const whatsappMessage = `Bonjour, je suis intéressé(e) par "${product.name}" (${formatPrice(product.price)}). Est-il disponible ?`;
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(whatsappMessage)}`
    : null;

  // Données structurées produit (SEO) — cahier des charges section 16.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.images.map((img) => img.media.url),
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: settings.currency,
      price: product.price,
      availability:
        product.availability === "AVAILABLE"
          ? "https://schema.org/InStock"
          : "https://schema.org/PreOrder",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 pb-28 sm:py-10 sm:pb-10">
      <script
        type="application/ld+json"
        // JSON.stringify n'échappe pas "</" : un nom/description produit
        // contenant "</script>" pourrait sinon casser hors du tag et injecter
        // du HTML/JS (XSS stocké via une fiche produit malveillante).
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav className="mb-4 text-sm text-muted-foreground sm:mb-6">
        <Link href="/catalogue" className="hover:text-primary">
          Boutique
        </Link>
        {" / "}
        <Link href={`/catalogue/${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        {" / "}
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        <ProductGallery
          images={product.images.map((img) => ({
            url: img.media.url,
            altText: img.media.altText,
            isVideo: img.media.type === "VIDEO",
          }))}
          productName={product.name}
        />

        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          {product.brand && <p className="mt-1 text-sm text-muted-foreground">{product.brand}</p>}

          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-xs ${AVAILABILITY_BADGE_CLASS[product.availability]}`}
          >
            {AVAILABILITY_LABELS[product.availability]}
          </span>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {product.priceTiers.length > 0 ? "À partir de " : ""}
              {formatPrice(product.price)}
            </span>
            {isOnSale && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>

          {product.priceTiers.length > 0 && (
            <table className="mt-3 text-sm">
              <caption className="sr-only">Tarif dégressif par quantité</caption>
              <tbody>
                <tr>
                  <td className="pr-4 text-muted-foreground">1 unité</td>
                  <td>{formatPrice(product.price)}</td>
                </tr>
                {product.priceTiers.map((tier, i) => {
                  const next = product.priceTiers[i + 1];
                  const label = next
                    ? `${tier.minQuantity} à ${next.minQuantity - 1} unités`
                    : `${tier.minQuantity} unités et plus`;
                  return (
                    <tr key={tier.id}>
                      <td className="pr-4 text-muted-foreground">{label}</td>
                      <td>{formatPrice(tier.unitPrice)} / unité</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {product.shortDescription && (
            <p className="mt-4 text-muted-foreground">{product.shortDescription}</p>
          )}

          {product.attributes.length > 0 && (
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {product.attributes.map((attr) => (
                <div key={attr.id} className="contents">
                  <dt className="text-muted-foreground">{attr.name}</dt>
                  <dd>{attr.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:mt-8">
            {orderable ? (
              <AddToCartButton productId={product.id} />
            ) : (
              <p className="rounded border border-border bg-surface-muted px-4 py-3 text-center text-sm text-muted-foreground">
                {AVAILABILITY_LABELS[product.availability]} — contactez-nous pour plus
                d&apos;informations.
              </p>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-center text-sm text-primary hover:underline"
              >
                Une question sur ce produit ? Écrivez-nous sur WhatsApp
              </a>
            )}
          </div>

          <ul className="mt-6 flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
            <li>
              <strong className="font-semibold text-foreground">Livraison :</strong> à Yaoundé, et expédition dans
              le reste du Cameroun.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Paiement :</strong> à la livraison à Yaoundé, ou
              par Mobile Money (MTN / Orange Money).
            </li>
          </ul>

          {product.description && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="mb-2 font-semibold">Description</h2>
              <p className="whitespace-pre-line text-muted-foreground">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      {similarProducts.length > 0 && (
        <section className="mt-12 sm:mt-16">
          <h2 className="mb-6 text-xl font-semibold">Produits similaires</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
