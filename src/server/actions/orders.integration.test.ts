import { afterAll, beforeAll, describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { createTestCategory, createTestProduct, cleanupTestCategory } from "@/test-utils/db-fixtures";

function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(4).toString("hex");
  return `TEST-${datePart}-${randomPart}`;
}

// Reproduit la logique de createOrder() (server/actions/orders.ts) : elle
// dépend de cookies()/le panier serveur, donc on teste ici directement les
// calculs et écritures Prisma qu'elle effectue.
describe("création de commande", () => {
  let categoryId: string;
  let zoneId: string;
  const createdOrderIds: string[] = [];

  beforeAll(async () => {
    const category = await createTestCategory();
    categoryId = category.id;

    const zone = await db.deliveryZone.create({ data: { name: `test-zone-${Date.now()}`, isActive: true } });
    zoneId = zone.id;
    await db.shippingRate.create({ data: { zoneId, method: "STANDARD", price: 2000 } });
    await db.shippingRate.create({ data: { zoneId, method: "EXPRESS", price: 5000, freeAbove: 50000 } });
  });

  afterAll(async () => {
    for (const orderId of createdOrderIds) {
      await db.orderStatusHistory.deleteMany({ where: { orderId } });
      await db.orderItem.deleteMany({ where: { orderId } });
      await db.order.delete({ where: { id: orderId } }).catch(() => {});
    }
    await db.shippingRate.deleteMany({ where: { zoneId } });
    await db.deliveryZone.delete({ where: { id: zoneId } });
    await cleanupTestCategory(categoryId);
  });

  it("calcule correctement le sous-total, les frais de livraison et le total", async () => {
    const product = await createTestProduct(categoryId, { price: 7000 });
    const quantity = 3;
    const subtotal = product.price * quantity;

    const rate = await db.shippingRate.findFirstOrThrow({ where: { zoneId, method: "STANDARD" } });
    const shippingFee = rate.freeAbove && subtotal >= rate.freeAbove ? 0 : rate.price;
    const total = subtotal + shippingFee;

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        guestName: "Test Client",
        guestPhone: "+237600000000",
        subtotal,
        shippingFee,
        total,
        deliveryZoneId: zoneId,
        region: "Littoral",
        address: "Adresse test",
        city: "Douala",
        deliveryMethod: "STANDARD",
        paymentMethod: "CASH_ON_DELIVERY",
        orderStatus: "NEW",
        items: {
          create: [{ productId: product.id, productName: product.name, unitPrice: product.price, quantity }],
        },
        statusHistory: { create: { toStatus: "NEW" } },
      },
    });
    createdOrderIds.push(order.id);

    expect(order.subtotal).toBe(21000);
    expect(order.shippingFee).toBe(2000);
    expect(order.total).toBe(23000);
  });

  it("applique la livraison gratuite au-delà du seuil freeAbove", async () => {
    const product = await createTestProduct(categoryId, { price: 60000 });
    const subtotal = product.price;

    const rate = await db.shippingRate.findFirstOrThrow({ where: { zoneId, method: "EXPRESS" } });
    const shippingFee = rate.freeAbove && subtotal >= rate.freeAbove ? 0 : rate.price;
    expect(shippingFee).toBe(0);

    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        guestName: "Test Client",
        guestPhone: "+237600000000",
        subtotal,
        shippingFee,
        total: subtotal + shippingFee,
        deliveryZoneId: zoneId,
        region: "Littoral",
        address: "Adresse test",
        city: "Douala",
        deliveryMethod: "EXPRESS",
        paymentMethod: "CASH_ON_DELIVERY",
        orderStatus: "NEW",
        items: { create: [{ productId: product.id, productName: product.name, unitPrice: product.price, quantity: 1 }] },
        statusHistory: { create: { toStatus: "NEW" } },
      },
    });
    createdOrderIds.push(order.id);

    expect(order.shippingFee).toBe(0);
    expect(order.total).toBe(60000);
  });

  it("fige le nom et le prix du produit au moment de la commande (snapshot)", async () => {
    const product = await createTestProduct(categoryId, { price: 1000 });
    const order = await db.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        guestName: "Test Client",
        guestPhone: "+237600000000",
        subtotal: 1000,
        shippingFee: 0,
        total: 1000,
        region: "Littoral",
        address: "Adresse test",
        city: "Douala",
        deliveryMethod: "PICKUP",
        paymentMethod: "CASH_ON_DELIVERY",
        orderStatus: "NEW",
        items: { create: [{ productId: product.id, productName: product.name, unitPrice: product.price, quantity: 1 }] },
      },
      include: { items: true },
    });
    createdOrderIds.push(order.id);

    // Le produit change de prix après la commande...
    await db.product.update({ where: { id: product.id }, data: { price: 999999 } });

    // ...mais l'article de la commande garde le prix figé au moment de l'achat.
    const item = await db.orderItem.findFirstOrThrow({ where: { orderId: order.id } });
    expect(item.unitPrice).toBe(1000);
  });

  it("garantit l'unicité du numéro de commande", async () => {
    const orderNumber = generateOrderNumber();
    const product = await createTestProduct(categoryId);

    const order = await db.order.create({
      data: {
        orderNumber,
        guestName: "Test Client",
        guestPhone: "+237600000000",
        subtotal: 5000,
        shippingFee: 0,
        total: 5000,
        region: "Littoral",
        address: "Adresse test",
        city: "Douala",
        deliveryMethod: "PICKUP",
        paymentMethod: "CASH_ON_DELIVERY",
        orderStatus: "NEW",
        items: { create: [{ productId: product.id, productName: product.name, unitPrice: 5000, quantity: 1 }] },
      },
    });
    createdOrderIds.push(order.id);

    await expect(
      db.order.create({
        data: {
          orderNumber, // même numéro
          guestName: "Autre Client",
          guestPhone: "+237600000001",
          subtotal: 1000,
          shippingFee: 0,
          total: 1000,
          region: "Centre",
          address: "Autre adresse",
          city: "Yaoundé",
          deliveryMethod: "PICKUP",
          paymentMethod: "CASH_ON_DELIVERY",
          orderStatus: "NEW",
          items: { create: [{ productId: product.id, productName: product.name, unitPrice: 1000, quantity: 1 }] },
        },
      }),
    ).rejects.toThrow();
  });
});
