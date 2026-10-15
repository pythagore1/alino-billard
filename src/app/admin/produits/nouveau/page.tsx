import { getAllCategoriesForSelect } from "@/server/actions/categories";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await getAllCategoriesForSelect();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Nouveau produit</h1>
      <ProductForm categories={categories} />
      <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
        Enregistre d&apos;abord le produit pour pouvoir y ajouter des images.
      </p>
    </div>
  );
}
