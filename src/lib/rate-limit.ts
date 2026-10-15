import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Deux limites cumulatives contre le brute-force à la connexion :
// - par IP, pour freiner une attaque qui essaie beaucoup de comptes depuis
//   une même source ;
// - par identifiant visé (email/téléphone tapé), pour freiner une attaque
//   ciblée sur un seul compte même répartie sur plusieurs IP.
// Une tentative bloquée par l'une ou l'autre échoue — pas besoin de préciser
// laquelle au client, ça ne ferait que renseigner un attaquant.
const loginLimiterByIp = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "5 m"),
      prefix: "ratelimit:login:ip",
    })
  : null;

const loginLimiterByIdentifier = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "5 m"),
      prefix: "ratelimit:login:identifier",
    })
  : null;

/**
 * Si Upstash n'est pas configuré (ex. environnement local sans clés) OU
 * injoignable (panne, DNS, etc.), on ne bloque jamais l'application faute de
 * protection — mieux vaut un login sans limite de débit qu'un site cassé.
 * Sans ce try/catch, une panne Upstash ferait planter l'action entière (le
 * client reste bloqué sur "en cours...") au lieu de juste désactiver la
 * limite temporairement.
 */
export async function checkLoginRateLimit(ip: string, identifier: string): Promise<boolean> {
  if (!loginLimiterByIp || !loginLimiterByIdentifier) return true;

  try {
    const [byIp, byIdentifier] = await Promise.all([
      loginLimiterByIp.limit(ip),
      loginLimiterByIdentifier.limit(identifier.trim().toLowerCase()),
    ]);
    return byIp.success && byIdentifier.success;
  } catch (error) {
    console.error("Upstash injoignable, limite de connexion désactivée temporairement", error);
    return true;
  }
}

// Même logique double (IP + cible visée) que le login, appliquée au suivi de
// commande public : empêche à la fois de bombarder plein de références
// depuis une IP, et d'essayer plein de numéros de téléphone sur UNE
// référence précise pour la "débloquer".
const trackingLimiterByIp = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(15, "5 m"), prefix: "ratelimit:tracking:ip" })
  : null;

const trackingLimiterByReference = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, "5 m"), prefix: "ratelimit:tracking:ref" })
  : null;

export async function checkTrackingRateLimit(ip: string, reference: string): Promise<boolean> {
  if (!trackingLimiterByIp || !trackingLimiterByReference) return true;

  try {
    const [byIp, byReference] = await Promise.all([
      trackingLimiterByIp.limit(ip),
      trackingLimiterByReference.limit(reference),
    ]);
    return byIp.success && byReference.success;
  } catch (error) {
    console.error("Upstash injoignable, limite de suivi de commande désactivée temporairement", error);
    return true;
  }
}

// Limite propre à authorize() : séparée de celle de l'action de connexion (qui
// donne un message clair au client), pour que la route /api/auth publique ne
// soit pas un moyen de contourner la limite. Même logique double IP + cible.
const credentialsLimiterByIp = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, "5 m"), prefix: "ratelimit:credentials:ip" })
  : null;
const credentialsLimiterByTarget = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(8, "5 m"), prefix: "ratelimit:credentials:target" })
  : null;

export async function checkCredentialsRateLimit(ip: string, target: string): Promise<boolean> {
  if (!credentialsLimiterByIp || !credentialsLimiterByTarget) return true;
  try {
    const [byIp, byTarget] = await Promise.all([
      credentialsLimiterByIp.limit(ip),
      credentialsLimiterByTarget.limit(target),
    ]);
    return byIp.success && byTarget.success;
  } catch (error) {
    console.error("Upstash injoignable, limite de connexion désactivée temporairement", error);
    return true;
  }
}

// Formulaires publics (inscription, commande, devis, réservation, panier) :
// freine le spam et la croissance artificielle de la base. Une limite par
// action et par IP.
const publicLimiters = new Map<string, Ratelimit>();

export async function checkPublicActionRateLimit(action: string, ip: string, max = 20): Promise<boolean> {
  if (!redis) return true;
  try {
    let limiter = publicLimiters.get(action);
    if (!limiter) {
      limiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, "10 m"),
        prefix: `ratelimit:public:${action}`,
      });
      publicLimiters.set(action, limiter);
    }
    return (await limiter.limit(ip)).success;
  } catch (error) {
    console.error("Upstash injoignable, limite désactivée temporairement", error);
    return true;
  }
}

/** IP du visiteur (Vercel place l'IP réelle en tête de x-forwarded-for). */
export async function getClientIp(): Promise<string> {
  return (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
