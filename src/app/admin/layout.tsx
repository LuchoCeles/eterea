import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AdminEditor } from "@/components/admin/AdminEditor";
import { AdminSkeleton } from "@/components/loading/AdminSkeleton";
import { ContentProvider } from "@/components/providers/ContentProvider";
import { getCurrentUser, isAdmin } from "@/server/auth";
import { loadContentSnapshot } from "@/server/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel de administración — Etérea", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}

async function AdminLayoutContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth");
  if (!(await isAdmin(user.id))) redirect("/");
  const content = await loadContentSnapshot();

  return (
    <ContentProvider initialContent={content}>
      <AdminEditor email={user.email}>{children}</AdminEditor>
    </ContentProvider>
  );
}
