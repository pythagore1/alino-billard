import Link from "next/link";
import { cacheLife } from "next/cache";
import { getSiteSettings } from "@/lib/site-settings";

// L'année du copyright : calculée une fois puis mise en cache (une valeur
// "instable" comme la date courante ne peut pas être lue directement pendant
// le rendu statique).
async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function SiteFooter() {
  const settings = await getSiteSettings();
  const year = await getCurrentYear();

  return (
    <footer className="mt-auto bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-primary">{settings.storeName}</p>
          <p className="mt-2 text-sm text-ink-foreground/70">
            {settings.storeName} est une entreprise spécialisée dans la vente de queues, boules, procédés,
            étuis, tapis et accessoires de pool américain (8-ball, 9-ball, 10-ball).
          </p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Contact</p>
          <ul className="flex flex-col gap-1 text-sm text-ink-foreground/70">
            {settings.whatsappNumber && (
              <li>
                <a
                  href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  WhatsApp : {settings.whatsappNumber}
                </a>
              </li>
            )}
            {settings.contactPhone && <li>Tél : {settings.contactPhone}</li>}
            {settings.contactEmail && <li>Email : {settings.contactEmail}</li>}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-primary">Boutique</p>
          <ul className="flex flex-col gap-1 text-sm text-ink-foreground/70">
            <li>
              <Link href="/guide" className="hover:text-primary">
                Guide d&apos;achat
              </Link>
            </li>
            <li>
              <Link href="/suivi" className="hover:text-primary">
                Suivi de commande
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="hover:text-primary">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="hover:text-primary">
                Conditions générales de vente
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-white/10 px-4 py-4 text-center text-xs text-ink-foreground/50 sm:flex-row sm:justify-between">
        <span>
          © {year} {settings.storeName}. Tous droits réservés.
        </span>
        <span>Paiement à la livraison ou en ligne (MTN/Orange Money).</span>
      </div>
    </footer>
  );
}
