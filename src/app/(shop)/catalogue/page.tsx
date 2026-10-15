import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  getProductsForCatalog,
  getCategoryTree,
  getRootCategoryProductCounts,
  type CatalogSort,
} from "@/lib/catalog-queries";
import { ProductCard } from "@/components/shop/product-card";
import { CatalogFilters } from "@/components/shop/catalog-filters";
import { CategorySidebar } from "@/components/shop/category-sidebar";
import { CatalogueSkeleton } from "@/components/shop/catalogue-skeleton";
import { Pagination } from "@/components/shop/pagination";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Tous les produits de billard Alino Billard & Accessoires : queues, boules, procédés, accessoires.",
};

type SearchParams = Promise<{ q?: string; tri?: string; page?: string }>;

// La bannière fait partie de la page servie depuis le cache ; seule la liste,
// qui dépend de la recherche, du tri et de la page demandés, arrive ensuite.
export default function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const bannerPhoto = getBannerPhotoUrl("boutique");

  return (
    <div>
      <section className="relative overflow-hidden text-ink-foreground">
        <BannerBackground photoUrl={bannerPhoto} priority />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">ALINO BILLARD & ACCESSOIRES</span>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">La boutique</h1>
          <p className="mt-2 text-ink-foreground/80">Parcourez les produits et composez votre commande.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        <Suspense fallback={<CatalogueSkeleton />}>
          <CatalogueContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function CatalogueContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = params.page ? Number(params.page) : 1;
  const sort = (params.tri as CatalogSort) || "newest";

  const [{ products, total, pageSize }, categories, counts] = await Promise.all([
    getProductsForCatalog({ search: params.q, sort, page }),
    getCategoryTree(),
    getRootCategoryProductCounts(),
  ]);
  const totalCount = [...counts.values()].reduce((sum, n) => sum + n, 0);

  return (
    <>
      <CatalogFilters search={params.q} sort={sort} basePath="/catalogue" />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr] sm:gap-8">
        <CategorySidebar categories={categories} counts={counts} totalCount={totalCount} />

        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">Nos produits</h2>
            <span className="text-sm text-muted-foreground">{total} produit(s)</span>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">Aucun produit ne correspond à votre recherche.</p>
              <Link href="/catalogue" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                Voir tous les produits →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            basePath="/catalogue"
            searchParams={{ q: params.q, tri: params.tri }}
          />
        </div>
      </div>
    </>
  );
}
