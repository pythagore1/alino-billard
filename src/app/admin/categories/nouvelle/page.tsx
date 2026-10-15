import { getAllCategoriesForSelect } from "@/server/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";

export default async function NewCategoryPage() {
  const allCategories = await getAllCategoriesForSelect();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Nouvelle catégorie</h1>
      <CategoryForm allCategories={allCategories} />
    </div>
  );
}
