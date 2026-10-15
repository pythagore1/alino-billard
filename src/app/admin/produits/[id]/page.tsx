import { notFound } from "next/navigation";
import { getAllCategoriesForSelect } from "@/server/actions/categories";
import { getProductForAdmin } from "@/server/actions/products";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageManager } from "@/components/admin/product-image-manager";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductForAdmin(id),
    getAllCategoriesForSelect(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-6 text-xl font-semibold">Modifier le produit</h1>
        <ProductForm product={product} categories={categories} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Images</h2>
        <ProductImageManager
          productId={product.id}
          productSlug={product.slug}
          categorySlug={product.category.slug}
          images={product.images}
        />
      </div>
    </div>
  );
}
