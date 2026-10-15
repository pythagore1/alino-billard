import Link from "next/link";

type CategoryNode = { id: string; slug: string; name: string; icon: string | null };

export function CategorySidebar({
  categories,
  activeSlug,
  counts,
  totalCount,
}: {
  categories: CategoryNode[];
  activeSlug?: string;
  counts?: Map<string, number>;
  totalCount?: number;
}) {
  const withCount = (name: string, count: number | undefined) =>
    count === undefined ? name : `${name} (${count})`;

  return (
    <>
      {/* Mobile : pastilles à faire défiler au lieu d'une longue liste verticale */}
      <nav
        aria-label="Catégories"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <Link
          href="/catalogue"
          className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap ${
            !activeSlug ? "border-primary bg-primary/15 font-medium text-primary" : "border-border bg-surface"
          }`}
        >
          Tous
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/catalogue/${category.slug}`}
            className={`flex h-11 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap ${
              activeSlug === category.slug
                ? "border-primary bg-primary/15 font-medium text-primary"
                : "border-border bg-surface"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      <aside className="hidden h-fit flex-col gap-1 rounded-xl border border-border bg-surface p-4 sm:sticky sm:top-24 sm:flex">
        <p className="font-display mb-2 text-base font-bold">Catégories</p>
        <Link
          href="/catalogue"
          className={`rounded-lg px-3 py-2 text-sm ${
            !activeSlug ? "bg-primary/15 font-medium text-primary" : "hover:bg-surface-muted"
          }`}
        >
          {withCount("Tous les produits", totalCount)}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/catalogue/${category.slug}`}
            className={`rounded-lg px-3 py-2 text-sm ${
              activeSlug === category.slug
                ? "bg-primary/15 font-medium text-primary"
                : "hover:bg-surface-muted"
            }`}
          >
            {withCount(category.name, counts?.get(category.id))}
          </Link>
        ))}
      </aside>
    </>
  );
}
