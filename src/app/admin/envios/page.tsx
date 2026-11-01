import { redirect } from "next/navigation";
import { AdminShippingSettingsEditor } from "@/components/admin/AdminShippingSettingsEditor";
import { getCurrentUser, isAdmin } from "@/server/auth";
import { getAdminShippingSettings } from "@/server/shipping-settings";

export default async function AdminShippingPage() {
  const user = await getCurrentUser();
  if (!user || !(await isAdmin(user.id))) redirect("/admin");
  return <AdminShippingSettingsEditor initial={await getAdminShippingSettings()} />;
}
