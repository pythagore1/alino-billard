import { notFound } from "next/navigation";
import {
  getAllCategoriesForSelect,
  getCategoryForAdmin,
} from "@/server/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, allCategories] = await Promise.all([
    getCategoryForAdmin(id),
    getAllCategoriesForSelect(),
  ]);

  if (!category) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Modifier la catégorie</h1>
      <CategoryForm category={category} allCategories={allCategories} />
    </div>
  );
}
