import "dotenv/config";
import crypto from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

type CategorySeed = {
  name: string;
  slug: string;
  icon?: string;
  children?: { name: string; slug: string }[];
};

// Catégories initiales du cahier des charges (section 6). Entièrement modifiables
// depuis l'administration ensuite — ceci n'est qu'un jeu de données de départ.
const CATEGORIES: CategorySeed[] = [
  {
    name: "Queues de billard",
    slug: "queues-de-billard",
    icon: "🎱",
    children: [
      { name: "Queues de jeu", slug: "queues-de-jeu" },
      { name: "Queues de break", slug: "queues-de-break" },
      { name: "Queues de jump", slug: "queues-de-jump" },
      { name: "Queues jump-break", slug: "queues-jump-break" },
      { name: "Queues en bois", slug: "queues-en-bois" },
      { name: "Queues en carbone", slug: "queues-en-carbone" },
      { name: "Queues 2 pièces", slug: "queues-2-pieces" },
      { name: "Queues pour débutants", slug: "queues-debutants" },
      { name: "Queues professionnelles", slug: "queues-professionnelles" },
    ],
  },
  {
    name: "Gants de billard",
    slug: "gants-de-billard",
    icon: "🧤",
    children: [
      { name: "Main gauche", slug: "gants-main-gauche" },
      { name: "Main droite", slug: "gants-main-droite" },
    ],
  },
  {
    name: "Craies",
    slug: "craies",
    icon: "🟦",
    children: [
      { name: "Craies standard", slug: "craies-standard" },
      { name: "Craies professionnelles", slug: "craies-professionnelles" },
      { name: "Craies premium", slug: "craies-premium" },
      { name: "Craies à l'unité", slug: "craies-a-lunite" },
      { name: "Boîtes de craies", slug: "boites-de-craies" },
    ],
  },
  {
    name: "Procédés / Tips",
    slug: "procedes-tips",
    icon: "🎯",
    children: [
      { name: "Procédés souples", slug: "procedes-souples" },
      { name: "Procédés médiums", slug: "procedes-mediums" },
      { name: "Procédés durs", slug: "procedes-durs" },
      { name: "Procédés multicouches", slug: "procedes-multicouches" },
      { name: "Différentes tailles", slug: "procedes-tailles" },
    ],
  },
  {
    name: "Étuis et sacs",
    slug: "etuis-et-sacs",
    icon: "🧳",
    children: [
      { name: "Étuis souples", slug: "etuis-souples" },
      { name: "Étuis rigides", slug: "etuis-rigides" },
      { name: "Étuis 1x1", slug: "etuis-1x1" },
      { name: "Étuis 2x2", slug: "etuis-2x2" },
      { name: "Étuis 3x5", slug: "etuis-3x5" },
      { name: "Étuis 4x8", slug: "etuis-4x8" },
      { name: "Sacs de transport", slug: "sacs-de-transport" },
    ],
  },
  {
    name: "Boules",
    slug: "boules",
    icon: "🔵",
    children: [
      { name: "Sets 8-ball", slug: "sets-8-ball" },
      { name: "Sets 9-ball", slug: "sets-9-ball" },
      { name: "Sets 10-ball", slug: "sets-10-ball" },
      { name: "Boules blanches", slug: "boules-blanches" },
      { name: "Boules individuelles", slug: "boules-individuelles" },
      { name: "Boules de remplacement", slug: "boules-de-remplacement" },
    ],
  },
  {
    name: "Racks et triangles",
    slug: "racks-et-triangles",
    icon: "🔺",
    children: [
      { name: "Racks 8-ball", slug: "racks-8-ball" },
      { name: "Racks 9-ball", slug: "racks-9-ball" },
      { name: "Racks 10-ball", slug: "racks-10-ball" },
      { name: "Racks standards", slug: "racks-standards" },
      { name: "Racks de précision", slug: "racks-precision" },
      { name: "Racks magnétiques", slug: "racks-magnetiques" },
    ],
  },
  {
    name: "Entretien et réparation",
    slug: "entretien-et-reparation",
    icon: "🛠️",
    children: [
      { name: "Outils pour procédés", slug: "outils-pour-procedes" },
      { name: "Colles", slug: "colles" },
      { name: "Papier abrasif", slug: "papier-abrasif" },
      { name: "Nettoyants", slug: "nettoyants-queue" },
      { name: "Polish", slug: "polish" },
      { name: "Chiffons", slug: "chiffons" },
      { name: "Outils de réparation", slug: "outils-de-reparation" },
    ],
  },
  {
    name: "Rallonges et accessoires",
    slug: "rallonges-et-accessoires",
    icon: "📏",
    children: [
      { name: "Rallonges", slug: "rallonges" },
      { name: "Extensions", slug: "extensions" },
      { name: "Adaptateurs", slug: "adaptateurs" },
      { name: "Bridges", slug: "bridges" },
      { name: "Repose-queues", slug: "repose-queues" },
      { name: "Spider", slug: "spider" },
      { name: "Cross rest", slug: "cross-rest" },
    ],
  },
  {
    name: "Entretien des tables",
    slug: "entretien-des-tables",
    icon: "🧹",
    children: [
      { name: "Brosses", slug: "brosses" },
      { name: "Nettoyants", slug: "nettoyants-table" },
      { name: "Housses", slug: "housses" },
      { name: "Accessoires d'entretien", slug: "accessoires-entretien-table" },
    ],
  },
  {
    name: "Accessoires de table et de salle",
    slug: "accessoires-table-et-salle",
    icon: "🪑",
    children: [
      { name: "Supports pour queues", slug: "supports-pour-queues" },
      { name: "Porte-queues", slug: "porte-queues" },
      { name: "Compteurs", slug: "compteurs" },
      {
        name: "Accessoires pour salles de billard",
        slug: "accessoires-salles-billard",
      },
    ],
  },
  {
    name: "Vêtements et accessoires",
    slug: "vetements-et-accessoires",
    icon: "👕",
    children: [
      { name: "T-shirts", slug: "t-shirts" },
      { name: "Polos", slug: "polos" },
      { name: "Casquettes", slug: "casquettes" },
      { name: "Sacs", slug: "sacs-vetements" },
      { name: "Goodies", slug: "goodies" },
    ],
  },
  {
    name: "Compétition",
    slug: "competition",
    icon: "🏆",
    children: [
      { name: "Trophées", slug: "trophees" },
      { name: "Coupes", slug: "coupes" },
      { name: "Médailles", slug: "medailles" },
      { name: "Accessoires de tournoi", slug: "accessoires-tournoi" },
    ],
  },
];

