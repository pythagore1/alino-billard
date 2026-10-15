import Link from "next/link";
import {
  listCategoriesForAdmin,
  type CategoryAdminSort,
} from "@/server/actions/categories";
import { CategoriesTable } from "@/components/admin/categories-table";
import { inputClass, primaryButtonClass, secondaryButtonClass } from "@/lib/ui";

const SORT_LABELS: Record<CategoryAdminSort, string> = {
  hierarchy: "Hiérarchie (parent > enfants)",
  name_asc: "Nom (A → Z)",
  name_desc: "Nom (Z → A)",
  products_desc: "Nombre de produits (décroissant)",
};

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sort = (params.sort as CategoryAdminSort) || "hierarchy";
  const categories = await listCategoriesForAdmin({ search: params.search, sort });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Catégories</h1>
        <Link href="/admin/categories/nouvelle" className={primaryButtonClass}>
          + Nouvelle catégorie
        </Link>
      </div>

      <form className="mb-4 flex flex-wrap gap-2" method="GET">
        <input
          type="text"
          name="search"
          defaultValue={params.search}
          placeholder="Nom de la catégorie..."
          className={inputClass}
        />
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

      <CategoriesTable categories={categories} />
    </div>
  );
}
