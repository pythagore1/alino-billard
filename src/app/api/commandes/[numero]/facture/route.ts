import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import { formatOrderReference } from "@/lib/order-reference";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";

/**
 * Facture PDF d'une commande — toujours disponible dès que la commande
 * existe (précise si payée ou à payer à la livraison). Accès par le jeton
 * long `orderNumber` dans l'URL, même modèle de sécurité que la page de
 * confirmation publique : le connaître suffit, pas besoin de session.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;

  const [order, settings] = await Promise.all([
    db.order.findUnique({ where: { orderNumber: numero }, include: { items: true } }),
    getSiteSettings(),
  ]);

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    InvoiceDocument({ order, settings, kind: "facture" }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${formatOrderReference(order.sequenceNumber)}.pdf"`,
    },
  });
}
