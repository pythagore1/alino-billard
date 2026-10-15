/**
 * Regroupe une liste de catégories à plat en ordre hiérarchique (chaque
 * parent suivi immédiatement de ses enfants), en conservant l'ordre relatif
 * fourni en entrée à l'intérieur de chaque groupe. Partagé entre les selects
 * admin et la liste des catégories pour éviter qu'un tri à plat (alphabétique
 * ou autre) ne mélange les sous-catégories entre différents parents.
 */
export function sortCategoriesHierarchically<T extends { id: string; parentId: string | null }>(
  categories: T[],
): T[] {
  const roots = categories.filter((c) => c.parentId === null);
  const childrenByParent = new Map<string, T[]>();
  for (const c of categories) {
    if (c.parentId === null) continue;
    if (!childrenByParent.has(c.parentId)) childrenByParent.set(c.parentId, []);
    childrenByParent.get(c.parentId)!.push(c);
  }
  return roots.flatMap((root) => [root, ...(childrenByParent.get(root.id) ?? [])]);
}
