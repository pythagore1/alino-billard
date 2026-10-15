import { notFound } from "next/navigation";
import { getServiceForAdmin } from "@/server/actions/services";
import { ServiceForm } from "@/components/admin/service-form";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getServiceForAdmin(id);
  if (!service) notFound();

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Modifier le service</h1>
      <ServiceForm service={service} />
    </div>
  );
}
