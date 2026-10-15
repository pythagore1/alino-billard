import Link from "next/link";

type PageItem = number | "gap-start" | "gap-end";

function pageItems(page: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const items: PageItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push("gap-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("gap-end");
  items.push(totalPages);
  return items;
}

const baseClass = "flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefForPage(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
          aria-label="Page précédente"
          className={`${baseClass} border border-border bg-surface text-primary hover:border-primary`}
        >
          ←<span className="ml-1 hidden sm:inline">Précédent</span>
        </Link>
      ) : null}

      {pageItems(page, totalPages).map((item) =>
        typeof item === "string" ? (
          <span key={item} className="px-1 text-muted-foreground" aria-hidden>
            …
          </span>
        ) : item === page ? (
          <span
            key={item}
            aria-current="page"
            className={`${baseClass} bg-primary font-semibold text-primary-foreground`}
          >
            {item}
          </span>
        ) : (
          <Link
            key={item}
            href={hrefForPage(item)}
            aria-label={`Page ${item}`}
            className={`${baseClass} border border-border bg-surface hover:border-primary hover:text-primary`}
          >
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link
          href={hrefForPage(page + 1)}
          aria-label="Page suivante"
          className={`${baseClass} border border-border bg-surface text-primary hover:border-primary`}
        >
          <span className="mr-1 hidden sm:inline">Suivant</span>→
        </Link>
      ) : null}
    </nav>
  );
}
