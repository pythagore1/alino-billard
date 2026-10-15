import type { DeliveryStatus } from "@/generated/prisma/enums";

// Progression attendue d'une livraison : jamais en arrière une fois avancée
// (ex: repasser de "Livrée" à "En route" n'a pas de sens), et "En attente
// d'assignation" n'est jamais un statut que le livreur choisit lui-même —
// une livraison n'existe en base qu'à partir du moment où elle est assignée
// (assignDelivery crée toujours la ligne avec le statut ASSIGNED).
const PROGRESSION: DeliveryStatus[] = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED"];
const TERMINAL: DeliveryStatus[] = ["DELIVERED", "FAILED"];

/**
 * Statuts que le livreur (ou l'admin) peut choisir depuis le statut actuel :
 * toujours le statut courant (pas de changement) + l'étape suivante + un
 * repli possible vers "Échec" à toute étape active. Une livraison terminée
 * (livrée ou en échec) ne peut plus changer par ce chemin.
 */
export function getAllowedDeliveryStatuses(current: DeliveryStatus): DeliveryStatus[] {
  if (TERMINAL.includes(current)) return [current];

  const idx = PROGRESSION.indexOf(current);
  if (idx === -1) return [current]; // PENDING : cas normalement inatteignable dans le flux actuel

  const next: DeliveryStatus[] = [current];
  if (idx + 1 < PROGRESSION.length) next.push(PROGRESSION[idx + 1]);
  next.push("FAILED");
  return next;
}

export function isValidDeliveryStatusTransition(from: DeliveryStatus, to: DeliveryStatus): boolean {
  return getAllowedDeliveryStatuses(from).includes(to);
}

/**
 * Un livreur "prend la main" dès qu'il a physiquement récupéré le colis —
 * à partir de là, changer de livreur n'a plus de sens opérationnel. On
 * autorise la réassignation avant ce point (ASSIGNED), et après un échec
 * (FAILED, pour retenter la livraison), mais pas pendant le transport ni
 * une fois livré.
 */
export function canReassignDelivery(status: DeliveryStatus | null): boolean {
  if (status === null) return true;
  return status === "ASSIGNED" || status === "FAILED";
}
