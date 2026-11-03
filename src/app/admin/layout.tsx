import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminEditor } from "@/components/admin/AdminEditor";
import { AdminContentSkeleton } from "@/components/loading/AdminSkeleton";
import { ContentProvider, ContentSnapshotHydrator } from "@/components/providers/ContentProvider";
import { defaults } from "@/lib/content";
import { COOKIE_NAME, getCurrentUser, readSessionToken } from "@/server/auth";
import { loadContentSnapshot } from "@/server/content";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel de administración — Etérea", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    redirect(readSessionToken(token) ? "/auth?session-check=1" : "/auth");
  }
  if (!user.isAdmin) redirect("/");
  const owner = user.isOwner;

  return (
    <ContentProvider initialContent={defaults}>
      <AdminEditor name={user.name || user.username} owner={owner}>
        <Suspense fallback={<AdminContentSkeleton />}>
          <AdminContentLayout>{children}</AdminContentLayout>
        </Suspense>
      </AdminEditor>
    </ContentProvider>
  );
}

async function AdminContentLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const content = await loadContentSnapshot({ strict: true });
  return (
    <ContentSnapshotHydrator initialContent={content} fallback={<AdminContentSkeleton />}>
      {children}
    </ContentSnapshotHydrator>
  );
}
