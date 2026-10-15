import { getSiteSettings } from "@/lib/site-settings";

/**
 * Bouton flottant WhatsApp (cahier des charges section 17) : le client peut
 * poser une question ou demander une disponibilité en un clic. Numéro et
 * message configurables — rien n'est codé en dur, tout vient de SiteSettings.
 */
export async function WhatsAppButton({
  message = "Bonjour Alino Billard & Accessoires, j'aimerais avoir des renseignements.",
}: {
  message?: string;
}) {
  const settings = await getSiteSettings();
  if (!settings.whatsappNumber) return null;

  const phone = settings.whatsappNumber.replace(/[^0-9]/g, "");
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="wa-fab fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex h-12 w-12 items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 sm:bottom-5 sm:right-5 sm:h-auto sm:w-auto sm:px-4 sm:py-3"
      aria-label="Contacter Alino Billard & Accessoires sur WhatsApp"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current sm:h-5 sm:w-5" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.09h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.15 8.15 0 0 1-1.26-4.33c0-4.5 3.66-8.17 8.16-8.17 2.18 0 4.23.85 5.77 2.39a8.11 8.11 0 0 1 2.39 5.78c0 4.5-3.67 8.2-8.08 8.2Zm4.47-6.13c-.24-.12-1.45-.72-1.68-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.78.96-.14.16-.29.18-.53.06-.24-.12-1.02-.38-1.95-1.21-.72-.64-1.2-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.46-.28Z" />
      </svg>
      <span className="hidden sm:inline">Besoin d&apos;aide ?</span>
    </a>
  );
}
