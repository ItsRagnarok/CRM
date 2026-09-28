import { requireAdminContext } from "@/lib/auth";
import { NewCompanyForm } from "./new-company-form";

export default async function NewCompanyPage() {
  await requireAdminContext();
  return <NewCompanyForm />;
}
