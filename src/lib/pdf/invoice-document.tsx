import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatOrderReference } from "@/lib/order-reference";
import { DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/order-status";

const GOLD = "#B8862F";
const INK = "#16130A";
const MUTED = "#6B6455";
const BORDER = "#E0DACB";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: INK, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  storeName: { fontSize: 18, fontWeight: 700, color: GOLD },
  muted: { color: MUTED, marginTop: 2 },
  docTitle: { fontSize: 16, fontWeight: 700, textAlign: "right" },
  docMeta: { color: MUTED, textAlign: "right", marginTop: 2 },
  section: { marginBottom: 18 },
  sectionLabel: { fontSize: 9, textTransform: "uppercase", color: MUTED, marginBottom: 4, letterSpacing: 1 },
  table: { borderTopWidth: 1, borderTopColor: BORDER },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
    backgroundColor: "#F7F2E7",
  },
  colName: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 90, textAlign: "right" },
  colTotal: { width: 90, textAlign: "right" },
  totalsBlock: { marginTop: 12, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  totalsRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    fontWeight: 700,
    fontSize: 12,
  },
  statusBadge: {
    marginTop: 16,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
  },
  footer: { position: "absolute", bottom: 30, left: 36, right: 36, fontSize: 8, color: MUTED, textAlign: "center" },
});

export type InvoiceOrder = {
  sequenceNumber: number;
  createdAt: Date;
  guestName: string;
  guestPhone: string;
  address: string;
  city: string;
  region: string;
  deliveryMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: { productName: string; quantity: number; unitPrice: number }[];
  delivery?: { deliveredAt: Date | null } | null;
};

export type InvoiceSettings = {
  storeName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  whatsappNumber: string | null;
  taxEnabled: boolean;
  taxRate: number;
  currency: string;
};

// `toLocaleString("fr-FR")` insère une espace fine insécable (U+202F) comme
// séparateur de milliers — absente de l'encodage des polices standard PDF
// (Helvetica et consorts), ce qui produit un caractère cassé à l'affichage.
// On regroupe donc les chiffres à la main avec une espace normale.
function formatMoney(value: number, currency: string): string {
  const grouped = Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${grouped} ${currency}`;
}

/**
 * Facture (émise à la commande, précise si payée ou à payer à la livraison)
 * ou reçu (émis seulement une fois payé + livré/récupéré) — même gabarit,
 * seul le titre et le bandeau de statut changent selon `kind`.
 */
export function InvoiceDocument({
  order,
  settings,
  kind,
}: {
  order: InvoiceOrder;
  settings: InvoiceSettings;
  kind: "facture" | "recu";
}) {
  const reference = formatOrderReference(order.sequenceNumber);
  const isPaid = order.paymentStatus === "PAID";
  const docTitle = kind === "facture" ? "FACTURE" : "REÇU";

  return (
    <Document title={`${docTitle} ${reference}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.storeName}>{settings.storeName}</Text>
            {settings.contactPhone && <Text style={styles.muted}>Tél : {settings.contactPhone}</Text>}
            {settings.whatsappNumber && <Text style={styles.muted}>WhatsApp : {settings.whatsappNumber}</Text>}
            {settings.contactEmail && <Text style={styles.muted}>{settings.contactEmail}</Text>}
          </View>
          <View>
            <Text style={styles.docTitle}>
              {docTitle} {reference}
            </Text>
            <Text style={styles.docMeta}>
              {kind === "facture"
                ? `Émise le ${order.createdAt.toLocaleDateString("fr-FR")}`
                : `Paiement reçu${order.delivery?.deliveredAt ? ` le ${order.delivery.deliveredAt.toLocaleDateString("fr-FR")}` : ""}`}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Client</Text>
          <Text>{order.guestName}</Text>
          <Text style={styles.muted}>{order.guestPhone}</Text>
          <Text style={styles.muted}>
            {order.address}, {order.city} ({order.region})
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colName, { fontWeight: 700 }]}>Article</Text>
            <Text style={[styles.colQty, { fontWeight: 700 }]}>Qté</Text>
            <Text style={[styles.colPrice, { fontWeight: 700 }]}>Prix unit.</Text>
            <Text style={[styles.colTotal, { fontWeight: 700 }]}>Total</Text>
          </View>
          {order.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colName}>{item.productName}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatMoney(item.unitPrice, settings.currency)}</Text>
              <Text style={styles.colTotal}>
                {formatMoney(item.unitPrice * item.quantity, settings.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text>Sous-total</Text>
            <Text>{formatMoney(order.subtotal, settings.currency)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Livraison ({DELIVERY_METHOD_LABELS[order.deliveryMethod] ?? order.deliveryMethod})</Text>
            <Text>{order.shippingFee === 0 ? "Gratuite" : formatMoney(order.shippingFee, settings.currency)}</Text>
          </View>
          {settings.taxEnabled && (
            <View style={styles.totalsRow}>
              <Text>dont TVA ({settings.taxRate}%)</Text>
              <Text>{formatMoney(Math.round((order.total * settings.taxRate) / (100 + settings.taxRate)), settings.currency)}</Text>
            </View>
          )}
          <View style={styles.totalsRowFinal}>
            <Text>Total</Text>
            <Text>{formatMoney(order.total, settings.currency)}</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isPaid ? "#E4F3EA" : "#FBF0DC", color: isPaid ? "#1E6B3E" : "#8A6423" },
          ]}
        >
          <Text>
            {kind === "recu"
              ? `Payé — ${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}`
              : isPaid
                ? `Payé — ${PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}`
                : "À payer à la livraison"}
          </Text>
        </View>

        <Text style={styles.footer}>
          {settings.taxEnabled
            ? `${settings.storeName} — document généré automatiquement.`
            : `${settings.storeName} — régime de l'impôt général synthétique (IGS), TVA non applicable. Document généré automatiquement.`}
        </Text>
      </Page>
    </Document>
  );
}
