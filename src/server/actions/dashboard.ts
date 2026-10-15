"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/guard";

const CAN_VIEW_DASHBOARD = ["ADMIN", "SUPER_ADMIN"] as const;

export async function getDashboardStats() {
  await requireRole([...CAN_VIEW_DASHBOARD]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    productCount,
    categoryCount,
    orderCount,
    pendingOrderCount,
    totalRevenue,
    monthRevenue,
    recentOrders,
    topProductsRaw,
    courierUsers,
  ] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.category.count(),
    db.order.count(),
    db.order.count({
      where: { orderStatus: { in: ["NEW", "AWAITING_CONFIRMATION", "CHECKING_AVAILABILITY"] } },
    }),
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    db.order.aggregate({
      where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        sequenceNumber: true,
        guestName: true,
        total: true,
        orderStatus: true,
        createdAt: true,
      },
    }),
    db.orderItem.groupBy({
      by: ["productId", "productName"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.user.findMany({
      where: { role: "DELIVERY" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true },
    }),
  ]);

  // Une requête groupée par livreur serait plus efficace, mais le nombre de
  // livreurs reste faible pour ce type de commerce — on privilégie la
  // lisibilité (assignées vs effectivement livrées, par personne).
  const courierStats = await Promise.all(
    courierUsers.map(async (courier) => {
      const [assigned, delivered] = await Promise.all([
        db.delivery.count({ where: { assignedToId: courier.id } }),
        db.delivery.count({ where: { assignedToId: courier.id, status: "DELIVERED" } }),
      ]);
      return { id: courier.id, name: courier.name, isActive: courier.isActive, assigned, delivered };
    }),
  );

  const topProducts = topProductsRaw.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    quantitySold: p._sum.quantity ?? 0,
  }));

  return {
    productCount,
    categoryCount,
    orderCount,
    pendingOrderCount,
    totalRevenue: totalRevenue._sum.total ?? 0,
    monthRevenue: monthRevenue._sum.total ?? 0,
    recentOrders,
    topProducts,
    courierStats,
  };
}
