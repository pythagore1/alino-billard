import crypto from "node:crypto";

/**
 * Signature Monetbil, recopiée de leur bibliothèque officielle (monetbil-php,
 * Monetbil::sign / checkSign) : on retire le champ `sign`, on trie les champs
 * restants par nom, on concatène leurs VALEURS sans séparateur, on préfixe le
 * « secret de service » et on prend le MD5 hexadécimal.
 *
 * MD5 est un choix de Monetbil, pas le nôtre : c'est pourquoi le site ne se
 * fie jamais à cette signature seule pour marquer une commande payée (voir
 * confirmOrderPayment : le statut est relu directement chez Monetbil).
 */
export function monetbilSign(secret: string, params: Record<string, string>): string {
  const values = Object.keys(params)
    .sort()
    .map((key) => params[key])
    .join("");
  return crypto.createHash("md5").update(secret + values).digest("hex");
}

/** Vérifie le champ `sign` d'une notification ou d'un retour client (comparaison à temps constant). */
export function isValidMonetbilSign(params: Record<string, string>, secret: string): boolean {
  const received = params.sign;
  if (!received) return false;
  const { sign: _sign, ...rest } = params;
  void _sign;
  const expected = Buffer.from(monetbilSign(secret, rest));
  const actual = Buffer.from(String(received).trim().toLowerCase());
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

/** Référence de paiement envoyée à Monetbil (`payment_ref`) : unique à chaque tentative. */
export function newMonetbilPaymentRef(orderNumber: string): string {
  const hash = crypto
    .createHash("sha256")
    .update(`${orderNumber}:${Date.now()}:${crypto.randomBytes(4).toString("hex")}`)
    .digest("hex")
    .slice(0, 20);
  return `mb${hash}`;
}
