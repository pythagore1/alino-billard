import { Suspense } from "react";
import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/site-settings";
import { PageHero } from "@/components/shop/page-hero";
import { ConnexionForm } from "./connexion-form";

export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage() {
  const settings = await getSiteSettings();
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div>
      <PageHero title="Connexion" subtitle="Accédez à vos commandes et à vos documents." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <Suspense>
          <ConnexionForm whatsappHref={whatsappHref} />
        </Suspense>
      </div>
    </div>
  );
}
