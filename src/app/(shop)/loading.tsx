export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-56 animate-pulse rounded bg-border" />
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-lg bg-border/60" />
        ))}
      </div>
    </div>
  );
}
