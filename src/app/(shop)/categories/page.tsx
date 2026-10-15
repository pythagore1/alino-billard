import type { Metadata } from "next";
import { getCategoryTree, getRootCategoryProductCounts } from "@/lib/catalog-queries";
import { CategoryCard } from "@/components/shop/category-card";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";

export const metadata: Metadata = {
  title: "Catégories",
  description: "Explorez les univers Alino Billard & Accessoires : queues, boules, procédés, accessoires et plus.",
};

export default async function CategoriesPage() {
  const [allCategories, counts] = await Promise.all([getCategoryTree(), getRootCategoryProductCounts()]);
  const categories = allCategories.filter((category) => (counts.get(category.id) ?? 0) > 0);
  const bannerPhoto = getBannerPhotoUrl("categories");

  return (
    <div>
      <section className="relative overflow-hidden text-ink-foreground">
        <BannerBackground photoUrl={bannerPhoto} priority />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">
            ALINO BILLARD & ACCESSOIRES
          </span>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Catégories</h1>
          <p className="mt-2 text-ink-foreground/80">Explorez les univers Alino Billard & Accessoires.</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              slug={category.slug}
              name={category.name}
              imageUrl={category.imageUrl}
              count={counts.get(category.id) ?? 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
