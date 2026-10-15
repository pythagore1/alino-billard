import Image from "next/image";

/**
 * Fond de bannière : photo optimisée par next/image (au lieu d'un
 * background-image CSS qui chargeait le PNG brut de ~2 Mo sur mobile) avec le
 * même dégradé qu'avant, ou le dégradé vert billard tant qu'aucune photo n'est
 * déposée dans public/. À placer en premier enfant d'une section `relative
 * overflow-hidden` ; le contenu de la section doit être en `relative`.
 */
export function BannerBackground({
  photoUrl,
  priority = false,
  inset = true,
}: {
  photoUrl: string | null;
  priority?: boolean;
  inset?: boolean;
}) {
  return (
    <>
      {photoUrl ? (
        <>
          <Image
            src={photoUrl}
            alt=""
            fill
            sizes="100vw"
            priority={priority}
            className="object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #0a0a0a 15%, rgba(10,10,10,0.55) 60%, rgba(10,10,10,0.2) 100%)",
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 120% 100% at 20% 0%, var(--color-forest-light) 0%, var(--color-forest) 35%, var(--color-ink) 75%)",
          }}
        />
      )}
      {inset && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 shadow-[inset_0_-40px_40px_-15px_rgba(0,0,0,0.85)]"
        />
      )}
    </>
  );
}
