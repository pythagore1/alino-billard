import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SERVICES_ENABLED } from "@/lib/features";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, services] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    SERVICES_ENABLED
      ? db.service.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } })
      : Promise.resolve([]),
  ]);

  return [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/catalogue`, priority: 0.9 },
    ...(SERVICES_ENABLED ? [{ url: `${SITE_URL}/services`, priority: 0.8 }] : []),
    { url: `${SITE_URL}/a-propos`, priority: 0.3 },
    { url: `${SITE_URL}/contact`, priority: 0.3 },
    ...categories.map((c) => ({
      url: `${SITE_URL}/catalogue/${c.slug}`,
      priority: 0.7,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/produit/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
    })),
    ...services.map((s) => ({
      url: `${SITE_URL}/services/${s.slug}`,
      lastModified: s.updatedAt,
      priority: 0.5,
    })),
  ];
}
