import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";
import { formatOrderReference } from "@/lib/order-reference";
import { InvoiceDocument } from "@/lib/pdf/invoice-document";

/**
 * Reçu PDF — seulement une fois l'argent réellement encaissé ET la commande
 * livrée/récupérée (paymentStatus=PAID + orderStatus=DELIVERED). Avant ça,
 * ce n'est qu'une facture (voir /facture) : le reçu atteste un paiement
 * effectif, pas une simple intention de payer.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;

  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { orderNumber: numero },
      include: { items: true, delivery: true },
    }),
    getSiteSettings(),
  ]);

  if (!order) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  if (order.paymentStatus !== "PAID" || order.orderStatus !== "DELIVERED") {
    return NextResponse.json(
      { error: "Le reçu n'est disponible qu'une fois la commande payée et livrée/récupérée." },
      { status: 409 },
    );
  }

  const buffer = await renderToBuffer(
    InvoiceDocument({ order, settings, kind: "recu" }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recu-${formatOrderReference(order.sequenceNumber)}.pdf"`,
    },
  });
}
