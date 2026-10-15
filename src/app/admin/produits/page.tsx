import Link from "next/link";
import { listProductsForAdmin, type ProductAdminSort } from "@/server/actions/products";
import { getAllCategoriesForSelect } from "@/server/actions/categories";
import { ProductsTable } from "@/components/admin/products-table";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";
import type { Availability } from "@/generated/prisma/enums";

const AVAILABILITY_LABELS: Record<Availability, string> = {
  AVAILABLE: "Disponible",
  TO_CONFIRM: "À confirmer",
  ON_ORDER: "Sur commande",
  OUT_OF_STOCK: "Rupture",
  DISABLED: "Désactivé",
};

const SORT_LABELS: Record<ProductAdminSort, string> = {
  updated_desc: "Dernière modification",
  name_asc: "Nom (A → Z)",
  name_desc: "Nom (Z → A)",
  price_asc: "Prix croissant",
  price_desc: "Prix décroissant",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    availability?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const sort = (params.sort as ProductAdminSort) || "updated_desc";
  const [products, categories] = await Promise.all([
    listProductsForAdmin({
      search: params.search,
      categoryId: params.categoryId,
      availability: params.availability as Availability | undefined,
      sort,
    }),
    getAllCategoriesForSelect(),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Produits</h1>
        <Link href="/admin/produits/nouveau" className={primaryButtonClass}>
          + Nouveau produit
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Nom ou SKU..."
          className={inputClass}
        />
        <select name="categoryId" defaultValue={params.categoryId ?? ""} className={inputClass}>
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.parentId ? `— ${c.name}` : c.name}
            </option>
          ))}
        </select>
        <select
          name="availability"
          defaultValue={params.availability ?? ""}
          className={inputClass}
        >
          <option value="">Toutes les disponibilités</option>
          {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} className={inputClass}>
          {Object.entries(SORT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className={secondaryButtonClass}>
          Filtrer
        </button>
      </form>

      <ProductsTable products={products} />
    </div>
  );
}