// Médias de démonstration libres de droits (Unsplash "source" placeholders).
// À remplacer par la médiathèque Cloudinary dès que les clés seront configurées.
function placeholderMedia(seed: string) {
  return `https://picsum.photos/seed/${seed}/800/800`;
}

async function main() {
  console.log("Seed: catégories...");
  for (const [position, cat] of CATEGORIES.entries()) {
    const parent = await db.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, icon: cat.icon, position },
      create: { name: cat.name, slug: cat.slug, icon: cat.icon, position },
    });

    for (const [childPosition, child] of (cat.children ?? []).entries()) {
      await db.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          parentId: parent.id,
          position: childPosition,
        },
        create: {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
          position: childPosition,
        },
      });
    }
  }

  console.log("Seed: paramètres boutique...");
  const existingSettings = await db.siteSettings.findFirst();
  if (!existingSettings) {
    await db.siteSettings.create({
      data: {
        storeName: "ALINO-Billard",
        whatsappNumber: "+237600000000",
        mtnNumber: "+237600000000",
        orangeNumber: "+237690000000",
        contactEmail: "contact@alino-billard.com",
        currency: "XAF",
        taxEnabled: false,
        taxRate: 19.25,
      },
    });
  }

  console.log("Seed: compte super-admin de démonstration...");
  const adminEmail = "admin@alino-billard.com";
  // Jamais de mot de passe écrit dans le code (le dépôt est versionné) : il vient
  // de SEED_ADMIN_PASSWORD, sinon un mot de passe aléatoire est généré et
  // affiché une seule fois à la fin de l'exécution.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Super Admin ALINO-Billard",
      email: adminEmail,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(
    process.env.SEED_ADMIN_PASSWORD
      ? `   -> ${adminEmail} (mot de passe : SEED_ADMIN_PASSWORD)`
      : `   -> ${adminEmail} / ${adminPassword} (généré, à noter maintenant : il n'est plus affiché ensuite)`,
  );

  console.log("Seed: compte livreur de démonstration...");
  const deliveryEmail = "livreur@alino-billard.com";
  const deliveryPassword =
    process.env.SEED_DELIVERY_PASSWORD || crypto.randomBytes(12).toString("base64url");
  const deliveryPasswordHash = await bcrypt.hash(deliveryPassword, 12);
  await db.user.upsert({
    where: { email: deliveryEmail },
    update: {},
    create: {
      name: "Livreur Démo",
      email: deliveryEmail,
      passwordHash: deliveryPasswordHash,
      role: "DELIVERY",
    },
  });
  console.log(
    process.env.SEED_DELIVERY_PASSWORD
      ? `   -> ${deliveryEmail} (mot de passe : SEED_DELIVERY_PASSWORD)`
      : `   -> ${deliveryEmail} / ${deliveryPassword} (généré, à noter maintenant)`,
  );

  console.log("Seed: produits de démonstration...");
  const queuesJeu = await db.category.findUniqueOrThrow({
    where: { slug: "queues-de-jeu" },
  });
  const setsHuit = await db.category.findUniqueOrThrow({
    where: { slug: "sets-8-ball" },
  });
  const craiesPro = await db.category.findUniqueOrThrow({
    where: { slug: "craies-professionnelles" },
  });
  const etuisRigides = await db.category.findUniqueOrThrow({
    where: { slug: "etuis-rigides" },
  });
  const gantsDroite = await db.category.findUniqueOrThrow({
    where: { slug: "gants-main-droite" },
  });

  const demoProducts = [
    {
      slug: "queue-predator-p3-carbone",
      name: "Queue Predator P3 Carbone",
      shortDescription: "Queue de jeu professionnelle en fibre de carbone.",
      description:
        "Queue de jeu haut de gamme à flèche carbone, idéale pour les joueurs confirmés recherchant précision et faible déviation.",
      price: 185000,
      compareAtPrice: 210000,
      categoryId: queuesJeu.id,
      brand: "Predator",
      isFeatured: true,
      availability: "TO_CONFIRM" as const,
      seed: "queue1",
    },
    {
      slug: "set-boules-aramith-8-ball",
      name: "Set de boules Aramith 8-Ball",
      shortDescription: "Set complet de boules 8-ball professionnelles.",
      description:
        "Set de boules Aramith Premier, standard des compétitions internationales de 8-ball.",
      price: 65000,
      categoryId: setsHuit.id,
      brand: "Aramith",
      isFeatured: true,
      availability: "AVAILABLE" as const,
      seed: "balls1",
    },
    {
      slug: "craie-master-professionnelle",
      name: "Craie Master Professionnelle (boîte de 12)",
      shortDescription: "La référence des joueurs professionnels.",
      description:
        "Boîte de 12 craies Master, adhérence optimale et régularité reconnue par les professionnels.",
      price: 8000,
      categoryId: craiesPro.id,
      brand: "Master",
      isFeatured: false,
      availability: "AVAILABLE" as const,
      seed: "chalk1",
    },
    {
      slug: "etui-rigide-2x2-noir",
      name: "Étui rigide 2x2 Noir Premium",
      shortDescription: "Protection maximale pour deux queues démontées.",
      description:
        "Étui rigide capitonné pour 2 flèches et 2 fûts, idéal pour le transport en toute sécurité.",
      price: 45000,
      categoryId: etuisRigides.id,
      isFeatured: false,
      availability: "ON_ORDER" as const,
      seed: "case1",
    },
    {
      slug: "gant-billard-main-droite-mesh",
      name: "Gant de billard Mesh - Main droite",
      shortDescription: "Glisse parfaite, respirant, taille unique ajustable.",
      description:
        "Gant en tissu mesh respirant pour un contrôle optimal du pont, main droite, taille unique ajustable.",
      price: 5000,
      categoryId: gantsDroite.id,
      isFeatured: false,
      availability: "AVAILABLE" as const,
      seed: "glove1",
    },
  ];

  for (const p of demoProducts) {
    const { seed, ...data } = p;
    const product = await db.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...data, availabilityCheckedAt: new Date() },
    });

    const existingImage = await db.productImage.findFirst({
      where: { productId: product.id },
    });
    if (!existingImage) {
      const media = await db.media.create({
        data: {
          type: "IMAGE",
          url: placeholderMedia(seed),
          publicId: `demo/${seed}`,
          altText: p.name,
        },
      });
      await db.productImage.create({
        data: {
          productId: product.id,
          mediaId: media.id,
          isPrimary: true,
          position: 0,
        },
      });
    }
  }

  console.log("Seed: services de démonstration...");
  const demoServices = [
    {
      slug: "installation-table-de-billard",
      name: "Installation de table de billard",
      description:
        "Installation complète et mise à niveau professionnelle de votre table de billard.",
      pricingType: "STARTING_AT" as const,
      price: 50000,
      durationEstimate: "2 à 4 heures",
      interventionZone: "Douala, Yaoundé",
    },
    {
      slug: "changement-de-procede",
      name: "Changement de procédé (Tip)",
      description:
        "Remplacement professionnel du procédé de votre queue de billard.",
      pricingType: "FIXED" as const,
      price: 5000,
      durationEstimate: "30 minutes",
      interventionZone: "Boutique ou à domicile",
    },
  ];

  for (const s of demoServices) {
    await db.service.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }

  console.log("Seed: zones et tarifs de livraison...");
  const deliveryZones = [
    { name: "Douala", rates: [{ method: "STANDARD" as const, price: 2000 }, { method: "EXPRESS" as const, price: 5000 }] },
    { name: "Yaoundé", rates: [{ method: "STANDARD" as const, price: 2500 }, { method: "EXPRESS" as const, price: 6000 }] },
    { name: "Autres villes (Cameroun)", rates: [{ method: "STANDARD" as const, price: 4000 }] },
  ];
  for (const z of deliveryZones) {
    const existing = await db.deliveryZone.findFirst({ where: { name: z.name } });
    if (existing) continue;
    await db.deliveryZone.create({
      data: { name: z.name, rates: { create: z.rates } },
    });
  }

  console.log("Seed terminé.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
