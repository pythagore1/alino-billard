import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";

export const metadata: Metadata = {
  title: "Guide d'achat",
  description:
    "Comment commander sur Alino Billard & Accessoires : choisir, payer par Mobile Money ou à la livraison, et suivre votre commande.",
};

const linkClass = "text-primary hover:underline";

export default async function GuidePage() {
  const settings = await getSiteSettings();
  const bannerPhoto = getBannerPhotoUrl("boutique");
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;
  const expeditionPercent = settings.expeditionFeePercent;

  const steps = [
    {
      title: "Trouver un produit",
      body: (
        <>
          Parcourez la{" "}
          <Link href="/catalogue" className={linkClass}>
            boutique
          </Link>{" "}
          par catégorie ou utilisez la recherche. La disponibilité de chaque produit est indiquée sur sa
          fiche.
        </>
      ),
    },
    {
      title: "Ajouter au panier",
      body: (
        <>
          Cliquez sur « Ajouter » depuis la liste des produits ou depuis la fiche, puis modifiez la
          quantité dans le panier si besoin. Aucun compte n&apos;est nécessaire : le panier reste actif
          sur cet appareil.
        </>
      ),
    },
    {
      title: "Passer commande",
      body: (
        <>
          Indiquez votre nom, votre téléphone, votre région, votre ville et votre quartier. Les options de
          livraison et de paiement dépendent de votre ville. Un compte est facultatif : en le créant (avec
          votre numéro, l&apos;e-mail est optionnel), vous retrouvez toutes vos commandes dans{" "}
          <Link href="/compte" className={linkClass}>
            Mon compte
          </Link>
          .
        </>
      ),
    },
    {
      title: "Payer",
      body: (
        <>
          <strong className="font-semibold text-foreground">À Yaoundé</strong> : paiement en espèces à la
          livraison, ou par Mobile Money (MTN ou Orange Money).{" "}
          <strong className="font-semibold text-foreground">Dans les autres villes</strong> : expédition de
          votre commande et paiement par Mobile Money uniquement. Le paiement Mobile Money se fait sur une
          page de paiement sécurisée : vous ne saisissez jamais vos codes sur notre site.
        </>
      ),
    },
    {
      title: "Suivre votre commande",
      body: (
        <>
          Une fois la commande validée, vous recevez une référence du type RB-0142. Avec cette référence et
          votre téléphone, la page{" "}
          <Link href="/suivi" className={linkClass}>
            Suivi de commande
          </Link>{" "}
          affiche son avancement et permet de télécharger votre facture. Le reçu est disponible lorsque la
          commande est payée et livrée.
        </>
      ),
    },
  ];

  const faq = [
    {
      q: "Dois-je créer un compte pour commander ?",
      a: "Non. Votre nom et votre numéro de téléphone suffisent. Le compte est facultatif et sert à retrouver vos commandes au même endroit.",
    },
    {
      q: "Quels moyens de paiement sont acceptés ?",
      a: "À Yaoundé : espèces à la livraison, MTN Mobile Money ou Orange Money. Dans les autres villes : Mobile Money (MTN ou Orange Money).",
    },
    {
      q: "Combien coûte la livraison ?",
      a: `À Yaoundé, le tarif s'affiche selon le mode choisi (standard, express ou retrait) avant la confirmation. Dans les autres villes, l'expédition représente ${expeditionPercent} % du montant de votre commande, indiqué avant la confirmation.`,
    },
    {
      q: "Comment suivre ma commande ?",
      a: "Rendez-vous sur la page Suivi de commande et saisissez votre référence (par exemple RB-0142) et le téléphone utilisé pour la commande.",
    },
    {
      q: "Où trouver ma facture ou mon reçu ?",
      a: "Sur la page Suivi de commande, après avoir saisi votre référence et votre téléphone. La facture est téléchargeable dès cet instant ; le reçu l'est une fois la commande payée et livrée.",
    },
  ];

  return (
    <div>
      <section className="relative overflow-hidden text-ink-foreground">
        <BannerBackground photoUrl={bannerPhoto} priority />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:py-14">
          <span className="text-[13px] font-medium uppercase tracking-[0.18em] text-primary sm:text-lg">
            ALINO BILLARD & ACCESSOIRES
          </span>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Guide d&apos;achat</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/80">
            Commander sur {settings.storeName} en quelques étapes, avec ou sans compte.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display mb-6 text-2xl font-bold sm:text-3xl">Les étapes</h2>
          <ol className="flex flex-col gap-4">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
              >
                <span className="font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-bold text-primary">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <h2 className="font-display mt-12 mb-6 text-2xl font-bold sm:text-3xl">Questions fréquentes</h2>
          <div className="flex flex-col gap-3">
            {faq.map((item) => (
              <details key={item.q} className="group rounded-xl border border-border bg-surface">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <span aria-hidden className="shrink-0 text-primary transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      <section className="bg-cream-muted">
        <div className="mx-auto max-w-7xl px-4 py-10 text-center sm:py-14">
          <h2 className="font-display text-2xl font-bold">Besoin d&apos;aide ?</h2>
          <p className="mx-auto mt-2 max-w-xl text-balance text-muted-foreground">
            Une question avant de commander ou sur une commande en cours : écrivez-nous.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center rounded-full bg-[#25D366] px-6 py-3 font-medium text-white hover:opacity-90"
              >
                Écrire sur WhatsApp
              </a>
            )}
            <Link
              href="/contact"
              className="flex min-h-12 items-center justify-center rounded-full border border-ink/30 px-6 py-3 font-medium hover:border-primary hover:text-primary"
            >
              Page Contact
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/catalogue" className="flex min-h-11 items-center text-muted-foreground hover:text-primary">
              Boutique
            </Link>
            <Link href="/suivi" className="flex min-h-11 items-center text-muted-foreground hover:text-primary">
              Suivi de commande
            </Link>
            <Link href="/contact" className="flex min-h-11 items-center text-muted-foreground hover:text-primary">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
