import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createTestCategory, createTestProduct, cleanupTestCategory, uniqueSlug } from "@/test-utils/db-fixtures";

// Reproduit la logique de updateDeliveryStatus() (server/actions/delivery-tracking.ts).
describe("assignation et suivi de livraison", () => {
  let categoryId: string;
  let orderId: string;
  let deliveryId: string;
  let courierId: string;

  beforeAll(async () => {
    const category = await createTestCategory();
    categoryId = category.id;
    const product = await createTestProduct(categoryId, { price: 5000 });

    const courier = await db.user.create({
      data: {
        name: uniqueSlug("livreur"),
        email: `${uniqueSlug("livreur")}@example.com`,
        passwordHash: "test-hash-not-used",
        role: "DELIVERY",
      },
    });
    courierId = courier.id;

    const order = await db.order.create({
      data: {
        orderNumber: uniqueSlug("commande"),
        guestName: "Client Livraison",
        guestPhone: "+237600000000",
        subtotal: 5000,
        shippingFee: 0,
        total: 5000,
        region: "Littoral",
        address: "Adresse test",
        city: "Douala",
        deliveryMethod: "STANDARD",
        paymentMethod: "CASH_ON_DELIVERY",
        orderStatus: "CONFIRMED",
        paymentStatus: "PENDING",
        items: { create: [{ productId: product.id, productName: product.name, unitPrice: 5000, quantity: 1 }] },
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    await db.orderStatusHistory.deleteMany({ where: { orderId } });
    await db.delivery.deleteMany({ where: { orderId } });
    await db.orderItem.deleteMany({ where: { orderId } });
    await db.order.delete({ where: { id: orderId } });
    await db.user.delete({ where: { id: courierId } });
    await cleanupTestCategory(categoryId);
  });

  it("assigne un livreur à la commande", async () => {
    const delivery = await db.delivery.create({
      data: { orderId, assignedToId: courierId, status: "ASSIGNED" },
    });
    deliveryId = delivery.id;
    expect(delivery.status).toBe("ASSIGNED");
    expect(delivery.assignedToId).toBe(courierId);
  });

  it("le livreur voit bien la livraison qui lui est assignée", async () => {
    const myDeliveries = await db.delivery.findMany({ where: { assignedToId: courierId } });
    expect(myDeliveries.some((d) => d.id === deliveryId)).toBe(true);
  });

  it("marquer la livraison DELIVERED fait passer la commande à DELIVERED/PAID (paiement à la livraison)", async () => {
    const order = await db.order.findUniqueOrThrow({ where: { id: orderId } });

    await db.$transaction(async (tx) => {
      await tx.delivery.update({ where: { id: deliveryId }, data: { status: "DELIVERED", deliveredAt: new Date() } });
      await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: "DELIVERED",
          paymentStatus: order.paymentMethod === "CASH_ON_DELIVERY" ? "PAID" : order.paymentStatus,
        },
      });
      await tx.orderStatusHistory.create({
        data: { orderId, fromStatus: order.orderStatus, toStatus: "DELIVERED" },
      });
    });

    const finalOrder = await db.order.findUniqueOrThrow({ where: { id: orderId } });
    const finalDelivery = await db.delivery.findUniqueOrThrow({ where: { id: deliveryId } });

    expect(finalOrder.orderStatus).toBe("DELIVERED");
    expect(finalOrder.paymentStatus).toBe("PAID");
    expect(finalDelivery.status).toBe("DELIVERED");
    expect(finalDelivery.deliveredAt).not.toBeNull();
  });
});
