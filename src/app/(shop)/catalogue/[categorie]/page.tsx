import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCategoryBySlug,
  getCategoryTree,
  getRootCategoryProductCounts,
  getProductsForCatalog,
  getActiveCategorySlugs,
  type CatalogSort,
} from "@/lib/catalog-queries";
import { ProductCard } from "@/components/shop/product-card";
import { CatalogFilters } from "@/components/shop/catalog-filters";
import { CategorySidebar } from "@/components/shop/category-sidebar";
import { CatalogueSkeleton } from "@/components/shop/catalogue-skeleton";
import { Pagination } from "@/components/shop/pagination";
import { cloudinaryOptimized } from "@/lib/cloudinary-url";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";

type SearchParams = Promise<{ q?: string; tri?: string; page?: string }>;

// Pages des catégories existantes pré-générées à la compilation ; une catégorie
// ajoutée ensuite est générée à la première visite puis mise en cache.
export async function generateStaticParams() {
  const slugs = await getActiveCategorySlugs();
  return slugs.map((categorie) => ({ categorie }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorie: string }>;
}): Promise<Metadata> {
  const { categorie } = await params;
  const category = await getCategoryBySlug(categorie);
  if (!category) return {};
  return {
    title: category.name,
    description: `${category.name} — billard 8-ball, 9-ball, 10-ball chez Alino Billard & Accessoires.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorie: string }>;
  searchParams: SearchParams;
}) {
  const { categorie } = await params;
  const category = await getCategoryBySlug(categorie);
  if (!category) notFound();

  const bannerPhoto = getBannerPhotoUrl("boutique");

  return (
    <div>
      <section className="relative overflow-hidden text-ink-foreground">
        <BannerBackground photoUrl={bannerPhoto} priority />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <nav className="mb-2 text-sm text-ink-foreground/70">
            <Link href="/catalogue" className="hover:text-primary">
              Boutique
            </Link>
            {category.parent && (
              <>
                {" / "}
                <Link href={`/catalogue/${category.parent.slug}`} className="hover:text-primary">
                  {category.parent.name}
                </Link>
              </>
            )}
            {" / "}
            <span>{category.name}</span>
          </nav>
          <h1 className="font-display flex items-center gap-2 text-3xl font-bold sm:text-4xl">
            {category.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element -- optimisée via cloudinaryOptimized() */
              <img
                src={cloudinaryOptimized(category.imageUrl, 40)}
                alt=""
                className="h-9 w-9 rounded object-cover"
              />
            ) : (
              category.icon && <span aria-hidden>{category.icon}</span>
            )}
            {category.name}
          </h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
        {category.children.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {category.children.map((child) => (
              <Link
                key={child.id}
                href={`/catalogue/${child.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary hover:text-primary"
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}

        <Suspense fallback={<CatalogueSkeleton />}>
          <CategoryProducts
            categorie={categorie}
            activeRootSlug={category.parent?.slug ?? category.slug}
            searchParams={searchParams}
          />
        </Suspense>
      </div>
    </div>
  );
}

async function CategoryProducts({
  categorie,
  activeRootSlug,
  searchParams,
}: {
  categorie: string;
  // Sidebar surlignée sur la catégorie racine (soit celle-ci, soit son parent
  // si on est sur une sous-catégorie).
  activeRootSlug: string;
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const page = query.page ? Number(query.page) : 1;
  const sort = (query.tri as CatalogSort) || "newest";

  const [{ products, total, pageSize }, rootCategories, counts] = await Promise.all([
    getProductsForCatalog({ categorySlug: categorie, search: query.q, sort, page }),
    getCategoryTree(),
    getRootCategoryProductCounts(),
  ]);
  const totalCount = [...counts.values()].reduce((sum, n) => sum + n, 0);

  return (
    <>
      <CatalogFilters search={query.q} sort={sort} basePath={`/catalogue/${categorie}`} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr] sm:gap-8">
        <CategorySidebar
          categories={rootCategories}
          activeSlug={activeRootSlug}
          counts={counts}
          totalCount={totalCount}
        />

        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">Nos produits</h2>
            <span className="text-sm text-muted-foreground">{total} produit(s)</span>
          </div>

          {products.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                Aucun produit disponible dans cette catégorie pour le moment.
              </p>
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
            basePath={`/catalogue/${categorie}`}
            searchParams={{ q: query.q, tri: query.tri }}
          />
        </div>
      </div>
    </>
  );
}
