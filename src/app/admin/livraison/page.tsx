import { listZonesForAdmin } from "@/server/actions/delivery";
import { DeliveryZoneManager } from "@/components/admin/delivery-zone-manager";

export default async function AdminDeliveryPage() {
  const zones = await listZonesForAdmin();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Livraison</h1>
      <DeliveryZoneManager zones={zones} />
    </div>
  );
}
