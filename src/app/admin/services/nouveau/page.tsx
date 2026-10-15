import { ServiceForm } from "@/components/admin/service-form";

export default function NewServicePage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Nouveau service</h1>
      <ServiceForm />
    </div>
  );
}
