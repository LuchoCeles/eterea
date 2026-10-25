import { redirect } from "next/navigation";
import { AdminEditor } from "@/components/admin/AdminEditor";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { loadContentSnapshot } from "@/server/content";
import { getCurrentUser, isAdmin } from "@/server/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel de administración — Etérea", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  if (!(await isAdmin(user.id))) redirect("/");
  const content = await loadContentSnapshot();
  return (
    <ContentProvider initialContent={content}>
      <AdminEditor email={user.email} />
    </ContentProvider>
  );
}