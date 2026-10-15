import type { Metadata } from "next";
import { PageHero } from "@/components/shop/page-hero";
import { InscriptionForm } from "./inscription-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  return (
    <div>
      <PageHero title="Créer un compte" subtitle="Retrouvez vos commandes et vos documents au même endroit." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <InscriptionForm />
      </div>
    </div>
  );
}
