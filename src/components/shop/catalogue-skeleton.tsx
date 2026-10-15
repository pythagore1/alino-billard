/** Emplacement affiché pendant le chargement de la liste de produits (filtres + grille). */
export function CatalogueSkeleton() {
  return (
    <div aria-busy="true" aria-label="Chargement des produits">
      <div className="mb-6 h-11 w-full animate-pulse rounded-full bg-border/60" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-[220px_1fr] sm:gap-8">
        <div className="hidden h-64 animate-pulse rounded-xl bg-border/60 sm:block" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-border/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
