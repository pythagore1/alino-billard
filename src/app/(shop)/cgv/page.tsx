import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { getBannerPhotoUrl } from "@/lib/banner-photo";
import { BannerBackground } from "@/components/shop/banner-background";
import { OWNER_NAME, OWNER_CITY } from "@/lib/seller";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: "Conditions générales de vente de Alino Billard & Accessoires : commande, paiement, livraison et suivi.",
};

// À faire valider par un professionnel du droit avant de les considérer comme
// définitives, en particulier sur la conformité au droit camerounais de la
// consommation. Les articles sur les retours, l'annulation, le remboursement,
// la garantie et les litiges seront ajoutés quand ces politiques seront
// définies — ne rien y inventer.
const LAST_UPDATED = "9 octobre 2026";

const linkClass = "text-primary hover:underline";

export default async function TermsOfSalePage() {
  const settings = await getSiteSettings();
  const bannerPhoto = getBannerPhotoUrl("boutique");
  const whatsappHref = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`
    : null;

  const articles = [
    {
      title: "Objet et vendeur",
      body: (
        <>
          <p>
            Les présentes conditions générales de vente s&apos;appliquent à toute commande passée sur{" "}
            {settings.storeName}.
          </p>
          <p>
            Le site est exploité par {OWNER_NAME}, vendeur individuel, {OWNER_CITY}. Les informations
            complètes figurent dans les{" "}
            <Link href="/mentions-legales" className={linkClass}>
              mentions légales
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      title: "Produits et disponibilité",
      body: (
        <>
          <p>La disponibilité de chaque produit est indiquée sur sa fiche.</p>
          <p>
            Les commandes font l&apos;objet d&apos;une vérification de disponibilité auprès de notre
            fournisseur avant confirmation définitive. Vous êtes informé si un produit s&apos;avère
            indisponible.
          </p>
        </>
      ),
    },
    {
      title: "Prix",
      body: (
        <>
          <p>
            Les prix sont indiqués en FCFA
            {settings.taxEnabled ? `, TVA (${settings.taxRate} %) incluse` : ""}. Le prix appliqué est celui en
            vigueur au moment de la commande ; il peut évoluer ensuite.
          </p>
          <p>Les frais de livraison s&apos;ajoutent au prix des produits et sont indiqués avant la confirmation.</p>
        </>
      ),
    },
    {
      title: "Commande et confirmation",
      body: (
        <>
          <p>
            Vous ajoutez vos produits au panier, puis vous renseignez votre nom, votre téléphone, votre région,
            votre ville et votre quartier. Aucun compte n&apos;est nécessaire.
          </p>
          <p>
            Une fois la commande enregistrée, une référence du type RB-0142 vous est attribuée. Elle vous sert,
            avec votre téléphone, à suivre votre commande.
          </p>
        </>
      ),
    },
    {
      title: "Paiement",
      body: (
        <>
          <p>
            <strong className="font-semibold text-foreground">À Yaoundé</strong> : paiement en espèces à la
            livraison, par MTN Mobile Money ou par Orange Money.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Dans les autres villes</strong> : paiement par
            Mobile Money (MTN Mobile Money ou Orange Money) uniquement.
          </p>
          <p>
            Le paiement par Mobile Money s&apos;effectue sur une page de paiement sécurisée : vous ne saisissez
            jamais vos codes sur notre site.
          </p>
        </>
      ),
    },
    {
      title: "Livraison et expédition",
      body: (
        <>
          <p>
            <strong className="font-semibold text-foreground">À Yaoundé</strong> : livraison standard, livraison
            express ou retrait. Le tarif correspondant au mode choisi s&apos;affiche avant la confirmation.
          </p>
          <p>
            <strong className="font-semibold text-foreground">Dans les autres villes</strong> : expédition de la
            commande. Les frais représentent {settings.expeditionFeePercent} % du montant de la commande et sont
            indiqués avant la confirmation.
          </p>
        </>
      ),
    },
    {
      title: "Suivi de commande, facture et reçu",
      body: (
        <>
          <p>
            La page{" "}
            <Link href="/suivi" className={linkClass}>
              Suivi de commande
            </Link>{" "}
            affiche l&apos;avancement de votre commande à partir de votre référence et de votre téléphone.
          </p>
          <p>
            Votre facture est téléchargeable depuis cette page. Le reçu est disponible lorsque la commande est
            payée et livrée.
          </p>
        </>
      ),
    },
    {
      title: "Données personnelles",
      body: (
        <>
          <p>
            Nous collectons votre nom, votre téléphone, votre adresse de livraison (région, ville, quartier) et,
            si vous créez un compte, votre e-mail (facultatif). Ces données servent à traiter, livrer et suivre
            votre commande.
          </p>
          <p>
            Pour toute question à ce sujet, contactez-nous. L&apos;identité de l&apos;éditeur figure dans les{" "}
            <Link href="/mentions-legales" className={linkClass}>
              mentions légales
            </Link>
            .
          </p>
        </>
      ),
    },
    {
      title: "Contact",
      body: (
        <>
          <p>
            Pour toute question sur une commande ou sur ces conditions :
            {settings.contactEmail ? (
              <>
                {" "}
                <a href={`mailto:${settings.contactEmail}`} className={linkClass}>
                  {settings.contactEmail}
                </a>
              </>
            ) : null}
            {whatsappHref ? (
              <>
                {settings.contactEmail ? " ou " : " "}
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  WhatsApp {settings.whatsappNumber}
                </a>
              </>
            ) : null}
            . Vous pouvez aussi utiliser la page{" "}
            <Link href="/contact" className={linkClass}>
              Contact
            </Link>
            .
          </p>
        </>
      ),
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
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">Conditions générales de vente</h1>
          <p className="mt-2 max-w-2xl text-ink-foreground/80">
            Commande, paiement, livraison et suivi sur {settings.storeName}.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Sommaire" className="rounded-xl border border-border bg-surface p-4 sm:p-5">
            <p className="font-display text-lg font-bold">Sommaire</p>
            <ol className="mt-3 grid gap-x-6 sm:grid-cols-2">
              {articles.map((article, index) => (
                <li key={article.title}>
                  <a
                    href={`#article-${index + 1}`}
                    className="flex min-h-11 items-center gap-2 text-sm hover:text-primary"
                  >
                    <span className="text-primary">{index + 1}.</span>
                    {article.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="mt-8 flex flex-col gap-8">
            {articles.map((article, index) => (
              <section key={article.title} id={`article-${index + 1}`} className="scroll-mt-24">
                <h2 className="font-display mb-2 text-xl font-bold sm:text-2xl">
                  {index + 1}. {article.title}
                </h2>
                <div className="flex flex-col gap-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {article.body}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
            Dernière mise à jour : {LAST_UPDATED}.
          </p>
        </div>
      </div>
    </div>
  );
}
