import { AdminSectionEditor } from "@/components/admin/AdminEditor";
import { loadInstagramConnectionInfo } from "@/server/instagram";

export default async function AdminPage() {
  const connection = await loadInstagramConnectionInfo().catch(() => null);
  return <AdminSectionEditor section="instagram" instagramStatus={connection
    ? { saved: connection.connected, username: connection.username }
    : { saved: false, username: null, error: true }} />;
}
